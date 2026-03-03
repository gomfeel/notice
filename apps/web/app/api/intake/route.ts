import { randomUUID } from "crypto";
import { categorizeWithEdgeFunction } from "../../../lib/ai/categorize";
import { listFolderItems } from "../../../lib/folders/store";
import { addIntakeItem, listIntakeItems } from "../../../lib/intake/store";
import { fetchMetadataFromUrl } from "../../../lib/metadata/fetchMetadata";
import { logApiError } from "../../../lib/observability/api-log";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestUserId } from "../../../lib/security/request-context";
import {
  hasSupabaseEnv,
  insertLinkToSupabase,
  listRecentLinksFromSupabase,
} from "../../../lib/supabase/rest";

function getDefaultFolders() {
  return listFolderItems().map((item) => ({ id: item.id, name: item.name, description: item.description }));
}

export async function GET(request: Request) {
  const user = resolveRequestUserId(request);
  if (!user.ok) {
    return Response.json({ error: user.message }, { status: 400 });
  }

  if (hasSupabaseEnv()) {
    const required = requireUserIdForSupabase(user.userId);
    if (!required.ok) {
      return Response.json({ error: required.message }, { status: 400 });
    }
    try {
      const recent = await listRecentLinksFromSupabase(20, user.userId);
      return Response.json({ source: "supabase", items: recent.items });
    } catch (error) {
      logApiError({
        endpoint: "/api/intake",
        method: "GET",
        userId: user.userId,
        stage: "list_recent_links",
        error,
      });
      return Response.json({ source: "memory-fallback", items: listIntakeItems() });
    }
  }

  return Response.json({ source: "memory", items: listIntakeItems() });
}

export async function POST(request: Request) {
  const auth = authorizeApiRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: 401 });
  }
  const user = resolveRequestUserId(request);
  if (!user.ok) {
    return Response.json({ error: user.message }, { status: 400 });
  }

  try {
    const body = await request.json();
    const incomingFolders = Array.isArray(body?.folders) ? body.folders : [];
    const folders = incomingFolders.length > 0 ? incomingFolders : getDefaultFolders();
    const { url, title, description } = body;

    if (!url) {
      return Response.json({ error: "URL\uC740 \uD544\uC218\uC785\uB2C8\uB2E4." }, { status: 400 });
    }

    const metadata = await fetchMetadataFromUrl(url);
    const finalTitle = title || metadata.title || "\uC81C\uBAA9 \uC5C6\uC74C";
    const finalDescription = description || metadata.description || "";

    const classification = await categorizeWithEdgeFunction({
      url,
      title: finalTitle,
      description: finalDescription,
      folders,
    });

    const selectedFolderName = classification.selectedFolder as string | undefined;
    const selectedFolder = folders.find((folder: { id?: string; name: string }) => folder.name === selectedFolderName);

    if (hasSupabaseEnv()) {
      const required = requireUserIdForSupabase(user.userId);
      if (!required.ok) {
        return Response.json({ error: required.message }, { status: 400 });
      }
    }

    const inserted = await insertLinkToSupabase({
      folder_id: selectedFolder?.id ?? null,
      original_url: url,
      title: finalTitle,
      summary: finalDescription,
      status: "unread",
    }, user.userId);

    const item = {
      id: randomUUID(),
      url,
      title: finalTitle,
      description: finalDescription,
      selectedFolder: selectedFolderName ?? "\uBBF8\uBD84\uB958",
      confidence: Number(classification.confidence ?? 0),
      status: "unread" as const,
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
    logApiError({
      endpoint: "/api/intake",
      method: "POST",
      userId: user.userId,
      stage: "post_intake",
      error,
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 500 }
    );
  }
}
