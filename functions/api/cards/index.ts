import { requireUser } from '../../_lib/auth';
import { Env } from '../../_lib/types';
import { error, getJsonBody, json } from '../../_lib/http';

interface CreateCardBody {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
}

const allowedStatuses = new Set(['todo', 'in_progress', 'done']);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) {
    return error('Unauthorized.', 401);
  }

  const cards = await env.DB.prepare(
    'SELECT id, title, description, status, position, created_at, updated_at FROM cards WHERE user_id = ? ORDER BY status, position, id'
  )
    .bind(user.id)
    .all();

  return json({ cards: cards.results ?? [] });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) {
    return error('Unauthorized.', 401);
  }

  const body = await getJsonBody<CreateCardBody>(request);
  const title = body?.title?.trim();
  const description = body?.description?.trim() || '';
  const status = body?.status ?? 'todo';

  if (!title) {
    return error('Title is required.', 400);
  }

  if (!allowedStatuses.has(status)) {
    return error('Invalid status.', 400);
  }

  const positionRow = await env.DB.prepare(
    'SELECT COALESCE(MAX(position), -1) + 1 as nextPosition FROM cards WHERE user_id = ? AND status = ?'
  )
    .bind(user.id, status)
    .first<{ nextPosition: number }>();

  const nextPosition = positionRow?.nextPosition ?? 0;

  const result = await env.DB.prepare(
    "INSERT INTO cards (user_id, title, description, status, position, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))"
  )
    .bind(user.id, title, description, status, nextPosition)
    .run();

  const card = await env.DB.prepare(
    'SELECT id, title, description, status, position, created_at, updated_at FROM cards WHERE id = ? AND user_id = ?'
  )
    .bind(result.meta.last_row_id, user.id)
    .first();

  return json({ card }, { status: 201 });
};
