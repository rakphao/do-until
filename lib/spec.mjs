import fs from "node:fs";
import path from "node:path";
import { parseFrontmatter } from "./state.mjs";

export const SPEC_FILE = path.join(".grok", "do-until.spec.md");

function ensureDir(cwd) {
  const dir = path.join(cwd, ".grok");
  fs.mkdirSync(dir, { recursive: true });
}

export function readSpec(cwd = process.cwd()) {
  const filePath = path.join(cwd, SPEC_FILE);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(content);
  const deliverables = parseDeliverablesSection(content);
  // Normalize a few known fields
  if (frontmatter.max_iterations !== undefined) {
    const n = Number(frontmatter.max_iterations);
    frontmatter.max_iterations = Number.isFinite(n) ? n : 0;
  }
  if (frontmatter.confirmed !== undefined) {
    const c = String(frontmatter.confirmed).toLowerCase();
    frontmatter.confirmed = c === "true" || c === "1";
  } else {
    frontmatter.confirmed = false;
  }
  return { filePath, frontmatter, body, deliverables, raw: content };
}

export function parseDeliverablesSection(content) {
  // Look for ## Deliverables section until next ## or end
  const match = content.match(/##\s*Deliverables\s*([\s\S]*?)(?=\n##\s|\n#+\s|$)/i);
  if (!match) return [];
  const section = match[1];
  const items = [];
  for (const line of section.split("\n")) {
    const m = line.match(/^\s*-\s*\[\s*([ xX-])?\s*\]\s*(?:(\d+)[\.\)]?\s*)?(.*\S)/);
    if (m && m[3]) {
      const checked = m[1] && /[xX]/.test(m[1]);
      const id = m[2] ? parseInt(m[2], 10) : items.length + 1;
      items.push({
        id,
        title: m[3].trim(),
        status: checked ? "done" : "pending",
      });
    }
  }
  return items;
}

function formatDeliverables(deliverables) {
  if (!deliverables || deliverables.length === 0) return "";
  return deliverables
    .map((d, i) => {
      const mark = d.status === "done" ? "x" : " ";
      return `- [${mark}] ${i + 1}. ${d.title}`;
    })
    .join("\n");
}

function buildFrontmatterLines(frontmatter) {
  return Object.entries(frontmatter).map(([k, v]) => {
    if (v === "null" || v === null || v === undefined || v === "") return `${k}: null`;
    if (typeof v === "number") return `${k}: ${v}`;
    if (typeof v === "boolean") return `${k}: ${v}`;
    const s = String(v);
    if (s.includes(" ") || s.includes(":")) return `${k}: "${s}"`;
    return `${k}: ${s}`;
  });
}

