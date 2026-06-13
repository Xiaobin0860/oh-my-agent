import type { Command } from "commander";
import { runAction } from "../../utils/cli-framework.js";
import { bridge } from "./run.js";

export function registerBridge(program: Command): void {
  program
    .command("bridge [url]")
    .description("Bridge MCP stdio to Streamable HTTP (for Serena)")
    .action(
      runAction(async (url) => {
        await bridge(url);
      }),
    );
}
