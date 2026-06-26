import { describe, expect, it } from "vitest";
import {
  serenaStartMcpArgs,
  withSerenaContext,
  withSerenaProjectFromCwd,
} from "./serena.js";

describe("serenaStartMcpArgs", () => {
  it("uses --project-from-cwd (not --project .)", () => {
    const args = serenaStartMcpArgs("claude-code");
    expect(args).toContain("--project-from-cwd");
    expect(args).not.toContain("--project");
    expect(args).toEqual([
      "start-mcp-server",
      "--context",
      "claude-code",
      "--project-from-cwd",
      "--open-web-dashboard",
      "false",
    ]);
  });
});

describe("withSerenaProjectFromCwd", () => {
  it("replaces --project <value> with --project-from-cwd (mutually exclusive)", () => {
    const out = withSerenaProjectFromCwd({
      command: "serena",
      args: ["start-mcp-server", "--context", "ide", "--project", "."],
    });
    expect(out.args).toEqual([
      "start-mcp-server",
      "--context",
      "ide",
      "--project-from-cwd",
    ]);
    // Never leaves both flags — serena raises UsageError if both are present.
    expect(out.args).not.toContain("--project");
  });

  it("appends --project-from-cwd when no project flag is present", () => {
    const out = withSerenaProjectFromCwd({
      command: "serena",
      args: ["start-mcp-server", "--context", "codex"],
    });
    expect(out.args).toEqual([
      "start-mcp-server",
      "--context",
      "codex",
      "--project-from-cwd",
    ]);
  });

  it("is idempotent when --project-from-cwd is already set", () => {
    const server = {
      command: "serena",
      args: ["start-mcp-server", "--project-from-cwd"],
    };
    expect(withSerenaProjectFromCwd(server)).toBe(server);
  });

  it("does not drop a following flag when --project has no value", () => {
    const out = withSerenaProjectFromCwd({
      command: "serena",
      args: ["start-mcp-server", "--project", "--open-web-dashboard", "false"],
    });
    expect(out.args).toEqual([
      "start-mcp-server",
      "--project-from-cwd",
      "--open-web-dashboard",
      "false",
    ]);
  });

  it("leaves non-serena entries untouched", () => {
    const server = { command: "uvx", args: ["--project", "."] };
    expect(withSerenaProjectFromCwd(server)).toBe(server);
  });
});

describe("withSerenaContext", () => {
  it("rewrites an existing --context value", () => {
    const out = withSerenaContext(
      {
        command: "serena",
        args: ["start-mcp-server", "--context", "claude-code"],
      },
      "antigravity",
    );
    expect(out.args).toEqual(["start-mcp-server", "--context", "antigravity"]);
  });

  it("appends --context when absent", () => {
    const out = withSerenaContext(
      { command: "serena", args: ["start-mcp-server"] },
      "antigravity",
    );
    expect(out.args).toEqual(["start-mcp-server", "--context", "antigravity"]);
  });

  it("is idempotent when the context already matches", () => {
    const server = {
      command: "serena",
      args: ["start-mcp-server", "--context", "antigravity"],
    };
    const out = withSerenaContext(server, "antigravity");
    expect(out).toBe(server);
  });

  it("leaves non-serena entries untouched", () => {
    const server = { command: "uvx", args: ["--context", "claude-code"] };
    const out = withSerenaContext(server, "antigravity");
    expect(out).toBe(server);
    expect(out.args).toEqual(["--context", "claude-code"]);
  });

  it("no-ops when args is not an array", () => {
    const server = { command: "serena" };
    expect(withSerenaContext(server, "antigravity")).toBe(server);
  });
});
