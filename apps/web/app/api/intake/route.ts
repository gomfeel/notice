import { randomUUID } from "crypto";
import { categorizeWithEdgeFunction } from "../../../lib/ai/categorize";
import { listFolderItems } from "../../../lib/folders/store";
import { addIntakeItem, listIntakeItems } from "../../../lib/intake/store";
import { fetchMetadataFromUrl } from "../../../lib/metadata/fetchMetadata";
import {
  hasSupabaseEnv,
  insertLinkToSupabase,
  listRecentLinksFromSupabase,
} from "../../../lib/supabase/rest";

function getDefaultFolders() {
  return listFolderItems().map((item) => ({ id: item.id, name: item.name, description: item.description }));
}

export async function GET() {
  if (hasSupabaseEnv()) {
    const recent = await listRecentLinksFromSupabase(20);
    return Response.json({ source: "supabase", items: recent.items });
  }

  return Response.json({ source: "memory", items: listIntakeItems() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const incomingFolders = Array.isArray(body?.folders) ? body.folders : [];
    const folders = incomingFolders.length > 0 ? incomingFolders : getDefaultFolders();
    const { url, title, description } = body;

    if (!url) {
      return Response.json({ error: "URL은 필수입니다." }, { status: 400 });
    }

    const metadata = await fetchMetadataFromUrl(url);
    const finalTitle = title || metadata.title || "제목 없음";
    const finalDescription = description || metadata.description || "";

    const classification = await categorizeWithEdgeFunction({
      url,
      title: finalTitle,
      description: finalDescription,
      folders,
    });

    const selectedFolderName = classification.selectedFolder as string | undefined;
    const selectedFolder = folders.find((folder: { id?: string; name: string }) => folder.name === selectedFolderName);

    const inserted = await insertLinkToSupabase({
      folder_id: selectedFolder?.id ?? null,
      original_url: url,
      title: finalTitle,
      summary: finalDescription,
      status: "unread",
    });

    const item = {
      id: randomUUID(),
      url,
      title: finalTitle,
      description: finalDescription,
      selectedFolder: selectedFolderName ?? "미분류",
      confidence: Number(classification.confidence ?? 0),
      createdAt: new Date().toISOString(),
    };

    if ((inserted as any)?.skipped) {
      addIntakeItem(item);
    }

    return Response.json(
      {
        metadata: { title: finalTitle, description: finalDescription },
        classification,
        inserted,
        item,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}