import { updateIntakeStatus } from "../../../../lib/intake/store";
import { authorizeApiRequest } from "../../../../lib/security/api-token";
import {
  hasSupabaseEnv,
  updateLinkStatusInSupabase,
} from "../../../../lib/supabase/rest";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = authorizeApiRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: 401 });
  }

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
      { error: error instanceof Error ? error.message : "\uC54C \uC218 \uC5C6\uB294 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." },
      { status: 400 }
    );
  }
}