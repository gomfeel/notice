interface FolderInput {
  name: string;
  description?: string;
}

interface CategorizePayload {
  url: string;
  title?: string;
  description?: string;
  folders: FolderInput[];
}

interface CategorizeResult {
  selectedFolder: string;
  confidence: number;
  reason: string;
  suggestedNewFolder: string | null;
  source?: string;
}

function pickByKeyword(input: CategorizePayload): CategorizeResult {
  const text = `${input.title ?? ""} ${input.description ?? ""} ${input.url}`.toLowerCase();

  const rules: Array<{ folder: string; keywords: string[] }> = [
    { folder: "주식", keywords: ["stock", "invest", "finance", "주식", "투자"] },
    { folder: "여행", keywords: ["travel", "trip", "hotel", "flight", "여행"] },
    { folder: "업무", keywords: ["meeting", "project", "task", "work", "업무", "회의"] },
  ];

  const names = new Set((input.folders ?? []).map((f) => f.name));
  for (const rule of rules) {
    const matched = rule.keywords.some((kw) => text.includes(kw));
    if (matched && names.has(rule.folder)) {
      return {
        selectedFolder: rule.folder,
        confidence: 0.72,
        reason: `키워드 일치: ${rule.folder}`,
        suggestedNewFolder: null,
        source: "키워드-대체",
      };
    }
  }

  return {
    selectedFolder: input.folders?.[0]?.name ?? "미분류",
    confidence: 0.3,
    reason: "일치하는 키워드가 없어 기본 폴더를 선택했습니다.",
    suggestedNewFolder: input.folders?.length ? null : "기본",
    source: "키워드-대체",
  };
}

async function categorizeWithOpenAI(input: CategorizePayload): Promise<CategorizeResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const folderList = input.folders.map((f) => f.name).join(", ");
  const prompt = [
    "아래 링크를 기존 폴더 중 하나로 분류하세요.",
    `URL: ${input.url}`,
    `제목: ${input.title ?? ""}`,
    `설명: ${input.description ?? ""}`,
    `폴더 목록: ${folderList}`,
    "반드시 JSON만 반환하세요.",
    "키: selectedFolder, confidence, reason, suggestedNewFolder",
    "confidence는 0~1 숫자여야 합니다.",
    "selectedFolder는 가능하면 폴더 목록 중 하나여야 합니다.",
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "너는 링크를 정확하게 분류하는 도우미다." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI 요청 실패: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답 내용이 비어 있습니다.");
  }

  const parsed = JSON.parse(content);
  const selectedFolder = String(parsed.selectedFolder ?? "");
  const confidence = Number(parsed.confidence ?? 0.5);
  const reason = String(parsed.reason ?? "AI 분류 결과");
  const suggestedNewFolder =
    parsed.suggestedNewFolder === null || parsed.suggestedNewFolder === undefined
      ? null
      : String(parsed.suggestedNewFolder);

  const folderNames = new Set((input.folders ?? []).map((f) => f.name));
  const normalizedFolder = folderNames.has(selectedFolder)
    ? selectedFolder
    : input.folders?.[0]?.name ?? "미분류";

  return {
    selectedFolder: normalizedFolder,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0.5,
    reason,
    suggestedNewFolder,
    source: "openai",
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("허용되지 않은 메서드입니다.", { status: 405 });
  }

  try {
    const body = (await req.json()) as CategorizePayload;

    try {
      const aiResult = await categorizeWithOpenAI(body);
      return Response.json(aiResult);
    } catch {
      const fallback = pickByKeyword(body);
      return Response.json(fallback);
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
});