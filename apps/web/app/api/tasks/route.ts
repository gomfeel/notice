import { addTaskItem, listTaskItems } from "../../../lib/tasks/store";
import {
  hasSupabaseEnv,
  insertTaskToSupabase,
  listTasksFromSupabase,
} from "../../../lib/supabase/rest";

export async function GET() {
  if (hasSupabaseEnv()) {
    try {
      const result = await listTasksFromSupabase(50);
      return Response.json({ source: "supabase", items: result.items });
    } catch {
      return Response.json({ source: "memory-fallback", items: listTaskItems() });
    }
  }

  return Response.json({ source: "memory", items: listTaskItems() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = String(body?.content ?? "");
    const showOnLockScreen = Boolean(body?.showOnLockScreen ?? false);

    if (hasSupabaseEnv()) {
      const inserted = await insertTaskToSupabase({
        content,
        is_completed: false,
        show_on_lock_screen: showOnLockScreen,
      });
      return Response.json({ item: inserted[0] ?? inserted }, { status: 201 });
    }

    const item = addTaskItem(content, showOnLockScreen);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}