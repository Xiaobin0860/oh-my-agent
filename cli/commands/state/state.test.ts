import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activateWorkflowSession, emitEvent } from "../../state/events.js";
import {
  activateStateSession,
  collectState,
  renderSessionView,
  renderStateList,
  viewSession,
} from "./state.js";

describe("state command helpers", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "oma-state-command-"));
  });

  afterEach(() => {
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("collects sessions with active markers", () => {
    activateWorkflowSession({
      projectDir,
      sid: "oma-main",
      workflow: "work",
      vendor: "codex",
      vendorSid: "codex-1",
    });
    emitEvent(projectDir, "oma-main", {
      eventId: "phase-1",
      ts: "2026-05-25T00:00:01.000Z",
      kind: "workflow.phase",
      payload: { phase: "implement" },
    });
    activateStateSession("oma-main", "qa", projectDir);

    const state = collectState(projectDir);
    expect(state.index.active).toMatchObject({
      main: "oma-main",
      qa: "oma-main",
    });
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toMatchObject({
      sid: "oma-main",
      workflow: "work",
      currentPhase: "implement",
    });
  });

  it("renders list and session views without requiring color-aware assertions", () => {
    activateWorkflowSession({
      projectDir,
      sid: "oma-view",
      workflow: "debug",
    });

    const list = renderStateList(collectState(projectDir));
    expect(list).toContain("OMA state sessions");
    expect(list).toContain("oma-view");
    expect(list).toContain("debug");

    const session = viewSession("oma-view", projectDir);
    const detail = renderSessionView("oma-view", session.meta, session.events);
    expect(detail).toContain("OMA session oma-view");
    expect(detail).toContain("workflow: debug");
    expect(detail).toContain("session.created");
  });
});
