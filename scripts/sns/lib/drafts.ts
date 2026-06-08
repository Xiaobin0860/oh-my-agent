import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { EnglishDraft, JapaneseDraft } from "./types.ts";

export function ensureDraftDir(baseDir: string): string {
  mkdirSync(baseDir, { recursive: true });
  return baseDir;
}

export function writeEnglishDraft(
  dir: string,
  label: string,
  draft: EnglishDraft,
): { mdPath: string; jsonPath: string } {
  const safe = label.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const mdPath = join(dir, `${safe}-en.md`);
  const jsonPath = join(dir, `${safe}-en.json`);
  writeFileSync(mdPath, draft.body_markdown);
  writeFileSync(jsonPath, JSON.stringify(draft, null, 2));
  return { mdPath, jsonPath };
}

export function writeJapaneseDraft(
  dir: string,
  label: string,
  draft: JapaneseDraft,
): { mdPath: string; jsonPath: string } {
  const safe = label.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const mdPath = join(dir, `${safe}-ja.md`);
  const jsonPath = join(dir, `${safe}-ja.json`);
  writeFileSync(mdPath, draft.body);
  writeFileSync(jsonPath, JSON.stringify(draft, null, 2));
  return { mdPath, jsonPath };
}

export function writePrompt(
  dir: string,
  label: string,
  prompt: string,
): string {
  const promptsDir = join(dir, "prompts");
  mkdirSync(promptsDir, { recursive: true });
  const safe = label.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = join(promptsDir, `${safe}.txt`);
  writeFileSync(path, prompt);
  return path;
}
