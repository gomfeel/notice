import { addTaskItem, listTaskItems } from "../../../lib/tasks/store";
import {
  hasSupabaseEnv,
  insertTaskToSupabase,
  listTasksFromSupabase,
} from "../../../lib/supabase/rest";

function normalizeDateTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

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
    const startsAt = normalizeDateTime(body?.startsAt);
    const endsAt = normalizeDateTime(body?.endsAt);

    if (hasSupabaseEnv()) {
      const inserted = await insertTaskToSupabase({
        content,
        is_completed: false,
        show_on_lock_screen: showOnLockScreen,
        starts_at: startsAt,
        ends_at: endsAt,
      });
      return Response.json({ item: inserted[0] ?? inserted }, { status: 201 });
    }

    const item = addTaskItem(content, showOnLockScreen, startsAt, endsAt);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 400 }
    );
  }
}