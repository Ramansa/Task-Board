export const json = (data: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const error = (message: string, status = 400) =>
  json({ error: message }, { status });

export const getJsonBody = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};
