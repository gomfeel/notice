import { updateIntakeStatus } from "../../../../lib/intake/store";
import {
  hasSupabaseEnv,
  updateLinkStatusInSupabase,
} from "../../../../lib/supabase/rest";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const status = body?.status === "read" ? "read" : "unread";

    if (hasSupabaseEnv()) {
      const updated = await updateLinkStatusInSupabase(params.id, status);
      return Response.json({ item: updated[0] ?? updated });
    }

    const item = updateIntakeStatus(params.id, status);
    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다." },
      { status: 400 }
    );
  }
}