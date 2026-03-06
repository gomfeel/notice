import { randomUUID } from "crypto";
import { categorizeWithEdgeFunction } from "../../../lib/ai/categorize";
import { listFolderItems } from "../../../lib/folders/store";
import { addIntakeItem, listIntakeItems } from "../../../lib/intake/store";
import { fetchMetadataFromUrl } from "../../../lib/metadata/fetchMetadata";
import { logApiError, logApiInfo, resolveRequestId } from "../../../lib/observability/api-log";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestScope } from "../../../lib/security/request-context";
import {
  hasSupabaseEnv,
  insertLinkToSupabase,
  listRecentLinksFromSupabase,
} from "../../../lib/supabase/rest";

function getDefaultFolders() {
  return listFolderItems().map((item) => ({ id: item.id, name: item.name, description: item.description }));
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function jsonWithRequestId(body: unknown, requestId: string, status = 200) {
  return Response.json(body, { status, headers: { "x-request-id": requestId } });
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request);
  const scope = resolveRequestScope(request);
  if (!scope.ok) {
    return jsonWithRequestId({ error: scope.message }, requestId, 400);
  }

  if (hasSupabaseEnv()) {
    const required = requireUserIdForSupabase(scope.userId, scope.accessToken);
    if (!required.ok) {
      return jsonWithRequestId({ error: required.message }, requestId, 400);
    }
    try {
      const recent = await listRecentLinksFromSupabase(20, scope);
      logApiInfo({
        endpoint: "/api/intake",
        method: "GET",
        stage: "list_recent_links",
        userId: scope.userId,
        requestId,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
      });
      return jsonWithRequestId({ source: "supabase", items: recent.items }, requestId);
    } catch (error) {
      logApiError({
        endpoint: "/api/intake",
        method: "GET",
        userId: scope.userId,
        requestId,
        durationMs: Date.now() - startedAt,
        stage: "list_recent_links",
        error,
      });
      return jsonWithRequestId({ source: "memory-fallback", items: listIntakeItems() }, requestId);
    }
  }

  return jsonWithRequestId({ source: "memory", items: listIntakeItems() }, requestId);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = resolveRequestId(request);
  const auth = authorizeApiRequest(request);
  if (!auth.ok) {
    return jsonWithRequestId({ error: auth.message }, requestId, 401);
  }
  const scope = resolveRequestScope(request);
  if (!scope.ok) {
    return jsonWithRequestId({ error: scope.message }, requestId, 400);
  }

  try {
    const body = await request.json();
    const incomingFolders = Array.isArray(body?.folders) ? body.folders : [];
    const folders = incomingFolders.length > 0 ? incomingFolders : getDefaultFolders();
    const url = String(body?.url ?? "").trim();
    const { title, description } = body;

    if (!url) {
      return jsonWithRequestId({ error: "URL\uC740 \uD544\uC218\uC785\uB2C8\uB2E4." }, requestId, 400);
    }
    if (!isValidHttpUrl(url)) {
      return jsonWithRequestId({ error: "\uC62C\uBC14\uB978 URL\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694. (http/https)" }, requestId, 400);
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
      const required = requireUserIdForSupabase(scope.userId, scope.accessToken);
      if (!required.ok) {
        return jsonWithRequestId({ error: required.message }, requestId, 400);
      }
    }

    const inserted = await insertLinkToSupabase({
      folder_id: selectedFolder?.id ?? null,
      original_url: url,
      title: finalTitle,
      summary: finalDescription,
      status: "unread",
    }, scope);

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

    logApiInfo({
      endpoint: "/api/intake",
      method: "POST",
      stage: "post_intake",
      userId: scope.userId,
      requestId,
      statusCode: 201,
      durationMs: Date.now() - startedAt,
    });
    return jsonWithRequestId(
      {
        metadata: { title: finalTitle, description: finalDescription },
        classification,
        inserted,
        item,
      },
      requestId,
      201
    );
  } catch (error) {
    logApiError({
      endpoint: "/api/intake",
      method: "POST",
      userId: scope.userId,
      requestId,
      durationMs: Date.now() - startedAt,
      stage: "post_intake",
      error,
    });
    return jsonWithRequestId(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      requestId,
      500
    );
  }
}
