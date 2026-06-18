#!/usr/bin/env node
import { readState, removeState } from "../lib/state.mjs";
import { readSpec, removeSpec } from "../lib/spec.mjs";

const local = readState();
const spec = readSpec();

if (!local && (!spec || spec.frontmatter.confirmed)) {
  console.log("No active do-until loop found.");
  process.exit(0);
}

if (local) {
  const iteration = local.frontmatter.iteration ?? "?";
  removeState();
  console.log(`do-until loop cancelled (was at iteration ${iteration}).`);
  process.exit(0);
}

// No local but we have an unconfirmed spec → cancel the planning session
if (spec && !spec.frontmatter.confirmed) {
  removeSpec();
  console.log("do-until planning session cancelled.");
  process.exit(0);
}

console.log("No active do-until loop found.");