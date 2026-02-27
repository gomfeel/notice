import { randomUUID } from "crypto";
import { categorizeWithEdgeFunction } from "../../../lib/ai/categorize";
import { addIntakeItem, listIntakeItems } from "../../../lib/intake/store";
import { fetchMetadataFromUrl } from "../../../lib/metadata/fetchMetadata";
import {
  hasSupabaseEnv,
  insertLinkToSupabase,
  listRecentLinksFromSupabase,
} from "../../../lib/supabase/rest";

const defaultFolders = [{ name: "stock" }, { name: "travel" }, { name: "work" }];

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
    const { url, title, description, folders = defaultFolders } = body;

    if (!url) {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    const metadata = await fetchMetadataFromUrl(url);
    const finalTitle = title || metadata.title || "Untitled";
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
      selectedFolder: selectedFolderName ?? "inbox",
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
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}