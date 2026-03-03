const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

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

  if (isEnabled(process.env.NOTICE_REQUIRE_USER_ID) && !userId) {
    return {
      ok: false as const,
      userId: null,
      message: "\uC0AC\uC6A9\uC790 ID\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. x-notice-user-id \uD5E4\uB354\uB97C \uC804\uB2EC\uD558\uC138\uC694.",
    };
  }

  return { ok: true as const, userId };
}
