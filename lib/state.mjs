import fs from "node:fs";
import path from "node:path";

export const STATE_FILE = path.join(".grok", "do-until.local.md");

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: "" };

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body: match[2].trim() };
}

export function readState(cwd = process.cwd()) {
  const filePath = path.join(cwd, STATE_FILE);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(content);
  return { filePath, frontmatter, body, raw: content };
}

export function writeState({ frontmatter, body }, cwd = process.cwd()) {
  const dir = path.join(cwd, ".grok");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(cwd, STATE_FILE);
  const lines = Object.entries(frontmatter).map(([k, v]) => {
    if (v === "null" || v === null || v === undefined) return `${k}: null`;
    if (typeof v === "number") return `${k}: ${v}`;
    if (String(v).includes(" ") || String(v).includes(":")) return `${k}: "${v}"`;
    return `${k}: ${v}`;
  });
  const content = `---\n${lines.join("\n")}\n---\n\n${body}\n`;
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

export function removeState(cwd = process.cwd()) {
  const filePath = path.join(cwd, STATE_FILE);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function extractPromiseText(output, promise) {
  const match = output.match(/<promise>([\s\S]*?)<\/promise>/);
  if (!match) return "";
  return match[1].trim().replace(/\s+/g, " ");
}