import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pc from "picocolors";
import {
  deriveMeta,
  readEvents,
  readIndex,
  refreshMeta,
  type SessionMeta,
  sessionsDir,
  setActiveSession,
} from "../../state/events.js";

export interface StateView {
  index: ReturnType<typeof readIndex>;
  sessions: SessionMeta[];
}

function loadSessionMeta(projectDir: string, sid: string): SessionMeta {
  const metaPath = join(sessionsDir(projectDir), sid, "meta.json");
  if (existsSync(metaPath)) {
    try {
      return JSON.parse(readFileSync(metaPath, "utf-8")) as SessionMeta;
    } catch {
      return refreshMeta(projectDir, sid);
    }
  }
  return deriveMeta(sid, readEvents(projectDir, sid));
}

export function collectState(projectDir = process.cwd()): StateView {
  const index = readIndex(projectDir);
  const root = sessionsDir(projectDir);
  const sessions: SessionMeta[] = [];
  if (existsSync(root)) {
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      sessions.push(loadSessionMeta(projectDir, entry.name));
    }
  }
  sessions.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return { index, sessions };
}

export function viewSession(
  sid: string,
  projectDir = process.cwd(),
): { meta: SessionMeta; events: ReturnType<typeof readEvents> } {
  const events = readEvents(projectDir, sid);
  return { meta: deriveMeta(sid, events), events };
}

export function activateStateSession(
  sid: string,
  category = "main",
  projectDir = process.cwd(),
): void {
  setActiveSession(projectDir, category, sid);
}

export function renderStateList(view: StateView): string {
  const lines = [pc.bold("OMA state sessions")];
  const active = view.index.active;
  const activeEntries = Object.entries(active);
  if (activeEntries.length > 0) {
    lines.push("");
    lines.push(pc.bold("Active"));
    for (const [category, sid] of activeEntries) {
      lines.push(`  ${category}: ${sid}`);
    }
  }
  lines.push("");
  lines.push(pc.bold("Sessions"));
  if (view.sessions.length === 0) {
    lines.push("  (none)");
    return lines.join("\n");
  }
  for (const session of view.sessions) {
    const workflow = session.workflow || "(unknown)";
    const phase = session.currentPhase
      ? ` ${pc.dim(session.currentPhase)}`
      : "";
    lines.push(`  ${session.sid} ${workflow} ${session.status}${phase}`);
  }
  return lines.join("\n");
}

export function renderSessionView(
  sid: string,
  meta: SessionMeta,
  events: ReturnType<typeof readEvents>,
): string {
  const lines = [
    pc.bold(`OMA session ${sid}`),
    `workflow: ${meta.workflow || "(unknown)"}`,
    `status: ${meta.status}`,
    `phase: ${meta.currentPhase || "(none)"}`,
    "",
    pc.bold("Events"),
  ];
  for (const event of events) {
    lines.push(`  ${event.ts} ${event.kind} ${event.eventId}`);
  }
  return lines.join("\n");
}
