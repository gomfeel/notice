import type { CategorizePayload } from "./categorize";

const KEYWORD_RULES: Array<{ folder: string; keywords: string[] }> = [
  { folder: "주식", keywords: ["stock", "invest", "finance", "주식", "투자"] },
  { folder: "여행", keywords: ["travel", "trip", "hotel", "flight", "여행"] },
  { folder: "업무", keywords: ["meeting", "project", "task", "업무", "회의"] },
];

export function categorizeRuleBased(payload: CategorizePayload) {
  const text = `${payload.title ?? ""} ${payload.description ?? ""} ${payload.url}`.toLowerCase();
  const folderNames = new Set(payload.folders.map((f) => f.name));

  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.some((keyword) => text.includes(keyword));
    if (matched && folderNames.has(rule.folder)) {
      return {
        selectedFolder: rule.folder,
        confidence: 0.72,
        reason: `Rule-based match: ${rule.folder}`,
        suggestedNewFolder: null,
      };
    }
  }

  return {
    selectedFolder: payload.folders[0]?.name ?? "Inbox",
    confidence: 0.3,
    reason: "No keyword match; fallback selected",
    suggestedNewFolder: payload.folders.length > 0 ? null : "기본",
  };
}