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
    { folder: "stock", keywords: ["stock", "invest", "finance"] },
    { folder: "travel", keywords: ["travel", "trip", "hotel", "flight"] },
    { folder: "work", keywords: ["meeting", "project", "task", "work"] },
  ];

  const names = new Set((input.folders ?? []).map((f) => f.name));
  for (const rule of rules) {
    const matched = rule.keywords.some((kw) => text.includes(kw));
    if (matched && names.has(rule.folder)) {
      return {
        selectedFolder: rule.folder,
        confidence: 0.72,
        reason: `Keyword matched: ${rule.folder}`,
        suggestedNewFolder: null,
        source: "keyword-fallback",
      };
    }
  }

  return {
    selectedFolder: input.folders?.[0]?.name ?? "inbox",
    confidence: 0.3,
    reason: "No keyword match; fallback folder used",
    suggestedNewFolder: input.folders?.length ? null : "default",
    source: "keyword-fallback",
  };
}

async function categorizeWithOpenAI(input: CategorizePayload): Promise<CategorizeResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const folderList = input.folders.map((f) => f.name).join(", ");
  const prompt = [
    "Classify this link into one of existing folders.",
    `URL: ${input.url}`,
    `Title: ${input.title ?? ""}`,
    `Description: ${input.description ?? ""}`,
    `Folders: ${folderList}`,
    "Return only JSON with keys: selectedFolder, confidence, reason, suggestedNewFolder",
    "confidence must be a number between 0 and 1.",
    "selectedFolder must be one of Folders unless no folder fits.",
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
        { role: "system", content: "You are a precise link classifier." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI response content is empty");
  }

  const parsed = JSON.parse(content);
  const selectedFolder = String(parsed.selectedFolder ?? "");
  const confidence = Number(parsed.confidence ?? 0.5);
  const reason = String(parsed.reason ?? "AI classification");
  const suggestedNewFolder =
    parsed.suggestedNewFolder === null || parsed.suggestedNewFolder === undefined
      ? null
      : String(parsed.suggestedNewFolder);

  const folderNames = new Set((input.folders ?? []).map((f) => f.name));
  const normalizedFolder = folderNames.has(selectedFolder)
    ? selectedFolder
    : input.folders?.[0]?.name ?? "inbox";

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
    return new Response("Method Not Allowed", { status: 405 });
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
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
});