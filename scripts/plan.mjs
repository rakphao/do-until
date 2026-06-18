#!/usr/bin/env node
import { readSpec, writeSpec, addDeliverable, isComplete, formatForDisplay, setConfirmed, updateSpec, SPEC_FILE } from "../lib/spec.mjs";
import { writeState } from "../lib/state.mjs";

const HELP = `do-until-plan — start a Planning Session to create a Loop Spec

USAGE:
  /do-until-plan [OBJECTIVE...] [OPTIONS]
  /do-until-plan --confirm

SUBCOMMANDS (advanced):
  init [OBJECTIVE...]           Seed or start planning session
  set <field> <value...>        Set a scalar field (objective, verify_command, completion_promise, max_iterations, constraints)
  add-deliverable <title...>    Append a deliverable
  show                          Pretty-print current spec
  confirm                       Mark spec confirmed and activate Execution Loop

OPTIONS:
  --max-iterations <n>
  --completion-promise '<text>'
  --confirm                     Confirm the plan and start execution (same as typing CONFIRM)
  -h, --help

The agent will conduct an interactive Planning Session (one question at a time with choices).
You must explicitly confirm before any autonomous Execution Loop starts.
Spec file: .grok/do-until.spec.md
Cancel planning or loop: /cancel-do-until
`;

function parseCommon(argv) {
  let objectiveParts = [];
  let maxIterations = 0;
  let completionPromise = "null";
  let confirm = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") {
      console.log(HELP);
      process.exit(0);
    }
    if (arg === "--confirm") {
      confirm = true;
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
    objectiveParts.push(arg);
  }

  return {
    objective: objectiveParts.join(" ").trim(),
    maxIterations,
    completionPromise,
    confirm,
  };
}

const sessionId = process.env.GROK_SESSION_ID || process.env.CLAUDE_CODE_SESSION_ID || "";

function getSpecOrNull() {
  return readSpec();
}

function seedFrontmatter({ objective, maxIterations, completionPromise }) {
  const fm = {
    objective: objective || "null",
    verify_command: "null",
    completion_promise: completionPromise,
    max_iterations: maxIterations,
    confirmed: false,
    started_at: new Date().toISOString(),
  };
  if (sessionId) fm.session_id = sessionId;
  return fm;
}

function doInit(args) {
  const { objective, maxIterations, completionPromise } = parseCommon(args);
  const existing = getSpecOrNull();

  if (existing && !existing.frontmatter.confirmed) {
    console.log("Planning session already in progress. Current spec:");
    console.log(formatForDisplay(existing));
    console.log("\nContinue answering the agent's questions, or use /do-until-plan --confirm when ready.");
    return;
  }
  if (existing && existing.frontmatter.confirmed) {
    console.log("A confirmed spec already exists. Use /do-until --from-spec to start execution or /cancel-do-until first.");
    return;
  }

  const fm = seedFrontmatter({ objective, maxIterations, completionPromise });
  const dels = [];
  writeSpec({ frontmatter: fm, deliverables: dels });

  const maxLabel = maxIterations > 0 ? String(maxIterations) : "unlimited";
  const promiseLabel = completionPromise !== "null" ? completionPromise : "none";

  console.log(`do-until planning session started

Spec: ${SPEC_FILE}
Objective: ${objective || "(will be refined in interview)"}
Max iterations: ${maxLabel}
Completion promise: ${promiseLabel}

The agent will now ask planning questions one at a time.
Answer, then it will persist and ask the next.
When the full plan is ready it will ask you to reply exactly: CONFIRM`);
}

function doSet(args) {
  // args after "set"
  if (args.length < 2) {
    console.error("Usage: plan set <field> <value...>");
    process.exit(1);
  }
  const field = args[0];
  const value = args.slice(1).join(" ").trim();

  const allowed = ["objective", "verify_command", "completion_promise", "max_iterations", "constraints"];
  if (!allowed.includes(field)) {
    console.error(`Unknown field "${field}". Allowed: ${allowed.join(", ")}`);
    process.exit(1);
  }

  let patch = {};
  if (field === "max_iterations") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
      console.error("max_iterations must be a non-negative integer");
      process.exit(1);
    }
    patch = { max_iterations: n };
  } else {
    patch = { [field]: value || "null" };
  }

  updateSpec({ frontmatterPatch: patch });
  console.log(`Recorded ${field}.`);
  const now = readSpec();
  if (now) console.log(formatForDisplay(now));
}

function doAddDeliverable(args) {
  const title = args.join(" ").trim();
  if (!title) {
    console.error("Usage: plan add-deliverable <title>");
    process.exit(1);
  }
  const path = addDeliverable(title);
  console.log(`Added deliverable: ${title}`);
  const now = readSpec();
  if (now) console.log(formatForDisplay(now));
}

function doShow() {
  const spec = readSpec();
  if (!spec) {
    console.log("No planning spec found. Start with /do-until-plan \"your objective\"");
    return;
  }
  console.log(formatForDisplay(spec));
  if (!isComplete(spec)) {
    console.log("\n(Spec is not yet complete for confirmation.)");
  } else if (!spec.frontmatter.confirmed) {
    console.log("\nReady for confirmation: reply CONFIRM or run /do-until-plan --confirm");
  } else {
    console.log("\nSpec is confirmed.");
  }
}

function doConfirm() {
  const spec = readSpec();
  if (!spec) {
    console.error("No spec to confirm. Start a planning session first.");
    process.exit(1);
  }
  if (spec.frontmatter.confirmed) {
    console.log("Spec is already confirmed.");
    // still ensure local exists
    ensureLocalFromSpec(spec);
    return;
  }
  if (!isComplete(spec)) {
    console.error("Cannot confirm: spec is incomplete.");
    console.error("Need: objective + at least one deliverable.");
    console.error(formatForDisplay(spec));
    process.exit(1);
  }

  setConfirmed(true);
  ensureLocalFromSpec(readSpec());

  console.log(`do-until: Confirmation accepted. Spec confirmed.
Loop state written from spec.
Starting Execution Loop on objective.

${spec.frontmatter.objective}`);
}

function ensureLocalFromSpec(spec) {
  if (!spec || !spec.frontmatter.confirmed) return;
  const fm = spec.frontmatter;
  const body = fm.objective || "";
  const localFm = {
    active: true,
    iteration: 1,
    session_id: fm.session_id || sessionId,
    max_iterations: fm.max_iterations || 0,
    completion_promise: fm.completion_promise || "null",
    started_at: new Date().toISOString(),
  };
  writeState({ frontmatter: localFm, body });
}

function main() {
  const raw = process.argv.slice(2);

  // Top level flags
  if (raw.includes("--help") || raw.includes("-h")) {
    console.log(HELP);
    process.exit(0);
  }

  if (raw.includes("--confirm") || raw[0] === "confirm") {
    doConfirm();
    return;
  }

  const action = raw[0];
  const rest = raw.slice(1);

  if (!action || ["init"].includes(action)) {
    // direct init path or bare /do-until-plan "obj"
    doInit(action === "init" ? rest : raw);
    return;
  }

  if (action === "set") {
    doSet(rest);
    return;
  }
  if (action === "add-deliverable" || action === "add") {
    doAddDeliverable(rest);
    return;
  }
  if (action === "show") {
    doShow();
    return;
  }
  if (action === "confirm") {
    doConfirm();
    return;
  }

  // Fallback: treat remaining as objective for init
  doInit(raw);
}

main();
