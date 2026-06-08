import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentVendor } from "../../utils/agent-spawn.ts";
import {
  collectGitContext,
  formatContextForPrompt,
} from "../../utils/git-context.ts";
import {
  articleToEnglishDraft,
  fetchDevtoArticle,
  fetchDevtoList,
  generateWeeklyEnglish,
  prepareWeeklyEnglishPrompt,
  publishToDevto,
} from "./devto.ts";
import {
  ensureDraftDir,
  writeEnglishDraft,
  writeJapaneseDraft,
  writePrompt,
} from "./drafts.ts";
import {
  generateWeeklyJapanese,
  prepareSyncReviewPrompt,
  prepareTranslatePrompt,
  prepareWeeklyJapanesePrompt,
  prepareWeeklyReviewPrompt,
  publishToQiita,
  reviewJapaneseDraft,
  translateToJapanese,
} from "./qiita.ts";
import type { EnglishDraft, JapaneseDraft } from "./types.ts";

export type SnsTarget = "devto" | "qiita";

export interface SnsArgs {
  since: string;
  count: number;
  vendor?: AgentVendor;
  force: boolean;
  dryRun: boolean;
  sync: boolean;
  skipReview: boolean;
  articleId?: number;
  targets: Set<SnsTarget>;
}

export function parseSnsArgs(argv: string[]): SnsArgs {
  const args: SnsArgs = {
    since: "1 week ago",
    count: 3,
    force: false,
    dryRun: false,
    sync: false,
    skipReview: false,
    targets: new Set<SnsTarget>(["devto", "qiita"]),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--since" && argv[i + 1]) {
      args.since = argv[i + 1] as string;
      i += 1;
    } else if (arg?.startsWith("--since=")) {
      args.since = arg.slice("--since=".length);
    } else if (arg === "--count" && argv[i + 1]) {
      args.count = Number(argv[i + 1]);
      i += 1;
    } else if (arg?.startsWith("--count=")) {
      args.count = Number(arg.slice("--count=".length));
    } else if (arg === "--article-id" && argv[i + 1]) {
      args.articleId = Number(argv[i + 1]);
      args.sync = true;
      i += 1;
    } else if (arg?.startsWith("--article-id=")) {
      args.articleId = Number(arg.slice("--article-id=".length));
      args.sync = true;
    } else if (arg === "--vendor" && argv[i + 1]) {
      args.vendor = argv[i + 1] as AgentVendor;
      i += 1;
    } else if (arg?.startsWith("--vendor=")) {
      args.vendor = arg.slice("--vendor=".length) as AgentVendor;
    } else if (arg === "--force" || arg === "--publish") {
      args.force = true;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--sync") {
      args.sync = true;
    } else if (arg === "--skip-review") {
      args.skipReview = true;
    } else if (arg === "--targets" && argv[i + 1]) {
      args.targets = new Set(
        argv[i + 1]!.split(",").map((t) => t.trim() as SnsTarget),
      );
      i += 1;
    } else if (arg?.startsWith("--targets=")) {
      args.targets = new Set(
        arg
          .slice("--targets=".length)
          .split(",")
          .map((t) => t.trim() as SnsTarget),
      );
    }
  }
  if (!Number.isFinite(args.count) || args.count < 1) {
    throw new Error("--count must be a positive integer.");
  }
  if (args.force && args.dryRun) {
    throw new Error("--force and --dry-run cannot be used together.");
  }
  return args;
}

function uploadMode(args: SnsArgs): string {
  if (args.dryRun) return "dry-run (prompts + local files only)";
  if (args.force) return "force (publish publicly)";
  return "draft (upload unpublished drafts)";
}

async function finalizeJapanese(
  label: string,
  draft: JapaneseDraft,
  args: SnsArgs,
  outDir: string,
  reviewPrompt?: string,
): Promise<JapaneseDraft | null> {
  const draftPaths = writeJapaneseDraft(outDir, `${label}-draft`, draft);
  console.log(`[ja/qiita draft] ${draft.title}`);
  console.log(`  md: ${draftPaths.mdPath}`);

  let japanese = draft;
  if (!args.skipReview && reviewPrompt) {
    const reviewPromptPath = writePrompt(
      outDir,
      `${label}-review`,
      reviewPrompt,
    );
    console.log(`  prompt (review): ${reviewPromptPath}`);
    console.log(`Spawning reviewer (vendor=${args.vendor ?? "auto"})...`);
    const reviewed = reviewJapaneseDraft(draft, args.vendor, reviewPrompt);
    if ("skip" in reviewed) {
      console.log(
        `[ja/qiita review] skipped: ${reviewed.reason}; using first-pass draft`,
      );
    } else {
      japanese = reviewed;
    }
  }

  const jaPaths = writeJapaneseDraft(outDir, label, japanese);
  console.log(`[ja/qiita final] ${japanese.title}`);
  console.log(`  md: ${jaPaths.mdPath}`);

  if (args.dryRun) return null;

  if (args.targets.has("qiita")) {
    const posted = await publishToQiita(japanese, args.force);
    const where = args.force ? "published" : "saved as private draft";
    console.log(`Qiita: ${where} (${posted.url})`);
  }
  return japanese;
}

