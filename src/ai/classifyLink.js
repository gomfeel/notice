const KEYWORD_RULES = [
  { folder: "주식", keywords: ["stock", "invest", "finance", "주식", "투자"] },
  { folder: "여행", keywords: ["travel", "trip", "hotel", "flight", "여행"] },
  { folder: "업무", keywords: ["meeting", "project", "task", "업무", "회의"] },
];

export function buildClassificationInput({ url, title, description, folders }) {
  return {
    url,
    title: title ?? "",
    description: description ?? "",
    folders: folders ?? [],
  };
}

function normalize(text) {
  return (text ?? "").toLowerCase();
}

export function recommendFolder(input) {
  const blob = normalize(`${input.title} ${input.description} ${input.url}`);
  const existingFolderNames = new Set((input.folders ?? []).map((f) => f.name));

  for (const rule of KEYWORD_RULES) {
    const hasMatch = rule.keywords.some((kw) => blob.includes(kw));
    if (hasMatch && existingFolderNames.has(rule.folder)) {
      return {
        selectedFolder: rule.folder,
        confidence: 0.72,
        reason: `키워드 기반 분류: ${rule.folder}`,
        suggestedNewFolder: null,
      };
    }
  }

  return {
    selectedFolder: input.folders?.[0]?.name ?? "Inbox",
    confidence: 0.3,
    reason: "규칙 기반 일치 폴더가 없어 기본 폴더를 선택",
    suggestedNewFolder: input.folders?.length ? null : "기본",
  };
}
