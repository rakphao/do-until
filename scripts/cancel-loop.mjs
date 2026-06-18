#!/usr/bin/env node
import { readState, removeState } from "../lib/state.mjs";

const state = readState();

if (!state) {
  console.log("No active do-until loop found.");
  process.exit(0);
}

const iteration = state.frontmatter.iteration ?? "?";
removeState();

console.log(`do-until loop cancelled (was at iteration ${iteration}).`);