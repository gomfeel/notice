import { addFolderItem, listFolderItems } from "../../../lib/folders/store";
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
  try {
    const body = await request.json();
    const { name, description } = body;
    const item = addFolderItem(String(name ?? ""), description ? String(description) : "");
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}