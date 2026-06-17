import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _resetInstallContext,
  setInstallContext,
} from "../../platform/install-context.js";
import { applyKimiMcp, installKimiMcp, needsKimiMcpUpdate } from "./mcp.js";

describe("applyKimiMcp / needsKimiMcpUpdate", () => {
  it("adds serena + chrome-devtools to an empty config", () => {
    const next = applyKimiMcp({});
    expect(next.mcpServers?.serena?.command).toBe("serena");
    expect(next.mcpServers?.serena?.args).toContain("--context");
    expect(next.mcpServers?.serena?.args).toContain("ide");
    expect(next.mcpServers?.["chrome-devtools"]?.command).toBe("npx");
  });

  it("preserves a user's own MCP servers", () => {
    const next = applyKimiMcp({
      mcpServers: { custom: { command: "my-server" } },
    });
    expect(next.mcpServers?.custom?.command).toBe("my-server");
    expect(next.mcpServers?.serena).toBeDefined();
  });

  it("needsKimiMcpUpdate is true for empty/missing serena, false once applied", () => {
    expect(needsKimiMcpUpdate({})).toBe(true);
    expect(needsKimiMcpUpdate(applyKimiMcp({}))).toBe(false);
  });

  it("disables the serena web dashboard", () => {
    const next = applyKimiMcp({});
    const args = next.mcpServers?.serena?.args ?? [];
    const idx = args.indexOf("--open-web-dashboard");
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe("false");
  });
});

describe("installKimiMcp — global mode (HOME)", () => {
  let kimiHomeDir: string;

  beforeEach(() => {
    kimiHomeDir = mkdtempSync(join(tmpdir(), "oma-kimi-mcp-"));
    vi.stubEnv("KIMI_CODE_HOME", kimiHomeDir);
    setInstallContext({ installRoot: kimiHomeDir, mode: "global" });
  });

  afterEach(() => {
    _resetInstallContext();
    vi.unstubAllEnvs();
    rmSync(kimiHomeDir, { recursive: true, force: true });
  });

  it("skips with a reason when ~/.kimi-code does not exist", () => {
    rmSync(kimiHomeDir, { recursive: true, force: true });
    const result = installKimiMcp(kimiHomeDir);
    expect(result.installed).toBe(false);
    expect(result.reason).toContain("kimi login");
  });

  it("writes ~/.kimi-code/mcp.json with serena", () => {
    const result = installKimiMcp(kimiHomeDir);
    expect(result.installed).toBe(true);
    expect(result.path).toBe(join(kimiHomeDir, "mcp.json"));
    const parsed = JSON.parse(
      readFileSync(join(kimiHomeDir, "mcp.json"), "utf-8"),
    );
    expect(parsed.mcpServers.serena.command).toBe("serena");
  });

  it("is idempotent and preserves user servers", () => {
    writeFileSync(
      join(kimiHomeDir, "mcp.json"),
      JSON.stringify({ mcpServers: { custom: { command: "x" } } }),
    );
    installKimiMcp(kimiHomeDir);
    installKimiMcp(kimiHomeDir);
    const parsed = JSON.parse(
      readFileSync(join(kimiHomeDir, "mcp.json"), "utf-8"),
    );
    expect(parsed.mcpServers.custom.command).toBe("x");
    expect(parsed.mcpServers.serena).toBeDefined();
  });
});

describe("installKimiMcp — project mode (in-project)", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = mkdtempSync(join(tmpdir(), "oma-kimi-proj-"));
    setInstallContext({ installRoot: projectDir, mode: "project" });
  });

  afterEach(() => {
    _resetInstallContext();
    rmSync(projectDir, { recursive: true, force: true });
  });

  it("writes <cwd>/.kimi-code/mcp.json without needing ~/.kimi-code", () => {
    const result = installKimiMcp(projectDir);
    expect(result.installed).toBe(true);
    const expectedPath = join(projectDir, ".kimi-code", "mcp.json");
    expect(result.path).toBe(expectedPath);
    expect(existsSync(expectedPath)).toBe(true);
    const parsed = JSON.parse(readFileSync(expectedPath, "utf-8"));
    expect(parsed.mcpServers.serena.command).toBe("serena");
  });
});
