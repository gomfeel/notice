export function isApiTokenEnabled() {
  return Boolean(process.env.NOTICE_API_TOKEN && process.env.NOTICE_API_TOKEN.trim());
}

function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

export function authorizeApiRequest(request: Request) {
  const configuredToken = process.env.NOTICE_API_TOKEN?.trim();
  if (!configuredToken) {
    return { ok: true };
  }

  const requestToken = request.headers.get("x-notice-api-token")?.trim();
  if (requestToken && requestToken === configuredToken) {
    return { ok: true };
  }

  if (isSameOriginRequest(request)) {
    return { ok: true };
  }

  return {
    ok: false,
    message: "\uC778\uC99D\uB41C API \uC694\uCCAD\uC774 \uC544\uB2D9\uB2C8\uB2E4.",
  };
}