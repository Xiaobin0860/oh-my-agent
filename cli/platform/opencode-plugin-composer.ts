import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { copyHookScripts } from "./hooks-composer.js";

/**
 * Install path for the opencode (Sst opencode) plugin bridge.
 *
 * Unlike the other vendors, opencode does not register settings-file hooks; it
 * loads in-process TypeScript plugins from `.opencode/plugins/`. So opencode is
 * NOT handled by `installHooksFromVariant`. Instead it gets this forked path,
 * invoked from `link()` whenever `opencode` is in the configured vendor set.
 *
 * NOTE: opencode's auto-discovery is flat — it only loads `.opencode/plugins/*`
 * files, not subdirectories. The bridge lives in a nested `oma/` subdir (it
 * spawns the core hook scripts copied alongside it), so it is invisible to
 * auto-discovery and must be registered explicitly via `registerOpencodePlugin`.
 *
 * See `.agents/hooks/variants/opencode/oma.ts` for the bridge source.
 */

/** Directory (relative to the install root) of the opencode plugin. */
export const OPENCODE_PLUGIN_DIR = join(".opencode", "plugins", "oma");

/**
 * Materialize the opencode bridge into `<targetDir>/.opencode/plugins/oma/`:
 *  1. Copy the vendor-agnostic core hook scripts (keyword-detector,
 *     skill-injector, test-filter, their deps, and `filter-test-output.sh`)
 *     so the bridge can spawn them as subprocesses.
 *  2. Copy the bridge `oma.ts` as the plugin entry point.
 *
 * Idempotent: `copyHookScripts` clears stale non-directory entries (including
 * a previous `oma.ts`) before recopying, then the bridge is re-written.
 */
export function installOpencodePlugin(
  sourceDir: string,
  targetDir: string,
): void {
  const pluginDir = join(targetDir, OPENCODE_PLUGIN_DIR);

  // 1. Core scripts (also clears stale files in pluginDir first).
  copyHookScripts(sourceDir, pluginDir);

  // 2. The bridge entry point.
  const shimSrc = join(
    sourceDir,
    ".agents",
    "hooks",
    "variants",
    "opencode",
    "oma.ts",
  );
  if (existsSync(shimSrc)) {
    cpSync(shimSrc, join(pluginDir, "oma.ts"), {
      force: true,
      dereference: true,
    });
  }
}

/**
 * Config-relative path to the bridge entry point, as registered under the
 * `plugin` key of `.opencode/opencode.jsonc`.
 *
 * The bridge lives in a nested `oma/` subdirectory (alongside the core hook
 * scripts it spawns), but opencode only auto-discovers plugin files placed
 * directly in `.opencode/plugins/`. It does NOT recurse into subdirectories, so
 * the nested bridge is invisible to auto-discovery and must be registered by an
 * explicit relative path instead.
 */
export const OPENCODE_PLUGIN_ENTRY = "./plugins/oma/oma.ts";

const OPENCODE_CONFIG_SCHEMA = "https://opencode.ai/config.json";

/**
 * Strip `//` / block comments while respecting string literals, so a `//`
 * inside a value (e.g. the `https://opencode.ai/config.json` `$schema` URL that
 * every opencode config carries) is preserved rather than truncated. A naive
 * line-based strip would corrupt the config — hence the small scanner.
 */
function stripJsoncComments(raw: string): string {
  let out = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    const next = raw[i + 1];

    if (inLineComment) {
      if (c === "\n") {
        inLineComment = false;
        out += c;
      }
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += c;
      if (c === "\\") {
        out += next ?? "";
        i++;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }
    if (c === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }
    out += c;
  }
  return out;
}

/**
 * Parse a JSONC config into a plain object. Strips comments (string-aware) and
 * trailing commas so `JSON.parse` accepts it. The repo intentionally avoids a
 * heavyweight JSONC dependency (cf. the lenient reader in `utils/competitors.ts`).
 */
function parseJsoncObject(raw: string): Record<string, unknown> {
  const clean = stripJsoncComments(raw).replace(/,(\s*[\]}])/g, "$1");
  const parsed = JSON.parse(clean);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return {};
}

/**
 * Register the OMA bridge in `.opencode/opencode.jsonc` so opencode loads it.
 *
 * `installOpencodePlugin` only materializes the bridge files; opencode will not
 * pick the nested `plugins/oma/oma.ts` up via auto-discovery (which is flat,
 * `.opencode/plugins/*.ts` only). Without an explicit `plugin` entry,
 * `opencode debug info` reports `plugins: none` and bootstrap can fail with
 * `ConfigInvalidError`. This adds `OPENCODE_PLUGIN_ENTRY` to the config's
 * `plugin` array, preserving any existing keys/entries.
 *
 * Idempotent: re-running leaves an already-registered config byte-identical.
 * An existing `opencode.json` is preferred over `opencode.jsonc` when present;
 * otherwise a fresh `opencode.jsonc` is created. Comments in an existing config
 * are dropped on rewrite (same tradeoff as the competitors uninstall path).
 */
export function registerOpencodePlugin(targetDir: string): void {
  const dir = join(targetDir, ".opencode");
  const jsonPath = join(dir, "opencode.json");
  const jsoncPath = join(dir, "opencode.jsonc");
  const configPath = existsSync(jsonPath) ? jsonPath : jsoncPath;

  let config: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      config = parseJsoncObject(readFileSync(configPath, "utf-8"));
    } catch {
      // Malformed config: start fresh rather than abort the whole link run.
      config = {};
    }
  }

  if (typeof config.$schema !== "string") {
    config.$schema = OPENCODE_CONFIG_SCHEMA;
  }

  const plugins = Array.isArray(config.plugin)
    ? config.plugin.filter((p): p is string => typeof p === "string")
    : [];
  if (!plugins.includes(OPENCODE_PLUGIN_ENTRY)) {
    plugins.push(OPENCODE_PLUGIN_ENTRY);
  }
  config.plugin = plugins;

  mkdirSync(dir, { recursive: true });
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}
