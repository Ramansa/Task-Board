import { Env, User } from './types';

const SESSION_COOKIE = 'tb_session';

export const getCookie = (request: Request, name: string): string | null => {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';').map((part) => part.trim());
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    if (key === name) {
      return rest.join('=');
    }
  }

  return null;
};

export const sessionCookieHeader = (sessionId: string, maxAgeSeconds: number) =>
  `${SESSION_COOKIE}=${sessionId}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}; Secure`;

export const clearSessionCookieHeader = () =>
  `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Secure`;

export const getSessionId = (request: Request) => getCookie(request, SESSION_COOKIE);

export const requireUser = async (request: Request, env: Env): Promise<User | null> => {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return null;
  }

  const result = await env.DB.prepare(
    `SELECT u.id, u.email, u.name, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND datetime(s.expires_at) > datetime('now')`
  )
    .bind(sessionId)
    .first<User>();

  return result ?? null;
};
