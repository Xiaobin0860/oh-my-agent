export const RECOMMENDED_CHROME_DEVTOOLS_MCP = {
  command: "npx",
  args: [
    "-y",
    "chrome-devtools-mcp@latest",
    "--no-usage-statistics",
    "--isolated",
  ] as string[],
} as const;

export type SerenaMcpServerLike = {
  command?: unknown;
  args?: unknown;
};

export function isLegacyUvxSerena(
  server: SerenaMcpServerLike | undefined,
): boolean {
  if (!server || server.command !== "uvx") return false;
  if (!Array.isArray(server.args)) return false;
  return server.args.some(
    (arg) =>
      typeof arg === "string" &&
      arg.includes("git+https://github.com/oraios/serena"),
  );
}

const DISABLE_DASHBOARD_OPEN_ARGS = ["--open-web-dashboard", "false"] as const;

export function serenaStartMcpArgs(context: string): string[] {
  return [
    "start-mcp-server",
    "--context",
    context,
    "--project-from-cwd",
    ...DISABLE_DASHBOARD_OPEN_ARGS,
  ];
}

export function hasSerenaDashboardOpenDisabled(
  server: SerenaMcpServerLike | undefined,
): boolean {
  if (!server || server.command !== "serena" || !Array.isArray(server.args)) {
    return true;
  }
  const idx = server.args.indexOf("--open-web-dashboard");
  return idx !== -1 && String(server.args[idx + 1]).toLowerCase() === "false";
}

export function withSerenaDashboardOpenDisabled<T extends SerenaMcpServerLike>(
  server: T,
): T {
  if (server.command !== "serena" || !Array.isArray(server.args)) return server;
  if (hasSerenaDashboardOpenDisabled(server)) return server;

  const idx = server.args.indexOf("--open-web-dashboard");
  if (idx !== -1) {
    const nextArgs = [...server.args];
    nextArgs[idx + 1] = "false";
    return { ...server, args: nextArgs } as T;
  }

  return {
    ...server,
    args: [...server.args, ...DISABLE_DASHBOARD_OPEN_ARGS],
  } as T;
}

/**
 * Force a serena entry's `--context` to `context`, inserting the flag when
 * absent. No-op for non-serena entries (guarded on `command === "serena"`).
 *
 * Vendors that derive their MCP config by copying the SSOT `.agents/mcp.json`
 * (Claude Code's template, which carries `--context claude-code`) must re-stamp
 * their own context so Claude's value does not leak — every vendor that builds
 * its serena entry from scratch already does this via `serenaStartMcpArgs`.
 */
export function withSerenaContext<T extends SerenaMcpServerLike>(
  server: T,
  context: string,
): T {
  if (server.command !== "serena" || !Array.isArray(server.args)) return server;

  const idx = server.args.indexOf("--context");
  if (idx === -1) {
    return { ...server, args: [...server.args, "--context", context] } as T;
  }
  if (server.args[idx + 1] === context) return server;

  const nextArgs = [...server.args];
  nextArgs[idx + 1] = context;
  return { ...server, args: nextArgs } as T;
}

/**
 * Force a serena entry to resolve its project from the working directory.
 *
 * `--project .` pins the literal cwd as the project (no walk-up), whereas
 * `--project-from-cwd` searches upward for `.serena/project.yml` or `.git`
 * (graceful CWD fallback) — the form serena's own `client_setup` ships for
 * Claude Code / Codex. The two flags are mutually exclusive (serena raises a
 * UsageError when both are present), so this strips any `--project <value>`
 * before inserting `--project-from-cwd`. No-op for non-serena entries or when
 * `--project-from-cwd` is already set.
 */
export function withSerenaProjectFromCwd<T extends SerenaMcpServerLike>(
  server: T,
): T {
  if (server.command !== "serena" || !Array.isArray(server.args)) return server;
  if (server.args.includes("--project-from-cwd")) return server;

  const idx = server.args.indexOf("--project");
  if (idx === -1) {
    return { ...server, args: [...server.args, "--project-from-cwd"] } as T;
  }

  const nextArgs = [...server.args];
  // Drop `--project` plus its value when the next token is a value (not a flag).
  const hasValue =
    idx + 1 < nextArgs.length && !String(nextArgs[idx + 1]).startsWith("--");
  nextArgs.splice(idx, hasValue ? 2 : 1, "--project-from-cwd");
  return { ...server, args: nextArgs } as T;
}
