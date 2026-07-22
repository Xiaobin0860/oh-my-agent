import type { Command } from "commander";
import color from "picocolors";
import {
  addOutputOptions,
  resolveJsonMode,
  runAction,
} from "../../utils/cli-framework.js";
import { runExplainValidate } from "./validate.js";

export function registerExplainCommand(program: Command): void {
  const explain = program
    .command("explain")
    .description("Explain artifact management and quality validation tools");

  const validateCmd = explain
    .command("validate [file]")
    .description("Validate self-contained explain HTML report artifacts")
    .option("--dir <path>", "Directory containing HTML files to validate")
    .option(
      "--format <fmt>",
      "Output format: concise | json (default: concise)",
      "concise",
    )
    .option("--out-file <path>", "Write JSON validation report to file");

  addOutputOptions(validateCmd);

  validateCmd.action(
    runAction(
      async (
        file: string | undefined,
        opts: {
          dir?: string;
          format?: string;
          json?: boolean;
          outFile?: string;
        },
      ) => {
        const isJson = resolveJsonMode(opts) || opts.format === "json";
        const format = isJson ? "json" : "concise";
        try {
          const code = await runExplainValidate({
            file,
            dir: opts.dir,
            format,
            outFile: opts.outFile,
          });
          process.exitCode = code;
        } catch (err) {
          console.error(color.red((err as Error).message));
          process.exitCode = 1;
        }
      },
      { supportsJsonOutput: true },
    ),
  );
}

export { runExplainValidate } from "./validate.js";
