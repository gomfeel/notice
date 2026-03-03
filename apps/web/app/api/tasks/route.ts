import { addTaskItem, listTaskItems } from "../../../lib/tasks/store";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestUserId } from "../../../lib/security/request-context";
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
      const result = await listTasksFromSupabase(50, user.userId);
      return Response.json({ source: "supabase", items: result.items });
    } catch {
      return Response.json({ source: "memory-fallback", items: listTaskItems() });
    }
  }

  return Response.json({ source: "memory", items: listTaskItems() });
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
    const content = String(body?.content ?? "");
    const showOnLockScreen = Boolean(body?.showOnLockScreen ?? false);
    const startsAt = normalizeDateTime(body?.startsAt);
    const endsAt = normalizeDateTime(body?.endsAt);

    if (hasSupabaseEnv()) {
      const required = requireUserIdForSupabase(user.userId);
      if (!required.ok) {
        return Response.json({ error: required.message }, { status: 400 });
      }
      const inserted = await insertTaskToSupabase({
        content,
        is_completed: false,
        show_on_lock_screen: showOnLockScreen,
        starts_at: startsAt,
        ends_at: endsAt,
      }, user.userId);
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