export function writeSpec({ frontmatter, deliverables = [], constraints = "" }, cwd = process.cwd()) {
  ensureDir(cwd);
  const filePath = path.join(cwd, SPEC_FILE);

  const lines = buildFrontmatterLines(frontmatter);
  let content = `---\n${lines.join("\n")}\n---\n\n`;

  const delSection = formatDeliverables(deliverables);
  if (delSection) {
    content += `## Deliverables\n${delSection}\n\n`;
  }

  if (constraints && constraints.trim()) {
    content += `## Constraints\n${constraints.trim()}\n\n`;
  }

  // Preserve or append any extra body notes if present in future
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

export function updateSpec(updates, cwd = process.cwd()) {
  // updates: { frontmatterPatch?: {}, deliverables?: array, constraints?: string }
  const existing = readSpec(cwd) || { frontmatter: {}, deliverables: [], body: "" };
  const fm = { ...existing.frontmatter, ...(updates.frontmatterPatch || {}) };

  // Special: if max_iterations provided as string, coerce
  if (fm.max_iterations !== undefined) {
    const n = Number(fm.max_iterations);
    fm.max_iterations = Number.isFinite(n) ? n : 0;
  }
  if (fm.confirmed !== undefined) {
    fm.confirmed = !!fm.confirmed;
  }

  const dels = updates.deliverables !== undefined ? updates.deliverables : existing.deliverables;
  const cons = updates.constraints !== undefined ? updates.constraints : (existing.frontmatter.constraints || "");

  // Also carry over constraints if it was top level before
  if (!updates.constraints && existing.frontmatter.constraints) {
    // already in fm via patch or leave
  }

  return writeSpec({ frontmatter: fm, deliverables: dels, constraints: cons }, cwd);
}

export function addDeliverable(title, cwd = process.cwd()) {
  if (!title || !title.trim()) return null;
  const existing = readSpec(cwd);
  const dels = existing ? [...existing.deliverables] : [];
  // avoid exact dups
  if (!dels.some((d) => d.title.toLowerCase() === title.trim().toLowerCase())) {
    dels.push({ title: title.trim(), status: "pending" });
  }
  const fm = existing ? existing.frontmatter : {};
  return writeSpec({ frontmatter: fm, deliverables: dels }, cwd);
}

export function setConfirmed(value, cwd = process.cwd()) {
  const existing = readSpec(cwd);
  const fm = existing ? { ...existing.frontmatter, confirmed: !!value } : { confirmed: !!value };
  return writeSpec({ frontmatter: fm, deliverables: existing ? existing.deliverables : [] }, cwd);
}

export function isComplete(spec) {
  if (!spec) return false;
  const obj = spec.frontmatter?.objective;
  const hasObj = obj && String(obj).trim() && String(obj) !== "null";
  const hasDels = (spec.deliverables || []).length > 0;
  return hasObj && hasDels;
}

export function getPendingDeliverables(spec) {
  if (!spec || !Array.isArray(spec.deliverables)) return [];
  return spec.deliverables
    .map((d, i) => ({ id: d.id || i + 1, index: i, title: d.title, status: d.status }))
    .filter((d) => d.status !== "done");
}

export function getCurrentDeliverable(spec) {
  const pending = getPendingDeliverables(spec);
  return pending.length > 0 ? pending[0] : null;
}

export function markDeliverableDone(index, cwd = process.cwd()) {
  const existing = readSpec(cwd);
  if (!existing || !existing.deliverables || index < 0 || index >= existing.deliverables.length) {
    return false;
  }
  const dels = existing.deliverables.map((d, i) =>
    i === index ? { ...d, status: "done" } : d
  );
  const fm = { ...existing.frontmatter };
  const cons = existing.frontmatter.constraints || "";
  writeSpec({ frontmatter: fm, deliverables: dels, constraints: cons }, cwd);
  return true;
}

export function areAllDeliverablesDone(spec) {
  const pending = getPendingDeliverables(spec);
  return pending.length === 0 && (spec.deliverables || []).length > 0;
}

export function formatForDisplay(spec) {
  if (!spec) return "No spec found.";
  const fm = spec.frontmatter || {};
  const norm = (v) => (v && v !== "null" ? v : "(none)");
  const lines = [
    `objective: ${norm(fm.objective)}`,
    `verify_command: ${norm(fm.verify_command)}`,
    `completion_promise: ${norm(fm.completion_promise)}`,
    `max_iterations: ${fm.max_iterations ?? 0}`,
    `confirmed: ${!!fm.confirmed}`,
  ];
  if (fm.constraints && fm.constraints !== "null") {
    lines.push(`constraints: ${fm.constraints}`);
  }
  if (spec.deliverables && spec.deliverables.length) {
    lines.push("deliverables:");
    for (const d of spec.deliverables) {
      const num = d.id || '';
      lines.push(`  - [${d.status === "done" ? "x" : " "}] ${num ? num + '. ' : ''}${d.title}`);
    }
  }
  return lines.join("\n");
}

export function removeSpec(cwd = process.cwd()) {
  const filePath = path.join(cwd, SPEC_FILE);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}
