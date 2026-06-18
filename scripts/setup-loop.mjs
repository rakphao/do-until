#!/usr/bin/env node
import { writeState } from "../lib/state.mjs";
import { readSpec, isComplete, getPendingDeliverables, areAllDeliverablesDone } from "../lib/spec.mjs";

const HELP = `do-until — work on a task until completion

USAGE:
  /do-until [PROMPT...] [OPTIONS]
  /do-until --from-spec

OPTIONS:
  --max-iterations <n>           Stop after N iterations (default: unlimited)
  --completion-promise '<text>'  Promise phrase (quote multi-word values)
  --from-spec                    Start (or resume) execution from a confirmed .grok/do-until.spec.md
  -h, --help                     Show this help

EXAMPLES:
  /do-until Fix auth bug --max-iterations 20
  /do-until "Complete sprint 4" --completion-promise "DONE"
  /do-until --from-spec

When using --from-spec, the loop focuses on the next pending deliverable from the spec (one at a time). If verify_command is configured, it is run as a gate before marking complete and advancing. Without verify, mention the title or #id in output to claim and advance.

STOP:
  /cancel-do-until

MONITOR:
  Get-Content .grok\\do-until.local.md -Head 15   (PowerShell)
  type .grok\\do-until.local.md                   (cmd)
  cat .grok/do-until.local.md                     (macOS/Linux)

When started with --from-spec (and there is pending work), the printed "loop started" message and .local.md will also contain:
Current deliverable: Task two (id: 2)
Deliverables progress: 1/2
Pending: #2 Task two
Completed: #1 Task one
Verify command: echo verified && exit 0
(plus standard fields in .local.md)

If the spec shows all deliverables done, setup prints a short message and exits without writing .local.md or starting the loop.
`;

function parseArgs(argv) {
  const promptParts = [];
  let maxIterations = 0;
  let completionPromise = "null";
  let fromSpec = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (arg === "--from-spec") {
      fromSpec = true;
      continue;
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
  return { prompt, maxIterations, completionPromise, fromSpec };
}

const { prompt, maxIterations, completionPromise, fromSpec } = parseArgs(process.argv.slice(2));
const sessionId = process.env.GROK_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || "";

let effectivePrompt = prompt;
let effectiveMax = maxIterations;
let effectivePromise = completionPromise;

if (fromSpec) {
  const spec = readSpec();
  if (!spec) {
    console.error("Error: --from-spec was used but no .grok/do-until.spec.md found.");
    process.exit(1);
  }
  if (!spec.frontmatter.confirmed) {
    console.error("Error: spec exists but is not confirmed. Finish Planning Session and reply CONFIRM (or run /do-until-plan --confirm) first.");
    process.exit(1);
  }
  if (!isComplete(spec)) {
    console.error("Error: confirmed spec is incomplete.");
    process.exit(1);
  }
  if (areAllDeliverablesDone(spec)) {
    console.log("All deliverables already complete according to the spec. No execution loop started.");
    process.exit(0);
  }
  effectivePrompt = spec.frontmatter.objective || "";
  effectiveMax = spec.frontmatter.max_iterations || 0;
  effectivePromise = spec.frontmatter.completion_promise || "null";
}

if (!effectivePrompt) {
  console.error("Error: No prompt provided. Example: /do-until Fix the failing tests  or  /do-until --from-spec");
  process.exit(1);
}

const baseFrontmatter = {
  active: true,
  iteration: 1,
  session_id: sessionId,
  max_iterations: effectiveMax,
  completion_promise: effectivePromise,
  started_at: new Date().toISOString(),
};

if (fromSpec) {
  const currentSpec = readSpec();
  const allDels = currentSpec.deliverables || [];
  const pending = getPendingDeliverables(currentSpec);
  const doneCount = allDels.filter(d => d.status === 'done').length;
  const current = pending.length > 0 ? pending[0].title : null;
  const currentId = pending.length > 0 ? pending[0].id : null;
  if (current) {
    baseFrontmatter.current_deliverable = current;
    baseFrontmatter.current_deliverable_id = currentId;
  }
  baseFrontmatter.deliverables_progress = `${doneCount}/${allDels.length}`;
  baseFrontmatter.verify_command = currentSpec.frontmatter.verify_command || "null";
  baseFrontmatter.pending_deliverables = pending.map(d => `#${d.id} ${d.title}`).join(', ') || 'none';
  const completed = allDels.filter(d => d.status === 'done').map(d => `#${d.id} ${d.title}`);
  baseFrontmatter.completed_deliverables = completed.join(', ') || 'none';
}

writeState({
  frontmatter: baseFrontmatter,
  body: effectivePrompt,
});

const maxLabel = effectiveMax > 0 ? String(effectiveMax) : "unlimited";
const promiseLabel = effectivePromise !== "null" ? effectivePromise : "none";
const sourceLabel = fromSpec ? " (from confirmed spec)" : "";

let startMessage = `do-until loop started${sourceLabel}

Iteration: 1
Max iterations: ${maxLabel}
Completion promise: ${promiseLabel}
State: .grok/do-until.local.md`;

if (fromSpec) {
  // Guard in fromSpec block ensures we only reach here with a current deliverable
  startMessage += `
Current deliverable: ${baseFrontmatter.current_deliverable}`;
  if (baseFrontmatter.current_deliverable_id && baseFrontmatter.current_deliverable_id !== null) {
    startMessage += ` (id: ${baseFrontmatter.current_deliverable_id})`;
  }
  startMessage += `
Deliverables progress: ${baseFrontmatter.deliverables_progress}`;
  if (baseFrontmatter.pending_deliverables && baseFrontmatter.pending_deliverables !== 'none') {
    startMessage += `
Pending: ${baseFrontmatter.pending_deliverables}`;
  }
  if (baseFrontmatter.completed_deliverables && baseFrontmatter.completed_deliverables !== 'none') {
    startMessage += `
Completed: ${baseFrontmatter.completed_deliverables}`;
  }
  if (baseFrontmatter.verify_command && baseFrontmatter.verify_command !== "null") {
    startMessage += `
Verify command: ${baseFrontmatter.verify_command}`;
  }
}

startMessage += `

The Stop hook will re-feed this prompt after each turn until done or the limit is reached.
Cancel anytime: /cancel-do-until

${effectivePrompt}`;

console.log(startMessage);

if (effectivePromise !== "null") {
  console.log(`
To finish, output exactly:
  <promise>${effectivePromise}</promise>
Only when the statement is genuinely true.`);
}