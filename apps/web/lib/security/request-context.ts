const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const UUID_V4_OR_V1 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isEnabled(value: string | undefined) {
  if (!value) return false;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function resolveRequestUserId(request: Request) {
  const fromHeader =
    request.headers.get("x-notice-user-id")?.trim() ||
    request.headers.get("x-user-id")?.trim() ||
    "";
  const defaultUserId = process.env.NOTICE_DEFAULT_USER_ID?.trim() || "";
  const userId = fromHeader || defaultUserId || null;

  if (userId && !UUID_V4_OR_V1.test(userId)) {
    return {
      ok: false as const,
      userId: null,
      message: "사용자 ID 형식이 올바르지 않습니다. UUID를 사용해 주세요.",
    };
  }

  if (isEnabled(process.env.NOTICE_REQUIRE_USER_ID) && !userId) {
    return {
      ok: false as const,
      userId: null,
      message: "\uC0AC\uC6A9\uC790 ID\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. x-notice-user-id \uD5E4\uB354\uB97C \uC804\uB2EC\uD558\uC138\uC694.",
    };
  }

  return { ok: true as const, userId };
}

export function resolveSupabaseAccessToken(request: Request) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1]?.trim();
  return token ? token : null;
}

function decodeJwtSub(accessToken: string | null) {
  if (!accessToken) return null;
  const parts = accessToken.split(".");
  if (parts.length < 2) return null;

  try {
    const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { sub?: unknown };
    const sub = typeof payload?.sub === "string" ? payload.sub.trim() : "";
    if (!sub || !UUID_V4_OR_V1.test(sub)) return null;
    return sub;
  } catch {
    return null;
  }
}

export function resolveRequestScope(request: Request) {
  const user = resolveRequestUserId(request);
  if (!user.ok) return user;

  const accessToken = resolveSupabaseAccessToken(request);
  const tokenUserId = decodeJwtSub(accessToken);
  return {
    ok: true as const,
    userId: user.userId ?? tokenUserId,
    accessToken,
  };
}

export function requireUserIdForSupabase(userId: string | null | undefined, accessToken?: string | null) {
  if (!userId && !accessToken) {
    return {
      ok: false as const,
      message:
        "\uC0AC\uC6A9\uC790 ID \uB610\uB294 Supabase Access Token\uC774 \uD544\uC694\uD569\uB2C8\uB2E4. x-notice-user-id \uD5E4\uB354 \uB610\uB294 Authorization: Bearer <token>\uC744 \uC124\uC815\uD558\uC138\uC694.",
    };
  }
  return { ok: true as const };
}
