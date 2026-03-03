import { addFolderItem, listFolderItems } from "../../../lib/folders/store";
import { logApiError } from "../../../lib/observability/api-log";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestUserId } from "../../../lib/security/request-context";
import { hasSupabaseEnv, insertFolderToSupabase, listFoldersFromSupabase } from "../../../lib/supabase/rest";

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
      const result = await listFoldersFromSupabase(user.userId);
      return Response.json({ source: "supabase", items: result.items });
    } catch (error) {
      logApiError({
        endpoint: "/api/folders",
        method: "GET",
        userId: user.userId,
        stage: "list_folders_supabase",
        error,
      });
      return Response.json({ source: "memory-fallback", items: listFolderItems() });
    }
  }

  return Response.json({ source: "memory", items: listFolderItems() });
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
    const { name, description } = body;

    if (hasSupabaseEnv()) {
      const required = requireUserIdForSupabase(user.userId);
      if (!required.ok) {
        return Response.json({ error: required.message }, { status: 400 });
      }
      try {
        const inserted = await insertFolderToSupabase(
          {
            name: String(name ?? ""),
            icon: description ? String(description) : null,
          },
          user.userId
        );
        return Response.json({ source: "supabase", item: inserted[0] ?? inserted }, { status: 201 });
      } catch (error) {
        logApiError({
          endpoint: "/api/folders",
          method: "POST",
          userId: user.userId,
          stage: "insert_folder_supabase",
          error,
        });
        const fallback = addFolderItem(String(name ?? ""), description ? String(description) : "");
        return Response.json({ source: "memory-fallback", item: fallback }, { status: 201 });
      }
    }

    const item = addFolderItem(String(name ?? ""), description ? String(description) : "");
    return Response.json({ source: "memory", item }, { status: 201 });
  } catch (error) {
    logApiError({
      endpoint: "/api/folders",
      method: "POST",
      userId: user.userId,
      stage: "post_folder",
      error,
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 400 }
    );
  }
}
