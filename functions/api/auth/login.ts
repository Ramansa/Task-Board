import { error, getJsonBody, json } from '../../_lib/http';
import { Env } from '../../_lib/types';
import { hashPassword, timingSafeEqual, generateSessionId } from '../../_lib/crypto';
import { sessionCookieHeader } from '../../_lib/auth';

interface LoginBody {
  email?: string;
  password?: string;
}

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
  password_hash: string;
  salt: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await getJsonBody<LoginBody>(request);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password ?? '';

  if (!email || !password) {
    return error('Email and password are required.', 400);
  }

  const user = await env.DB.prepare(
    'SELECT id, email, name, role, password_hash, salt FROM users WHERE email = ?'
  )
    .bind(email)
    .first<UserRow>();

  if (!user) {
    return error('Invalid email or password.', 401);
  }

  const computed = await hashPassword(password, user.salt);
  if (!timingSafeEqual(computed, user.password_hash)) {
    return error('Invalid email or password.', 401);
  }

  const sessionId = generateSessionId(env.SESSION_SECRET || 'dev-secret');

  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 day'))"
  )
    .bind(sessionId, user.id)
    .run();

  return json(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    },
    {
      headers: {
        'set-cookie': sessionCookieHeader(sessionId, 60 * 60 * 24 * 30)
      }
    }
  );
};
