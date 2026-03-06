import { addFolderItem, listFolderItems } from "../../../lib/folders/store";
import { logApiError, logApiInfo, resolveRequestId } from "../../../lib/observability/api-log";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestScope } from "../../../lib/security/request-context";
import { hasSupabaseEnv, insertFolderToSupabase, listFoldersFromSupabase } from "../../../lib/supabase/rest";

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
      const result = await listFoldersFromSupabase(scope);
      logApiInfo({
        endpoint: "/api/folders",
        method: "GET",
        stage: "list_folders",
        userId: scope.userId,
        requestId,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
      });
      return jsonWithRequestId({ source: "supabase", items: result.items }, requestId);
    } catch (error) {
      logApiError({
        endpoint: "/api/folders",
        method: "GET",
        userId: scope.userId,
        requestId,
        durationMs: Date.now() - startedAt,
        stage: "list_folders_supabase",
        error,
      });
      return jsonWithRequestId({ source: "memory-fallback", items: listFolderItems() }, requestId);
    }
  }

  return jsonWithRequestId({ source: "memory", items: listFolderItems() }, requestId);
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
    const { name, description } = body;

    if (hasSupabaseEnv()) {
      const required = requireUserIdForSupabase(scope.userId, scope.accessToken);
      if (!required.ok) {
        return jsonWithRequestId({ error: required.message }, requestId, 400);
      }
      try {
        const inserted = await insertFolderToSupabase(
          {
            name: String(name ?? ""),
            icon: description ? String(description) : null,
          },
          scope
        );
        return jsonWithRequestId({ source: "supabase", item: inserted[0] ?? inserted }, requestId, 201);
      } catch (error) {
        logApiError({
          endpoint: "/api/folders",
          method: "POST",
          userId: scope.userId,
          requestId,
          durationMs: Date.now() - startedAt,
          stage: "insert_folder_supabase",
          error,
        });
        const fallback = addFolderItem(String(name ?? ""), description ? String(description) : "");
        return jsonWithRequestId({ source: "memory-fallback", item: fallback }, requestId, 201);
      }
    }

    const item = addFolderItem(String(name ?? ""), description ? String(description) : "");
    logApiInfo({
      endpoint: "/api/folders",
      method: "POST",
      stage: "post_folder",
      userId: scope.userId,
      requestId,
      statusCode: 201,
      durationMs: Date.now() - startedAt,
    });
    return jsonWithRequestId({ source: "memory", item }, requestId, 201);
  } catch (error) {
    logApiError({
      endpoint: "/api/folders",
      method: "POST",
      userId: scope.userId,
      requestId,
      durationMs: Date.now() - startedAt,
      stage: "post_folder",
      error,
    });
    return jsonWithRequestId(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      requestId,
      400
    );
  }
}
