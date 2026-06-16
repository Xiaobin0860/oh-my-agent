import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const SERENA_CONFIG_PATH = join(homedir(), ".serena", "serena_config.yml");

// Maps oma skill names to the Serena language server keys they require.
// DELIBERATE EXCLUSION: "bash" (bash-language-server ~40 MB) is never auto-added
// here. It is low-value for the projects oma manages and adds ~40 MB of LSP memory
// per open project. Users may add it manually to project.yml; reconcile (additive)
// will preserve it if already present. See design 021, Track A.
const SKILL_LANGUAGE_MAP: Record<string, string[]> = {
  "oma-frontend": ["typescript"],
  "oma-mobile": ["dart"],
  "oma-tf-infra": ["terraform"],
  // oma-db manages SQL migrations and schema via Python tooling (e.g. Alembic, pgmypy).
  // SQL LSP is intentionally excluded — it is heavy/low-value for the typical oma-db workflow.
  "oma-db": ["python"],
};

const BACKEND_VARIANT_MAP: Record<string, string> = {
  python: "python",
  node: "typescript",
  rust: "rust",
};

/**
 * Resolve Serena language server keys from selected skills and backend variant.
 */
export function resolveSerenaLanguages(
  selectedSkills: string[],
  backendVariant?: string,
): string[] {
  const languages = new Set<string>();

  for (const skill of selectedSkills) {
    const mapped = SKILL_LANGUAGE_MAP[skill];
    if (mapped) {
      for (const lang of mapped) languages.add(lang);
    }
  }

  if (
    selectedSkills.includes("oma-backend") &&
    backendVariant &&
    BACKEND_VARIANT_MAP[backendVariant]
  ) {
    languages.add(BACKEND_VARIANT_MAP[backendVariant]);
  }

  // Fallback: at least typescript
  if (languages.size === 0) {
    languages.add("typescript");
  }

  return [...languages];
}

/**
 * Infer Serena languages from installed skills directory.
 * Used during `oma update` when selections are not available.
 */
export function inferSerenaLanguages(cwd: string): string[] {
  const languages = new Set<string>();
  const skillsDir = join(cwd, ".agents", "skills");

  for (const [skill, langs] of Object.entries(SKILL_LANGUAGE_MAP)) {
    if (existsSync(join(skillsDir, skill))) {
      for (const lang of langs) languages.add(lang);
    }
  }

  // Check backend stack.yaml for language
  const stackYaml = join(skillsDir, "oma-backend", "stack", "stack.yaml");
  if (existsSync(stackYaml)) {
    try {
      const content = readFileSync(stackYaml, "utf-8");
      const match = content.match(/^language:\s*(.+)$/m);
      if (match?.[1]) {
        const variant = match[1].trim();
        const mapped = BACKEND_VARIANT_MAP[variant];
        if (mapped) languages.add(mapped);
      }
    } catch {
      // best-effort
    }
  } else if (existsSync(join(skillsDir, "oma-backend"))) {
    // backend exists but no stack — default to typescript
    languages.add("typescript");
  }

  if (languages.size === 0) {
    languages.add("typescript");
  }

  return [...languages];
}

// ---------------------------------------------------------------------------
// Language reconcile (additive merge — Track A, Task 10)
// ---------------------------------------------------------------------------

/**
 * Advisory item returned by advisoryHeavyLanguages.
 * Consumed by the doctor command (cli/commands/doctor/serena-reap.ts — BE-3).
 */
export interface SerenaLanguageAdvisory {
  language: string;
  reason: string;
  suggestion: string;
}

/**
 * Languages that are considered heavy or low-value when not skill-derived.
 * Used to surface advisory findings in `oma doctor` (see T2-2 in design 021).
 * Key = language name as it appears in project.yml; value = approximate RSS.
 */
const HEAVY_UNMAPPED_LANGUAGES: Record<string, string> = {
  // bash-language-server is ~40 MB. Serena may add it via autogenerate (file scan)
  // if the project.yml ever lacks an explicit languages list. oma never adds it
  // (see SKILL_LANGUAGE_MAP deliberate exclusion above), but leftover entries from
  // serena autogenerate or manual edits are surfaced here.
  bash: "~40 MB",
};

/**
 * Pure function — additive merge of skill-derived languages into existing YAML content.
 *
 * Rules:
 * - Parses the `languages:` block from existing yml content.
 * - Adds any skill-derived languages that are missing (case-insensitive comparison).
 * - NEVER removes existing languages (preserves intentional user choices).
 * - Returns the updated YAML string, or null when no change is needed (idempotent).
 * - Only touches the `languages:` list; all other file content is preserved verbatim.
 *
 * Blocking autogenerate: by always writing an explicit `languages:` list, oma ensures
 * serena's `ProjectConfig.autogenerate` (file scan) never fills in broadly. This function
 * preserves that invariant on reconcile — the list is always explicit and non-empty.
 */
