#!/usr/bin/env node
import { writeState } from "../lib/state.mjs";

const HELP = `do-until — work on a task until completion

USAGE:
  /do-until [PROMPT...] [OPTIONS]

OPTIONS:
  --max-iterations <n>           Stop after N iterations (default: unlimited)
  --completion-promise '<text>'  Promise phrase (quote multi-word values)
  -h, --help                     Show this help

EXAMPLES:
  /do-until Fix auth bug --max-iterations 20
  /do-until "Complete sprint 4" --completion-promise "DONE"

STOP:
  /cancel-do-until

MONITOR:
  Get-Content .grok\\do-until.local.md -Head 10   (PowerShell)
  type .grok\\do-until.local.md                   (cmd)
  cat .grok/do-until.local.md                     (macOS/Linux)
`;

function parseArgs(argv) {
  const promptParts = [];
  let maxIterations = 0;
  let completionPromise = "null";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (arg === "--max-iterations") {
      const value = argv[++i];
      if (!value || !/^\d+$/.test(value)) {
        console.error("Error: --max-iterations requires a non-negative integer");
        process.exit(1);
      }
      maxIterations = Number(value);
      continue;
    }
    if (arg === "--completion-promise") {
      const value = argv[++i];
      if (!value) {
        console.error("Error: --completion-promise requires text");
        process.exit(1);
      }
      completionPromise = value;
      continue;
    }
    promptParts.push(arg);
  }

  const prompt = promptParts.join(" ").trim();
  if (!prompt) {
    console.error("Error: No prompt provided. Example: /do-until Fix the failing tests");
    process.exit(1);
  }

  return { prompt, maxIterations, completionPromise };
}

const { prompt, maxIterations, completionPromise } = parseArgs(process.argv.slice(2));
const sessionId = process.env.GROK_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || "";

writeState({
  frontmatter: {
    active: true,
    iteration: 1,
    session_id: sessionId,
    max_iterations: maxIterations,
    completion_promise: completionPromise,
    started_at: new Date().toISOString(),
  },
  body: prompt,
});

const maxLabel = maxIterations > 0 ? String(maxIterations) : "unlimited";
const promiseLabel = completionPromise !== "null" ? completionPromise : "none";

console.log(`do-until loop started

Iteration: 1
Max iterations: ${maxLabel}
Completion promise: ${promiseLabel}
State: .grok/do-until.local.md

The Stop hook will re-feed this prompt after each turn until done or the limit is reached.
Cancel anytime: /cancel-do-until

${prompt}`);

if (completionPromise !== "null") {
  console.log(`
To finish, output exactly:
  <promise>${completionPromise}</promise>
Only when the statement is genuinely true.`);
}