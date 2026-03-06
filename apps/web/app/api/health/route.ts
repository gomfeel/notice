import { isApiTokenEnabled } from "../../../lib/security/api-token";
import { resolveRequestId } from "../../../lib/observability/api-log";
import { hasSupabaseEnv } from "../../../lib/supabase/rest";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isEnabled(value: string | undefined) {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export async function GET(request: Request) {
  const requestId = resolveRequestId(request);
  return Response.json({
    status: "ok",
    requestId,
    now: new Date().toISOString(),
    config: {
      supabaseEnabled: hasSupabaseEnv(),
      apiTokenEnabled: isApiTokenEnabled(),
      requireUserId: isEnabled(process.env.NOTICE_REQUIRE_USER_ID),
      defaultUserIdConfigured: Boolean(process.env.NOTICE_DEFAULT_USER_ID?.trim()),
    },
  }, { headers: { "x-request-id": requestId } });
}
