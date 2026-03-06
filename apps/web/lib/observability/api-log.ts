import { randomUUID } from "crypto";

type ApiLogParams = {
  endpoint: string;
  method: string;
  userId?: string | null;
  stage: string;
  requestId?: string;
  statusCode?: number;
  durationMs?: number;
  details?: Record<string, unknown>;
};

type ApiErrorLogParams = ApiLogParams & {
  error: unknown;
};

export function resolveRequestId(request: Request) {
  return request.headers.get("x-request-id")?.trim() || randomUUID();
}

export function logApiInfo(params: ApiLogParams) {
  console.info(
    JSON.stringify({
      level: "info",
      type: "api_event",
      endpoint: params.endpoint,
      method: params.method,
      stage: params.stage,
      userId: params.userId ?? null,
      requestId: params.requestId ?? null,
      statusCode: params.statusCode ?? null,
      durationMs: params.durationMs ?? null,
      details: params.details ?? null,
      at: new Date().toISOString(),
    })
  );
}

export function logApiError(params: ApiErrorLogParams) {
  const message = params.error instanceof Error ? params.error.message : String(params.error);
  const stack = params.error instanceof Error ? params.error.stack : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      type: "api_error",
      endpoint: params.endpoint,
      method: params.method,
      stage: params.stage,
      userId: params.userId ?? null,
      requestId: params.requestId ?? null,
      statusCode: params.statusCode ?? null,
      durationMs: params.durationMs ?? null,
      details: params.details ?? null,
      message,
      stack,
      at: new Date().toISOString(),
    })
  );
}
