import { spawnSync } from "node:child_process";

/**
 * Optional agy CLI capabilities detected from `agy --help`.
 *
 * agy 1.0 predates both flags; 1.1+ added `--model` and `--add-dir`.
 * Capabilities are detected from the installed binary's help text instead of a
 * version compare, so newly added flags are picked up regardless of how the
 * version string is formatted.
 */
export interface AgyCaps {
  /** `--model <id>` — per-session model selection (agy 1.1+). */
  modelFlag: boolean;
  /** `--add-dir <path>` — grant workspace access outside agy's trusted root (agy 1.1+). */
  addDir: boolean;
}

let cached: AgyCaps | null = null;

function runAgyHelp(): string {
  // Go CLIs print usage to stdout or stderr depending on flag wiring; capture
  // both. Any failure (binary missing, timeout) yields "" → no caps, which
  // reproduces the legacy agy-1.0 behavior of dropping the flags.
  const result = spawnSync("agy", ["--help"], {
    encoding: "utf8",
    timeout: 5_000,
  });
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

/**
 * Probe the installed agy binary once per process and cache the result.
 * Pass `runHelp` to inject help text in tests, or seed with `primeAgyCaps`.
 */
export function detectAgyCaps(runHelp: () => string = runAgyHelp): AgyCaps {
  if (cached) return cached;
  let help = "";
  try {
    help = runHelp();
  } catch {
    help = "";
  }
  cached = {
    modelFlag: /^\s*--model\b/m.test(help),
    addDir: /^\s*--add-dir\b/m.test(help),
  };
  return cached;
}

/** Seed the capability cache (tests / pre-probed environments). */
export function primeAgyCaps(caps: AgyCaps): void {
  cached = { ...caps };
}

/** Clear the cached probe so the next detectAgyCaps() re-runs it. */
export function resetAgyCapsCache(): void {
  cached = null;
}
