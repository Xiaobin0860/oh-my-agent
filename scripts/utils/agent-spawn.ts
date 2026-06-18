import { spawnSync } from "node:child_process";
import { buildExternalInvocation } from "@cli/io/runtime-dispatch/invocations/external.ts";
import type { RuntimeVendor } from "@cli/io/runtime-dispatch/types.ts";
import {
  resolvePromptFlag,
  resolveVendor,
} from "@cli/platform/agent-config.ts";

/** Any dispatchable vendor (excludes the "unknown" runtime sentinel). */
export type AgentVendor = Exclude<RuntimeVendor, "unknown">;

export interface RunAgentOptions {
  vendor?: AgentVendor;
  prompt: string;
  cwd?: string;
  timeoutMs?: number;
}

/**
 * Run a vendor CLI headlessly and return its stdout.
 *
 * Reuses the cli's single source of truth — `resolveVendor` (cli-config.yaml +
 * defaults), `resolvePromptFlag`, and `buildExternalInvocation` — instead of a
 * hand-maintained per-vendor command map, so every vendor the cli can dispatch
 * works here too and there is no parallel list to drift.
 */
export function runAgent(options: RunAgentOptions): string {
  const override =
    options.vendor ??
    (process.env.OMA_DEFAULT_AGENT as AgentVendor | undefined);
  const { vendor, config } = resolveVendor("explore", override);
  const vendorConfig = config?.vendors?.[vendor] ?? {};
  const promptFlag = resolvePromptFlag(vendor, vendorConfig.prompt_flag);
  const { command, args, env } = buildExternalInvocation(
    vendor,
    vendorConfig,
    promptFlag,
    options.prompt,
  );

  const result = spawnSync(command, args, {
    encoding: "utf8",
    cwd: options.cwd,
    env,
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
