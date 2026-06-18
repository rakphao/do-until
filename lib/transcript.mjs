import fs from "node:fs";

export function lastAssistantText(transcriptPath) {
  if (!transcriptPath || !fs.existsSync(transcriptPath)) return "";

  const lines = fs.readFileSync(transcriptPath, "utf8").split("\n").filter(Boolean);
  const assistantTexts = [];

  for (const line of lines) {
    if (!line.includes('"type":"assistant"') && !line.includes('"role":"assistant"')) {
      continue;
    }

    try {
      const row = JSON.parse(line);
      if (row.type === "assistant") {
        if (typeof row.content === "string") {
          assistantTexts.push(row.content);
        } else if (Array.isArray(row.content)) {
          const text = row.content
            .filter((part) => part?.type === "text")
            .map((part) => part.text)
            .join("\n");
          if (text) assistantTexts.push(text);
        }
      } else if (row.role === "assistant" && Array.isArray(row.message?.content)) {
        const text = row.message.content
          .filter((part) => part?.type === "text")
          .map((part) => part.text)
          .join("\n");
        if (text) assistantTexts.push(text);
      }
    } catch {
      // skip malformed jsonl lines
    }
  }

  if (assistantTexts.length === 0) return null;
  return assistantTexts.at(-1) ?? "";
}