#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_NAME = "do-until";
const REMOTE_SOURCE = "https://github.com/rakphao/do-until";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_SOURCE = path.resolve(__dirname, "..");

function commandExists(name) {
  const check = process.platform === "win32" ? "where.exe" : "which";
  const result = spawnSync(check, [name], { encoding: "utf8", windowsHide: true });
  return result.status === 0;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    encoding: "utf8",
    windowsHide: true,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function enablePluginInConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      `[plugins]\nenabled = ["${PLUGIN_NAME}"]\n`,
      "utf8",
    );
    return;
  }

  const content = fs.readFileSync(configPath, "utf8");
  if (content.includes(`"${PLUGIN_NAME}"`) || content.includes(`'${PLUGIN_NAME}'`)) {
    return;
  }

  if (content.includes("[plugins]")) {
    if (/enabled\s*=\s*\[/.test(content)) {
      const updated = content.replace(
        /(enabled\s*=\s*\[[^\]]*)(])/,
        `$1, "${PLUGIN_NAME}"$2`,
      );
      fs.writeFileSync(configPath, updated, "utf8");
      return;
    }

    const updated = content.replace(
      /\[plugins\]\r?\n/,
      `[plugins]\nenabled = ["${PLUGIN_NAME}"]\n`,
    );
    fs.writeFileSync(configPath, updated, "utf8");
    return;
  }

  fs.appendFileSync(configPath, `\n[plugins]\nenabled = ["${PLUGIN_NAME}"]\n`, "utf8");
}

function main() {
  const useLocal = process.argv.includes("--local");
  const source = useLocal ? LOCAL_SOURCE : REMOTE_SOURCE;

  console.log(`do-until setup\n`);

  if (!commandExists("grok")) {
    console.error(`Error: grok CLI not found.

Install Grok Build TUI:
  macOS/Linux: curl -fsSL https://x.ai/cli/install.sh | bash
  Windows:     see https://x.ai/cli

Then run:
  npx github:rakphao/do-until`);
    process.exit(1);
  }

  if (!commandExists("node")) {
    console.error("Error: Node.js 18+ is required.");
    process.exit(1);
  }

  console.log(`Installing plugin from ${source} ...`);
  run("grok", ["plugin", "install", source, "--trust"]);

  const configPath = path.join(os.homedir(), ".grok", "config.toml");
  enablePluginInConfig(configPath);

  console.log(`
Done.

1. Restart Grok or run /plugins → reload
2. Verify: grok plugin list
3. Start a loop: /do-until "your task" --max-iterations 20

Cancel anytime: /cancel-do-until`);
}

main();