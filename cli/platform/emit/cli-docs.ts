import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { renderCliVendorDoc } from "../rules.js";
import type { CliDocsEmitReport } from "./types.js";

/**
 * Vendor → `cli/`-scoped doc mapping. These are the nested per-directory
 * instruction files the Claude Code and Codex runtimes read when working
 * under `cli/`. Historically hand-maintained mirrors of the rules.ts vendor
 * block — proven drift magnets — now generated so `check:emit-drift` keeps
 * them honest.
 */
const CLI_DOCS: ReadonlyArray<{ vendor: string; rel: string }> = [
  { vendor: "claude", rel: join("cli", "CLAUDE.md") },
  { vendor: "codex", rel: join("cli", "AGENTS.md") },
];

/**
 * Emit `cli/CLAUDE.md` + `cli/AGENTS.md` under `outDir`, splicing the fresh
 * vendor block into the COMMITTED file's OMA markers (read from `repoRoot`)
 * so content outside the block survives and scratch-base drift runs compare
 * apples to apples.
 */
export function emitCliDocs(
  repoRoot: string,
  outDir: string,
): CliDocsEmitReport {
  const files = CLI_DOCS.map(({ vendor, rel }) => {
    const committedPath = join(repoRoot, rel);
    const existing = existsSync(committedPath)
      ? readFileSync(committedPath, "utf-8")
      : null;
    const content = renderCliVendorDoc(vendor, existing);
    const outPath = join(outDir, rel);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, content);
    return { vendor, outPath, changed: existing !== content };
  });

  return { target: "cli-docs", outDir, files };
}
