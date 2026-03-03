import { addFolderItem, listFolderItems } from "../../../lib/folders/store";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { hasSupabaseEnv, listFoldersFromSupabase } from "../../../lib/supabase/rest";

export async function GET() {
  if (hasSupabaseEnv()) {
    try {
      const result = await listFoldersFromSupabase();
      return Response.json({ source: "supabase", items: result.items });
    } catch {
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

  try {
    const body = await request.json();
    const { name, description } = body;
    const item = addFolderItem(String(name ?? ""), description ? String(description) : "");
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 400 }
    );
  }
}