async function runWeeklyDevto(
  args: SnsArgs,
  outDir: string,
  enPrompt: string,
): Promise<void> {
  const enPromptPath = writePrompt(outDir, "weekly-en", enPrompt);
  console.log(`[en/dev.to] prompt: ${enPromptPath}`);

  if (args.dryRun) return;

  console.log(`Spawning dev.to author (vendor=${args.vendor ?? "auto"})...`);
  const english = generateWeeklyEnglish(args.since, args.vendor, enPrompt);
  if ("skip" in english) {
    console.log(`[en/dev.to] skipped: ${english.reason}`);
    return;
  }

  const enPaths = writeEnglishDraft(outDir, "weekly", english);
  console.log(`[en/dev.to] ${english.title}`);
  console.log(`  md: ${enPaths.mdPath}`);

  const posted = await publishToDevto(english, args.force);
  const where = args.force ? "published" : "saved as draft";
  console.log(`dev.to: ${where} (${posted.url ?? `id=${posted.id}`})`);
}

async function runWeeklyQiita(
  args: SnsArgs,
  outDir: string,
  gitBlock: string,
  jaPrompt: string,
): Promise<void> {
  const jaPromptPath = writePrompt(outDir, "weekly-ja", jaPrompt);
  console.log(`[ja/qiita] prompt: ${jaPromptPath}`);

  if (args.dryRun) return;

  console.log(`Spawning Qiita author (vendor=${args.vendor ?? "auto"})...`);
  const draft = generateWeeklyJapanese(args.since, args.vendor, jaPrompt);
  if ("skip" in draft) {
    console.log(`[ja/qiita] skipped: ${draft.reason}`);
    return;
  }

  const reviewPrompt = args.skipReview
    ? undefined
    : prepareWeeklyReviewPrompt(gitBlock, draft);
  await finalizeJapanese("weekly", draft, args, outDir, reviewPrompt);
}

async function runWeekly(args: SnsArgs, outDir: string): Promise<void> {
  console.log(`Collecting git context (since=${args.since})...`);
  const ctx = collectGitContext(args.since);
  if (ctx.commitCount === 0) {
    console.log("No commits in range. Aborting.");
    return;
  }
  const gitBlock = formatContextForPrompt(ctx);

  const needEn = args.targets.has("devto");
  const needJa = args.targets.has("qiita");

  if (needEn) {
    const enPrepared = prepareWeeklyEnglishPrompt(args.since);
    if ("skip" in enPrepared) {
      console.log(`[en/dev.to] skipped: ${enPrepared.reason}`);
    } else {
      await runWeeklyDevto(args, outDir, enPrepared.prompt);
    }
  }

  if (needJa) {
    const jaPrepared = prepareWeeklyJapanesePrompt(args.since);
    if ("skip" in jaPrepared) {
      console.log(`[ja/qiita] skipped: ${jaPrepared.reason}`);
    } else {
      await runWeeklyQiita(args, outDir, gitBlock, jaPrepared.prompt);
    }
  }

  if (args.dryRun) {
    console.log("[weekly] dry-run: prompts saved; skipping agents and upload");
  }
}

async function runSyncQiita(
  label: string,
  english: EnglishDraft,
  args: SnsArgs,
  outDir: string,
): Promise<void> {
  const enPaths = writeEnglishDraft(outDir, label, english);
  console.log(`[en/dev.to source] ${english.title}`);
  console.log(`  md: ${enPaths.mdPath}`);

  const translatePrompt = prepareTranslatePrompt(english);
  const translatePromptPath = writePrompt(
    outDir,
    `${label}-translate`,
    translatePrompt,
  );
  console.log(`  prompt (translate): ${translatePromptPath}`);

  if (args.dryRun) return;

  console.log(`Spawning translator (vendor=${args.vendor ?? "auto"})...`);
  const draft = translateToJapanese(english, args.vendor, translatePrompt);
  if ("skip" in draft) {
    console.log(`[ja/qiita] skipped: ${draft.reason}`);
    return;
  }

  const reviewPrompt = args.skipReview
    ? undefined
    : prepareSyncReviewPrompt(english, draft);
  await finalizeJapanese(label, draft, args, outDir, reviewPrompt);
}

async function runSync(args: SnsArgs, outDir: string): Promise<void> {
  const summaries = args.articleId
    ? [{ id: args.articleId }]
    : (await fetchDevtoList(args.count)).map((s) => ({ id: s.id }));

  if (summaries.length === 0) {
    console.log("No dev.to articles found.");
    return;
  }

  for (const summary of summaries) {
    console.log(`\nFetching dev.to article id=${summary.id}...`);
    const article = await fetchDevtoArticle(summary.id);
    const english = articleToEnglishDraft(article);
    await runSyncQiita(String(summary.id), english, args, outDir);
  }
}

export async function runSns(argv: string[]): Promise<void> {
  const args = parseSnsArgs(argv);
  const outDir = ensureDraftDir(join(tmpdir(), `sns-drafts-${Date.now()}`));
  console.log(`Draft directory: ${outDir}`);
  console.log(
    `Mode: ${args.sync ? "sync (dev.to article → Qiita)" : `weekly (git since=${args.since})`}`,
  );
  console.log(`Targets: ${[...args.targets].join(", ")}`);
  console.log(`Upload: ${uploadMode(args)}`);

  if (args.sync) {
    await runSync(args, outDir);
  } else {
    await runWeekly(args, outDir);
  }

  if (args.dryRun) {
    console.log(`\nDry run complete. See prompts and drafts in:\n  ${outDir}`);
  }
}
