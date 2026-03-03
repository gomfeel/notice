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

export function requireUserIdForSupabase(userId: string | null | undefined) {
  if (!userId) {
    return {
      ok: false as const,
      message:
        "\uC0AC\uC6A9\uC790 ID\uAC00 \uD544\uC218\uC785\uB2C8\uB2E4. x-notice-user-id \uD5E4\uB354\uB97C \uC124\uC815\uD558\uC138\uC694.",
    };
  }
  return { ok: true as const };
}
