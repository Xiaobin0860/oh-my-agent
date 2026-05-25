import type { Command } from "commander";
import {
  addOutputOptions,
  resolveJsonMode,
  runAction,
} from "../../utils/cli-framework.js";
import {
  activateStateSession,
  collectState,
  renderSessionView,
  renderStateList,
  viewSession,
} from "./state.js";

export function registerState(program: Command): void {
  addOutputOptions(
    program
      .command("state [sid]")
      .description("Inspect OMA L1 workflow state")
      .option("--activate <sid>", "Set active session id")
      .option("--category <category>", "Active category", "main"),
  ).action(
    runAction(
      async (sid: string | undefined, options) => {
        const jsonMode = resolveJsonMode(options);
        const activate = options.activate as string | undefined;
        const category = (options.category as string | undefined) ?? "main";

        if (activate) {
          activateStateSession(activate, category);
          if (jsonMode) {
            console.log(JSON.stringify({ activated: activate, category }));
          } else {
            console.log(`Activated ${category}: ${activate}`);
          }
          return;
        }

        if (sid) {
          const result = viewSession(sid);
          if (jsonMode) {
            console.log(JSON.stringify(result, null, 2));
          } else {
            console.log(renderSessionView(sid, result.meta, result.events));
          }
          return;
        }

        const state = collectState();
        if (jsonMode) {
          console.log(JSON.stringify(state, null, 2));
        } else {
          console.log(renderStateList(state));
        }
      },
      { supportsJsonOutput: true },
    ),
  );
}
