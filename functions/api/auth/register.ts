import { createPassword } from '../../_lib/crypto';
import { error, getJsonBody, json } from '../../_lib/http';
import { sessionCookieHeader } from '../../_lib/auth';
import { Env } from '../../_lib/types';
import { generateSessionId } from '../../_lib/crypto';

interface RegisterBody {
  email?: string;
  name?: string;
  password?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await getJsonBody<RegisterBody>(request);
  const email = body?.email?.trim().toLowerCase();
  const name = body?.name?.trim();
  const password = body?.password ?? '';

  if (!email || !name || password.length < 8) {
    return error('Invalid input. Email, name and password (min 8 chars) are required.', 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return error('Email is already registered.', 409);
  }

  const countRow = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
  const role = (countRow?.count ?? 0) === 0 ? 'admin' : 'member';

  const { salt, passwordHash } = await createPassword(password);

  const result = await env.DB.prepare(
    'INSERT INTO users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
  )
    .bind(email, name, passwordHash, salt, role)
    .run();

  const userId = result.meta.last_row_id as number;
  const sessionId = generateSessionId(env.SESSION_SECRET || 'dev-secret');

  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 day'))"
  )
    .bind(sessionId, userId)
    .run();

  return json(
    { user: { id: userId, email, name, role } },
    {
      status: 201,
      headers: {
        'set-cookie': sessionCookieHeader(sessionId, 60 * 60 * 24 * 30)
      }
    }
  );
};
