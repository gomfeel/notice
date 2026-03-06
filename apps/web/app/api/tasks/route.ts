import { addTaskItem, listTaskItems } from "../../../lib/tasks/store";
import { logApiError, logApiInfo, resolveRequestId } from "../../../lib/observability/api-log";
import { authorizeApiRequest } from "../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestScope } from "../../../lib/security/request-context";
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
      const result = await listTasksFromSupabase(50, scope);
      logApiInfo({
        endpoint: "/api/tasks",
        method: "GET",
        stage: "list_tasks",
        userId: scope.userId,
        requestId,
        statusCode: 200,
        durationMs: Date.now() - startedAt,
      });
      return jsonWithRequestId({ source: "supabase", items: result.items }, requestId);
    } catch (error) {
      logApiError({
        endpoint: "/api/tasks",
        method: "GET",
        userId: scope.userId,
        requestId,
        durationMs: Date.now() - startedAt,
        stage: "list_tasks_supabase",
        error,
      });
      return jsonWithRequestId({ source: "memory-fallback", items: listTaskItems() }, requestId);
    }
  }

  return jsonWithRequestId({ source: "memory", items: listTaskItems() }, requestId);
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
    const content = String(body?.content ?? "");
    const showOnLockScreen = Boolean(body?.showOnLockScreen ?? false);
    const startsAt = normalizeDateTime(body?.startsAt);
    const endsAt = normalizeDateTime(body?.endsAt);

    if (isInvalidTimeRange(startsAt, endsAt)) {
      return jsonWithRequestId(
        { error: "\uC2DC\uC791/\uC885\uB8CC \uC2DC\uAC04\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694. \uC885\uB8CC\uB294 \uC2DC\uC791 \uC774\uD6C4\uC5EC\uC57C \uD569\uB2C8\uB2E4." },
        requestId,
        400
      );
    }

    if (hasSupabaseEnv()) {
      const required = requireUserIdForSupabase(scope.userId, scope.accessToken);
      if (!required.ok) {
        return jsonWithRequestId({ error: required.message }, requestId, 400);
      }
      const inserted = await insertTaskToSupabase({
        content,
        is_completed: false,
        show_on_lock_screen: showOnLockScreen,
        starts_at: startsAt,
        ends_at: endsAt,
      }, scope);
      return jsonWithRequestId({ item: inserted[0] ?? inserted }, requestId, 201);
    }

    const item = addTaskItem(content, showOnLockScreen, startsAt, endsAt);
    logApiInfo({
      endpoint: "/api/tasks",
      method: "POST",
      stage: "post_task",
      userId: scope.userId,
      requestId,
      statusCode: 201,
      durationMs: Date.now() - startedAt,
    });
    return jsonWithRequestId({ item }, requestId, 201);
  } catch (error) {
    logApiError({
      endpoint: "/api/tasks",
      method: "POST",
      userId: scope.userId,
      requestId,
      durationMs: Date.now() - startedAt,
      stage: "post_task",
      error,
    });
    return jsonWithRequestId(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      requestId,
      400
    );
  }
}
