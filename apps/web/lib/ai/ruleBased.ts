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
        reason: `규칙 기반 일치: ${rule.folder}`,
        suggestedNewFolder: null,
      };
    }
  }

  return {
    selectedFolder: payload.folders[0]?.name ?? "미분류",
    confidence: 0.3,
    reason: "일치하는 키워드가 없어 기본 폴더를 선택했습니다.",
    suggestedNewFolder: payload.folders.length > 0 ? null : "기본",
  };
}