import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { garbageCollectLocalState, loadMemoryGcConfig } from "./gc.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-06-13T00:00:00Z");

let base: string;

function sessionsDir(): string {
  return join(base, ".agents", "state", "sessions");
}
function serenaDir(): string {
  return join(base, ".serena", "memories");
}

function mkSession(name: string, ageDays: number): void {
  const dir = join(sessionsDir(), name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "events.jsonl"), "{}\n");
  const t = (NOW - ageDays * DAY_MS) / 1000;
  utimesSync(dir, t, t);
}

function mkSerena(name: string, ageDays: number): void {
  const path = join(serenaDir(), name);
  writeFileSync(path, "x");
  const t = (NOW - ageDays * DAY_MS) / 1000;
  utimesSync(path, t, t);
}

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), "oma-gc-"));
  mkdirSync(sessionsDir(), { recursive: true });
  mkdirSync(serenaDir(), { recursive: true });
});

afterEach(() => {
  rmSync(base, { recursive: true, force: true });
});

describe("garbageCollectLocalState — L1 sessions", () => {
  it("keeps the most-recent N sessions and prunes the rest", () => {
    for (let i = 0; i < 6; i++) mkSession(`oma-s${i}`, i); // s0 newest … s5 oldest
    const r = garbageCollectLocalState({
      baseDir: base,
      keep: 3,
      scope: "sessions",
      nowMs: NOW,
    });
    expect(r.prunedSessions.length).toBe(3);
    expect(r.keptSessions).toBe(3);
    expect(existsSync(join(sessionsDir(), "oma-s0"))).toBe(true);
    expect(existsSync(join(sessionsDir(), "oma-s5"))).toBe(false);
  });

  it("never prunes the active session even when it is the oldest", () => {
    mkSession("oma-active", 999); // oldest
    for (let i = 0; i < 3; i++) mkSession(`oma-n${i}`, i);
    writeFileSync(
      join(sessionsDir(), "_index.json"),
      JSON.stringify({ active: { main: "oma-active" } }),
    );
    const r = garbageCollectLocalState({
      baseDir: base,
      keep: 1,
      scope: "sessions",
      nowMs: NOW,
    });
    expect(existsSync(join(sessionsDir(), "oma-active"))).toBe(true);
    expect(r.prunedSessions.some((p) => p.endsWith("oma-active"))).toBe(false);
  });

  it("dry-run reports the plan without deleting", () => {
    for (let i = 0; i < 4; i++) mkSession(`oma-d${i}`, i);
    const r = garbageCollectLocalState({
      baseDir: base,
      keep: 1,
      scope: "sessions",
      dryRun: true,
      nowMs: NOW,
    });
    expect(r.prunedSessions.length).toBe(3);
    expect(existsSync(join(sessionsDir(), "oma-d3"))).toBe(true);
  });
});

describe("garbageCollectLocalState — Serena", () => {
  it("prunes session-cost always and aged run artifacts, keeps curated", () => {
    mkSerena("session-cost-probe.md", 0); // ephemeral, age-independent
    mkSerena("progress-old.md", 40); // aged > 30d → prune
    mkSerena("result-recent.md", 5); // aged < 30d → keep
    mkSerena("orchestrator-session-x.md", 99); // aged > 30d → prune
    mkSerena("code_style.md", 999); // curated → keep
    mkdirSync(join(serenaDir(), "decisions"), { recursive: true });
    writeFileSync(join(serenaDir(), "decisions", "d.md"), "keep");

    const r = garbageCollectLocalState({
      baseDir: base,
      scope: "serena",
      maxAgeDays: 30,
      nowMs: NOW,
    });

    const pruned = r.prunedSerena.map((p) => p.split("/").pop());
    expect(pruned.sort()).toEqual([
      "orchestrator-session-x.md",
      "progress-old.md",
      "session-cost-probe.md",
    ]);
    expect(existsSync(join(serenaDir(), "result-recent.md"))).toBe(true);
    expect(existsSync(join(serenaDir(), "code_style.md"))).toBe(true);
    expect(existsSync(join(serenaDir(), "decisions", "d.md"))).toBe(true);
  });

  it("max-age-days 0 disables aged pruning but still sweeps session-cost", () => {
    mkSerena("session-cost-x.md", 0);
    mkSerena("progress-ancient.md", 999);
    const r = garbageCollectLocalState({
      baseDir: base,
      scope: "serena",
      maxAgeDays: 0,
      nowMs: NOW,
    });
    expect(r.prunedSerena.map((p) => p.split("/").pop())).toEqual([
      "session-cost-x.md",
    ]);
    expect(existsSync(join(serenaDir(), "progress-ancient.md"))).toBe(true);
  });
});

function writeConfig(yaml: string): void {
  const dir = join(base, ".agents");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "oma-config.yaml"), yaml);
}

describe("loadMemoryGcConfig", () => {
  it("returns {} when no config file is present", () => {
    expect(loadMemoryGcConfig(base)).toEqual({});
  });

  it("parses keep_sessions / max_age_days from oma-config.yaml", () => {
    writeConfig(
      "memory:\n  gc:\n    keep_sessions: 25\n    max_age_days: 14\n",
    );
    expect(loadMemoryGcConfig(base)).toEqual({ keep: 25, maxAgeDays: 14 });
  });

  it("returns {} when memory.gc is missing or wrong-shaped", () => {
    writeConfig("memory: not-an-object\n");
    expect(loadMemoryGcConfig(base)).toEqual({});
  });
});

describe("memory.gc config precedence affects pruning", () => {
  it("config keep_sessions controls how many sessions survive", () => {
    writeConfig("memory:\n  gc:\n    keep_sessions: 2\n");
    for (let i = 0; i < 5; i++) mkSession(`oma-c${i}`, i);
    const r = garbageCollectLocalState({
      baseDir: base,
      scope: "sessions",
      nowMs: NOW,
    });
    expect(r.keptSessions).toBe(2);
    expect(r.prunedSessions.length).toBe(3);
  });

  it("an explicit keep overrides the config value", () => {
    writeConfig("memory:\n  gc:\n    keep_sessions: 2\n");
    for (let i = 0; i < 5; i++) mkSession(`oma-c${i}`, i);
    const r = garbageCollectLocalState({
      baseDir: base,
      keep: 4,
      scope: "sessions",
      nowMs: NOW,
    });
    expect(r.keptSessions).toBe(4); // flag wins over config
    expect(r.prunedSessions.length).toBe(1);
  });
});

describe("garbageCollectLocalState — scope", () => {
  it("scope=sessions leaves Serena untouched and vice versa", () => {
    mkSession("oma-a", 0);
    mkSession("oma-b", 1);
    mkSerena("session-cost-x.md", 0);

    const sessionsOnly = garbageCollectLocalState({
      baseDir: base,
      keep: 1,
      scope: "sessions",
      nowMs: NOW,
    });
    expect(sessionsOnly.prunedSerena).toEqual([]);
    expect(existsSync(join(serenaDir(), "session-cost-x.md"))).toBe(true);

    const serenaOnly = garbageCollectLocalState({
      baseDir: base,
      scope: "serena",
      nowMs: NOW,
    });
    expect(serenaOnly.prunedSessions).toEqual([]);
  });
});
