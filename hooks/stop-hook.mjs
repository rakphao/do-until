#!/usr/bin/env node
import fs from "node:fs";
import { execSync } from "node:child_process";
import { normalizePath } from "../lib/paths.mjs";
import { extractPromiseText, readState, removeState, writeState } from "../lib/state.mjs";
import { lastAssistantText } from "../lib/transcript.mjs";
import {
  readSpec,
  getCurrentDeliverable,
  getPendingDeliverables,
  markDeliverableDone,
  areAllDeliverablesDone,
} from "../lib/spec.mjs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

function fail(message, statePath) {
  console.error(message);
  removeState();
  process.exit(0);
}

const hookInputRaw = await readStdin();
let hookInput = {};
try {
  hookInput = hookInputRaw ? JSON.parse(hookInputRaw) : {};
} catch {
  hookInput = {};
}

const localState = readState();
const spec = readSpec();
if (spec && spec.frontmatter && spec.frontmatter.confirmed !== true && !localState) {
  // Planning Session in progress — do not block; wait for human answer to the current question.
  process.exit(0);
}
if (!localState) process.exit(0);

const state = localState;

const { frontmatter, body, filePath } = state;
const iteration = Number(frontmatter.iteration);
const maxIterations = Number(frontmatter.max_iterations);
const completionPromise = frontmatter.completion_promise ?? "null";
let stateSession = frontmatter.session_id ?? "";
if (stateSession === "null") stateSession = "";
const hookSession =
  process.env.GROK_SESSION_ID || hookInput.session_id || hookInput.sessionId || "";

if (stateSession && hookSession && stateSession !== hookSession) {
  process.exit(0);
}

if (!Number.isInteger(iteration) || !Number.isInteger(maxIterations)) {
  fail("do-until: corrupted state file, stopping loop", filePath);
}

if (maxIterations > 0 && iteration >= maxIterations) {
  console.log(`do-until: max iterations (${maxIterations}) reached`);
  removeState();
  process.exit(0);
}

const transcriptPath = normalizePath(hookInput.transcript_path || hookInput.transcriptPath || "");
if (!transcriptPath || !fs.existsSync(transcriptPath)) {
  fail("do-until: transcript not found, stopping loop", filePath);
}

const lastOutput = lastAssistantText(transcriptPath);
if (lastOutput === null) {
  fail("do-until: no assistant messages in transcript, stopping loop", filePath);
}

if (completionPromise !== "null" && completionPromise) {
  const promiseText = extractPromiseText(lastOutput, completionPromise);
  if (promiseText && promiseText === completionPromise) {
    console.log("do-until: completion promise matched");
    removeState();
    process.exit(0);
  }
}

if (!body) {
  fail("do-until: empty prompt in state file, stopping loop", filePath);
}

// v0.3: Deliverable-aware loop. When confirmed spec, always focus on the next pending deliverable.
// Auto-advance (mark done) only happens if a verify_command is configured and succeeds.
let effectiveReason = body;
let currentDeliv = null;
let delivPending = [];
let delivTotal = 0;
let delivDoneCount = 0;
let delivPos = 0;
let delivCurrTitle = null;
let delivCompleted = [];
const specFm = spec && spec.frontmatter ? spec.frontmatter : {};
const verifyCommand =
  specFm.verify_command && specFm.verify_command !== "null" ? specFm.verify_command : null;

