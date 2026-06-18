import { spawnSync } from "node:child_process";
import type { RuntimeVendor } from "@cli/io/runtime-dispatch/types.ts";

// Headless-print vendors this util supports. A deliberate subset, but validated
// against the canonical RuntimeVendor SSOT via `satisfies` — if one of these is
// renamed/removed from the vendor set, this fails to compile (no silent drift).
const AGENT_VENDORS = [
  "claude",
  "codex",
  "qwen",
] as const satisfies readonly RuntimeVendor[];

export type AgentVendor = (typeof AGENT_VENDORS)[number];

const HEADLESS_COMMANDS: Record<AgentVendor, (prompt: string) => string[]> = {
  claude: (prompt) => ["claude", "-p", prompt],
  codex: (prompt) => ["codex", "exec", prompt],
  qwen: (prompt) => ["qwen", "-p", prompt],
};

export interface RunAgentOptions {
  vendor?: AgentVendor;
  prompt: string;
  cwd?: string;
  timeoutMs?: number;
}

function resolveVendor(explicit?: AgentVendor): AgentVendor {
  if (explicit) return explicit;
  const envVendor = process.env.OMA_DEFAULT_AGENT as AgentVendor | undefined;
  if (envVendor && envVendor in HEADLESS_COMMANDS) return envVendor;
  return "claude";
}

export function runAgent(options: RunAgentOptions): string {
  const vendor = resolveVendor(options.vendor);
  const [command, ...args] = HEADLESS_COMMANDS[vendor](options.prompt);
  if (!command) throw new Error(`Unsupported vendor: ${vendor}`);

  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: options.cwd,
    timeout: options.timeoutMs ?? 5 * 60 * 1000,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  });

  if (result.error) {
    throw new Error(`Failed to run ${vendor}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${vendor} exited with code ${result.status}`);
  }
  return result.stdout.trim();
}
