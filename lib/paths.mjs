import path from "node:path";
import { fileURLToPath } from "node:url";

export function normalizePath(filePath) {
  if (!filePath) return filePath;
  let normalized = path.normalize(filePath);
  if (process.platform === "win32" && normalized.startsWith("\\\\?\\")) {
    normalized = normalized.slice(4);
  }
  return normalized;
}

export function pluginRoot() {
  const fromEnv = process.env.GROK_PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT;
  if (fromEnv) return normalizePath(fromEnv);
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}