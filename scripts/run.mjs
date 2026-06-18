#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pluginRoot } from "../lib/paths.mjs";

const TARGETS = {
  stop: ["hooks", "stop-hook.mjs"],
  setup: ["scripts", "setup-loop.mjs"],
  cancel: ["scripts", "cancel-loop.mjs"],
  plan: ["scripts", "plan.mjs"],
};

const command = process.argv[2];
const segments = TARGETS[command];

if (!segments) {
  console.error(`do-until: unknown command "${command ?? ""}". Expected: stop, setup, cancel, plan`);
  process.exit(1);
}

const scriptPath = path.join(pluginRoot(), ...segments);
if (!fs.existsSync(scriptPath)) {
  console.error(`do-until: script not found: ${scriptPath}`);
  process.exit(1);
}

const args = [scriptPath, ...process.argv.slice(3)];
const result = spawnSync(process.execPath, args, {
  stdio: "inherit",
  env: process.env,
  windowsHide: true,
});

process.exit(result.status ?? 1);