if (spec && specFm.confirmed === true) {
  currentDeliv = getCurrentDeliverable(spec);
  if (!currentDeliv) {
    if (areAllDeliverablesDone(spec)) {
      console.log("do-until: all deliverables completed");
    }
    removeState();
    process.exit(0);
  }

  // Claim/advance only on explicit mention of title or #id (to gate verify runs)
  let displaySpec = spec;
  const claimRe = new RegExp(
    currentDeliv.title + '|' + '#' + (currentDeliv.id || (currentDeliv.index + 1)),
    'i'
  );
  const didClaim = !!(lastOutput && claimRe.test(lastOutput));

  let didAdvance = false;
  if (didClaim) {
    if (verifyCommand) {
      try {
        execSync(verifyCommand, { stdio: "inherit", shell: true });
        markDeliverableDone(currentDeliv.index);
        console.log(`do-until: deliverable verified and marked done: ${currentDeliv.title}`);
        didAdvance = true;
      } catch {
        console.log(`do-until: verify command failed for current deliverable (continuing on it)`);
      }
    } else {
      markDeliverableDone(currentDeliv.index);
      console.log(`do-until: deliverable claimed complete: ${currentDeliv.title}`);
      didAdvance = true;
    }
  }

  if (didAdvance) {
    displaySpec = readSpec();
    currentDeliv = getCurrentDeliverable(displaySpec);
    if (!currentDeliv) {
      console.log("do-until: all deliverables completed");
      removeState();
      process.exit(0);
    }
  }

  if (currentDeliv) {
    delivCurrTitle = currentDeliv.title;
    // displaySpec may be refreshed after a successful claim+advance
    delivPending = getPendingDeliverables(displaySpec);
    delivTotal = displaySpec.deliverables ? displaySpec.deliverables.length : 0;
    delivDoneCount = (displaySpec.deliverables || []).filter(d => d.status === 'done').length;
    delivPos = currentDeliv.id || (currentDeliv.index + 1);
    delivCompleted = (displaySpec.deliverables || []).filter(d => d.status === 'done');

    let reason = `Objective: ${body}\n\nCurrent deliverable #${delivPos} (${delivPos}/${delivTotal}): ${currentDeliv.title}`;

    if (delivPending.length > 1) {
      const others = delivPending.slice(1).map(d => `#${d.id} ${d.title}`).join(' | ');
      reason += `\nRemaining: ${others}`;
    }

    if (verifyCommand) {
      reason += `\n\nVerify command: ${verifyCommand}\n\nComplete this deliverable. When done, run the verify command so the loop can automatically advance.`;
    } else {
      reason += `\n\nComplete this deliverable. When done, mention the title or #${delivPos} in your output so the loop can advance to the next.`;
    }

    reason += `\n\n(Full plan and live status: .grok/do-until.spec.md)`;
    effectiveReason = reason;
  }
}

// Update iteration and persist (use original body for local state)
const nextIteration = iteration + 1;
const updatedFrontmatter = { ...state.frontmatter, iteration: nextIteration };

// v0.3: keep local state in sync with current deliverable progress for easy inspection
if (spec && specFm.confirmed === true) {
  const curr = delivCurrTitle || (delivPending.length > 0 ? delivPending[0].title : null);
  updatedFrontmatter.current_deliverable = curr || "null";
  updatedFrontmatter.current_deliverable_id = delivPos || null;
  updatedFrontmatter.deliverables_progress = `${delivDoneCount}/${delivTotal}`;
  updatedFrontmatter.pending_deliverables = delivPending.map(d => `#${d.id} ${d.title}`).join(', ') || 'none';
  updatedFrontmatter.completed_deliverables = delivCompleted.map(d => `#${d.id} ${d.title}`).join(', ') || 'none';
  if (!updatedFrontmatter.verify_command || updatedFrontmatter.verify_command === "null") {
    updatedFrontmatter.verify_command = specFm.verify_command || "null";
  }
}

writeState({ frontmatter: updatedFrontmatter, body: state.body });

let systemMessage =
  completionPromise !== "null" && completionPromise
    ? `do-until iteration ${nextIteration} | finish with <promise>${completionPromise}</promise> when truly done`
    : `do-until iteration ${nextIteration} | continue until task is complete`;

if (currentDeliv) {
  let extra = '';
  if (delivTotal - delivPos > 0) {
    extra = ` (${delivTotal - delivPos} more)`;
  }
  systemMessage += ` | Deliverable #${delivPos}/${delivTotal}: ${currentDeliv.title}${extra}`;
  if (verifyCommand) {
    systemMessage += ` | verify: ${verifyCommand}`;
  }
}

process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason: effectiveReason,
    systemMessage,
  }),
);