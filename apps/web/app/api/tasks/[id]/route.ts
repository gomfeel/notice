import {
  getTaskItemById,
  updateTaskItemCompletion,
  updateTaskItemLockScreen,
} from "../../../../lib/tasks/store";
import { logApiError } from "../../../../lib/observability/api-log";
import { authorizeApiRequest } from "../../../../lib/security/api-token";
import { requireUserIdForSupabase, resolveRequestScope } from "../../../../lib/security/request-context";
import {
  hasSupabaseEnv,
  updateTaskFieldsInSupabase,
} from "../../../../lib/supabase/rest";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = authorizeApiRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: 401 });
  }
  const scope = resolveRequestScope(request);
  if (!scope.ok) {
    return Response.json({ error: scope.message }, { status: 400 });
  }

  try {
    const body = await request.json();
    const hasIsCompleted = body?.isCompleted !== undefined;
    const hasShowOnLockScreen = body?.showOnLockScreen !== undefined;

    if (!hasIsCompleted && !hasShowOnLockScreen) {
      return Response.json(
        { error: "\uC218\uC815\uD560 \uD544\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." },
        { status: 400 }
      );
    }

    const isCompleted = hasIsCompleted ? Boolean(body?.isCompleted) : undefined;
    const showOnLockScreen = hasShowOnLockScreen ? Boolean(body?.showOnLockScreen) : undefined;

    if (hasSupabaseEnv()) {
      const required = requireUserIdForSupabase(scope.userId, scope.accessToken);
      if (!required.ok) {
        return Response.json({ error: required.message }, { status: 400 });
      }
      const updated = await updateTaskFieldsInSupabase(params.id, {
        ...(hasIsCompleted ? { is_completed: isCompleted } : {}),
        ...(hasShowOnLockScreen ? { show_on_lock_screen: showOnLockScreen } : {}),
      }, scope);
      return Response.json({ item: updated[0] ?? updated });
    }

    if (hasIsCompleted) {
      updateTaskItemCompletion(params.id, isCompleted as boolean);
    }
    if (hasShowOnLockScreen) {
      updateTaskItemLockScreen(params.id, showOnLockScreen as boolean);
    }

    const item = getTaskItemById(params.id);
    if (!item) {
      return Response.json(
        { error: "\uD574\uB2F9 \uD560 \uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." },
        { status: 404 }
      );
    }

    return Response.json({ item });
  } catch (error) {
    logApiError({
      endpoint: "/api/tasks/[id]",
      method: "PATCH",
      userId: scope.userId,
      stage: "patch_task",
      error,
    });
    return Response.json(
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 400 }
    );
  }
}
