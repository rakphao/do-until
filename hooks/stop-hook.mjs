#!/usr/bin/env node
import fs from "node:fs";
import { normalizePath } from "../lib/paths.mjs";
import { extractPromiseText, readState, removeState } from "../lib/state.mjs";
import { lastAssistantText } from "../lib/transcript.mjs";

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

const state = readState();
if (!state) process.exit(0);

const { frontmatter, body, filePath } = state;
const iteration = Number(frontmatter.iteration);
const maxIterations = Number(frontmatter.max_iterations);
const completionPromise = frontmatter.completion_promise ?? "null";
const stateSession = frontmatter.session_id ?? "";
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

const nextIteration = iteration + 1;
const updatedRaw = state.raw.replace(/^iteration: .*(\r?\n)/m, `iteration: ${nextIteration}$1`);
fs.writeFileSync(filePath, updatedRaw, "utf8");

const systemMessage =
  completionPromise !== "null" && completionPromise
    ? `do-until iteration ${nextIteration} | finish with <promise>${completionPromise}</promise> when truly done`
    : `do-until iteration ${nextIteration} | continue until task is complete`;

process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason: body,
    systemMessage,
  }),
);