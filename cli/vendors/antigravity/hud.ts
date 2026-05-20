/**
 * Antigravity CLI (agy) wiring. agy maintains HOME-only config at
 * `~/.gemini/antigravity-cli/settings.json` and supports Claude-style
 * hook events (`PreToolUse`, `PostToolUse`, `Stop`) plus a native
 * `StatusLine` field, all verified by `strings` on the v1.0.0 binary.
 *
 * This installer is parallel to (not part of) the project-scoped
 * `installHooksFromVariant` pipeline because:
 *   - paths resolve under $HOME, not the project root
 *   - hook commands must be absolute (agy doesn't expose a project-dir env)
 *   - the file shares space with `colorScheme`, `toolPermission`, etc., so
 *     we merge instead of overwrite
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { clearNonDirectory } from "../../utils/fs-utils.js";

const AGY_HOME_DIR = ".gemini/antigravity-cli";

interface AgySettings {
  // biome-ignore lint/suspicious/noExplicitAny: settings.json schema is dynamic
  [key: string]: any;
}

function agyPaths() {
  const home = homedir();
  const settingsPath = join(home, AGY_HOME_DIR, "settings.json");
  const hooksDir = join(home, AGY_HOME_DIR, "hooks");
  return { home, settingsPath, hooksDir };
}

function readAgySettings(settingsPath: string): AgySettings {
  if (!existsSync(settingsPath)) return {};
  try {
    return JSON.parse(readFileSync(settingsPath, "utf-8"));
  } catch {
    return {};
  }
}

function copyCoreHooks(sourceDir: string, hooksDir: string): void {
  const src = join(sourceDir, ".agents", "hooks", "core");
  if (!existsSync(src)) return;

  mkdirSync(hooksDir, { recursive: true });
  for (const entry of readdirSync(hooksDir, { withFileTypes: true })) {
    clearNonDirectory(join(hooksDir, entry.name));
  }
  cpSync(src, hooksDir, { recursive: true, force: true, dereference: true });
}

interface AgyInstallResult {
  installed: boolean;
  reason?: string;
  settingsPath?: string;
  hooksDir?: string;
}

/**
 * Install the OMA HUD (and supporting Claude-style hooks) into agy's HOME
 * config. Idempotent — running twice produces the same settings.json. Other
 * keys (colorScheme, toolPermission, trustedWorkspaces, ...) are preserved.
 *
 * Returns `installed: false` with a `reason` when agy's config dir doesn't
 * exist, which signals "agy not installed / never run" — we don't bootstrap
 * the dir ourselves because we'd risk masking an install bug.
 */
export function installAntigravityHud(sourceDir: string): AgyInstallResult {
  const { settingsPath, hooksDir } = agyPaths();
  const agyConfigDir = join(homedir(), AGY_HOME_DIR);

  if (!existsSync(agyConfigDir)) {
    return {
      installed: false,
      reason: `agy config dir not found at ~/${AGY_HOME_DIR} — run agy once to initialize`,
    };
  }

  copyCoreHooks(sourceDir, hooksDir);

  const settings = readAgySettings(settingsPath);
  const hudAbs = join(hooksDir, "hud.ts");
  const testFilterAbs = join(hooksDir, "test-filter.ts");
  const persistentModeAbs = join(hooksDir, "persistent-mode.ts");

  settings.statusLine = {
    type: "command",
    command: `bun "${hudAbs}"`,
  };

  const existingHooks =
    settings.hooks && typeof settings.hooks === "object" ? settings.hooks : {};

  settings.hooks = {
    ...existingHooks,
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [
          {
            name: "test-filter",
            type: "command",
            command: `bun "${testFilterAbs}"`,
            timeout: 5,
          },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          {
            name: "persistent-mode",
            type: "command",
            command: `bun "${persistentModeAbs}"`,
            timeout: 5,
          },
        ],
      },
    ],
  };

  mkdirSync(join(homedir(), AGY_HOME_DIR), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);

  return { installed: true, settingsPath, hooksDir };
}
