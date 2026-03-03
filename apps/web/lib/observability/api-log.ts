type ApiLogParams = {
  endpoint: string;
  method: string;
  userId?: string | null;
  stage: string;
  error: unknown;
};

export function logApiError(params: ApiLogParams) {
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
      message,
      stack,
      at: new Date().toISOString(),
    })
  );
}
