import { addTaskItem, listTaskItems } from "../../../lib/tasks/store";
import { logApiError } from "../../../lib/observability/api-log";
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

function isInvalidTimeRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt || !endsAt) return false;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return true;
  return end < start;
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
    } catch (error) {
      logApiError({
        endpoint: "/api/tasks",
        method: "GET",
        userId: user.userId,
        stage: "list_tasks_supabase",
        error,
      });
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

    if (isInvalidTimeRange(startsAt, endsAt)) {
      return Response.json(
        { error: "\uC2DC\uC791/\uC885\uB8CC \uC2DC\uAC04\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694. \uC885\uB8CC\uB294 \uC2DC\uC791 \uC774\uD6C4\uC5EC\uC57C \uD569\uB2C8\uB2E4." },
        { status: 400 }
      );
    }

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
    logApiError({
      endpoint: "/api/tasks",
      method: "POST",
      userId: user.userId,
      stage: "post_task",
      error,
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 400 }
    );
  }
}
