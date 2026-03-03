import { updateTaskItemCompletion } from "../../../../lib/tasks/store";
import {
  hasSupabaseEnv,
  updateTaskCompletionInSupabase,
} from "../../../../lib/supabase/rest";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const isCompleted = Boolean(body?.isCompleted);

    if (hasSupabaseEnv()) {
      const updated = await updateTaskCompletionInSupabase(params.id, isCompleted);
      return Response.json({ item: updated[0] ?? updated });
    }

    const item = updateTaskItemCompletion(params.id, isCompleted);
    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}