export function reconcileSerenaLanguages(
  existingYml: string,
  derivedLanguages: string[],
): string | null {
  if (derivedLanguages.length === 0) return null;

  // Match the languages: block — captures the header line and all list items.
  const blockMatch = existingYml.match(
    /^(languages:\s*\n)((?:[ \t]*-[ \t]+\S[^\n]*\n?)*)/m,
  );

  if (!blockMatch) {
    // No languages: block found — prepend one so autogenerate never fires.
    const languagesBlock = `languages:\n${derivedLanguages.map((l) => `- ${l}`).join("\n")}\n`;
    return `${languagesBlock}\n${existingYml}`;
  }

  const header = blockMatch[1]; // "languages:\n"
  const listRaw = blockMatch[2] ?? ""; // "- typescript\n- python\n"
  const blockStart = blockMatch.index ?? 0;
  const blockEnd = blockStart + blockMatch[0].length;

  // Parse existing items (preserve original raw text — incl. inline comments —
  // so the file is rewritten faithfully).
  const existingItems: string[] = (
    listRaw.match(/^[ \t]*-[ \t]+(\S[^\n]*)$/gm) ?? []
  ).map((line) => line.replace(/^[ \t]*-[ \t]+/, "").trim());
  // Dedup comparison strips inline YAML comments so `- typescript # note`
  // matches the derived `typescript` and is not duplicated (QA F3).
  const stripComment = (item: string) => item.replace(/\s+#.*$/, "").trim();
  const existingLower = new Set(
    existingItems.map((l) => stripComment(l).toLowerCase()),
  );

  // Only add languages not already present (case-insensitive)
  const toAdd = derivedLanguages.filter(
    (lang) => !existingLower.has(lang.toLowerCase()),
  );

  if (toAdd.length === 0) return null; // already up-to-date

  const newListItems = [...existingItems, ...toAdd];
  const newBlock = `${header}${newListItems.map((l) => `- ${l}`).join("\n")}\n`;

  return (
    existingYml.slice(0, blockStart) + newBlock + existingYml.slice(blockEnd)
  );
}

/**
 * IO wrapper — reads the existing project.yml, calls reconcileSerenaLanguages,
 * and writes back only if there is a change.
 * Returns true when the file was updated, false when already up-to-date.
 */
export function reconcileSerenaProjectConfig(
  cwd: string,
  derivedLanguages: string[],
): boolean {
  const projectYml = join(cwd, ".serena", "project.yml");

  if (!existsSync(projectYml)) return false;

  const existing = readFileSync(projectYml, "utf-8");
  const updated = reconcileSerenaLanguages(existing, derivedLanguages);

  if (updated === null) return false;

  writeFileSync(projectYml, updated);
  return true;
}

// ---------------------------------------------------------------------------
// Doctor advisory helper (Task 11 — T2-2)
// BE-3 (cli/commands/doctor/serena-reap.ts) surfaces these findings in doctor output.
// ---------------------------------------------------------------------------

/**
 * Pure function — given the languages currently in project.yml and the
 * skill-derived set, returns advisory findings for languages that are:
 *   (a) not skill-derived, AND
 *   (b) heavy or low-value (e.g. bash-language-server ~40 MB).
 *
 * Does NOT remove any language — removal is a manual user action.
 * BE-3 is responsible for surfacing these findings in `oma doctor` output via
 * `cli/commands/doctor/serena-reap.ts`.
 *
 * @param projectYmlLanguages - languages list as found in .serena/project.yml
 * @param derivedLanguages    - languages oma would derive from installed skills
 * @returns advisory findings, empty array when nothing to report
 */
export function advisoryHeavyLanguages(
  projectYmlLanguages: string[],
  derivedLanguages: string[],
): SerenaLanguageAdvisory[] {
  const derivedLower = new Set(derivedLanguages.map((l) => l.toLowerCase()));
  const advisories: SerenaLanguageAdvisory[] = [];

  for (const lang of projectYmlLanguages) {
    const key = lang.toLowerCase();
    if (derivedLower.has(key)) continue; // skill-derived — expected
    const rss = HEAVY_UNMAPPED_LANGUAGES[key];
    if (!rss) continue; // not a known heavy language — no advisory

    advisories.push({
      language: lang,
      reason: `"${lang}" (${rss} LSP memory) is present in project.yml but not derived from any installed oma skill.`,
      suggestion: `Remove "- ${lang}" from .serena/project.yml to reclaim ~${rss} of memory per open project, or install the skill that requires it.`,
    });
  }

  return advisories;
}

/**
 * Parse the languages list from a .serena/project.yml content string.
 * Convenience helper for consumers (e.g. doctor command) that already hold the
 * file content and need the language list without re-reading the file.
 */
export function parseProjectYmlLanguages(ymlContent: string): string[] {
  const blockMatch = ymlContent.match(
    /^languages:\s*\n((?:[ \t]*-[ \t]+\S[^\n]*\n?)*)/m,
  );
  if (!blockMatch) return [];
  return ((blockMatch[1] ?? "").match(/^[ \t]*-[ \t]+(\S[^\n]*)$/gm) ?? []).map(
    (line) => line.replace(/^[ \t]*-[ \t]+/, "").trim(),
  );
}

// ---------------------------------------------------------------------------
// Serena config registration
// ---------------------------------------------------------------------------

/**
 * Register the project path in ~/.serena/serena_config.yml if not already present.
 */
export function ensureSerenaRegistered(cwd: string): boolean {
  const projectPath = resolve(cwd);

  if (!existsSync(SERENA_CONFIG_PATH)) {
    return false;
  }

  try {
    const content = readFileSync(SERENA_CONFIG_PATH, "utf-8");

    // Parse existing projects list
    const projectsMatch = content.match(
      /^(projects:\s*\n)((?:\s*-\s*.+\n?)*)/m,
    );
    if (!projectsMatch) {
      return false;
    }

    const projectLines =
      (projectsMatch[2] ?? "").match(/^\s*-\s*(.+)$/gm) || [];
    const existingPaths = projectLines.map((line) =>
      resolve(line.replace(/^\s*-\s*/, "").trim()),
    );

    if (existingPaths.includes(projectPath)) {
      return false; // already registered
    }

    // Insert new project entry at the end of the projects list
    const insertPos = (projectsMatch.index ?? 0) + projectsMatch[0].length;
    const newEntry = `- ${projectPath}\n`;
    const newContent =
      content.slice(0, insertPos) + newEntry + content.slice(insertPos);

    writeFileSync(SERENA_CONFIG_PATH, newContent);
    return true;
  } catch {
    return false;
  }
}

const DEFAULT_PROJECT_YML = (languages: string[], projectName: string) =>
  `languages:
${languages.map((l) => `- ${l}`).join("\n")}

encoding: "utf-8"
ignore_all_files_in_gitignore: true
ignored_paths: []
read_only: false
excluded_tools: []
initial_prompt: ""
project_name: "${projectName}"
included_optional_tools: []
base_modes:
default_modes:
fixed_tools: []
symbol_info_budget:
language_backend:
read_only_memory_patterns: []
line_ending:
ignored_memory_patterns: []
ls_specific_settings: {}
`;

/**
 * Create .serena/project.yml and directory structure if not present.
 * When project.yml already exists, performs an additive language reconcile
 * (merges skill-derived languages in, never removes existing entries).
 *
 * Returns:
 *   "created"    — file did not exist and was created
 *   "reconciled" — file existed and new languages were merged in
 *   "unchanged"  — file existed and was already up-to-date
 */
export function ensureSerenaProjectConfig(
  cwd: string,
  languages: string[],
): "created" | "reconciled" | "unchanged" {
  const serenaDir = join(cwd, ".serena");
  const projectYml = join(serenaDir, "project.yml");

  if (existsSync(projectYml)) {
    // Additive reconcile: merge skill-derived languages into the existing file.
    const changed = reconcileSerenaProjectConfig(cwd, languages);
    return changed ? "reconciled" : "unchanged";
  }

  const projectName =
    cwd.split("/").pop() || cwd.split("\\").pop() || "project";

  mkdirSync(serenaDir, { recursive: true });
  writeFileSync(projectYml, DEFAULT_PROJECT_YML(languages, projectName));

  // Ensure .gitignore
  const gitignorePath = join(serenaDir, ".gitignore");
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, "/cache\n");
  }

  // Ensure memories directory
  const memoriesDir = join(serenaDir, "memories");
  mkdirSync(memoriesDir, { recursive: true });
  const gitkeep = join(memoriesDir, ".gitkeep");
  if (!existsSync(gitkeep)) {
    writeFileSync(gitkeep, "");
  }

  return "created";
}

/**
 * Ensure the project is set up for Serena:
 * 1. Create .serena/project.yml if missing (or reconcile languages if it exists)
 * 2. Register in ~/.serena/serena_config.yml if missing
 *
 * Returns:
 *   configured  — "created" | "reconciled" | "unchanged" (project.yml outcome)
 *   registered  — true when the project was newly registered in serena_config.yml
 */
export function ensureSerenaProject(
  cwd: string,
  languages: string[],
): { configured: "created" | "reconciled" | "unchanged"; registered: boolean } {
  const configured = ensureSerenaProjectConfig(cwd, languages);
  const registered = ensureSerenaRegistered(cwd);
  return { configured, registered };
}
