import { isApiTokenEnabled } from "../../../lib/security/api-token";
import { hasSupabaseEnv } from "../../../lib/supabase/rest";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function isEnabled(value: string | undefined) {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export async function GET() {
  return Response.json({
    status: "ok",
    now: new Date().toISOString(),
    config: {
      supabaseEnabled: hasSupabaseEnv(),
      apiTokenEnabled: isApiTokenEnabled(),
      requireUserId: isEnabled(process.env.NOTICE_REQUIRE_USER_ID),
      defaultUserIdConfigured: Boolean(process.env.NOTICE_DEFAULT_USER_ID?.trim()),
    },
  });
}
