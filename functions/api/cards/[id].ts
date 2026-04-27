import { requireUser } from '../../_lib/auth';
import { Env } from '../../_lib/types';
import { error, getJsonBody, json } from '../../_lib/http';

interface UpdateCardBody {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  position?: number;
}

const allowedStatuses = new Set(['todo', 'in_progress', 'done']);

export const onRequestPatch: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireUser(request, env);
  if (!user) {
    return error('Unauthorized.', 401);
  }

  const cardId = Number(params.id);
  if (!Number.isInteger(cardId) || cardId <= 0) {
    return error('Invalid card id.', 400);
  }

  const body = await getJsonBody<UpdateCardBody>(request);
  if (!body) {
    return error('Invalid request body.', 400);
  }

  const existing = await env.DB.prepare('SELECT id FROM cards WHERE id = ? AND user_id = ?')
    .bind(cardId, user.id)
    .first();

  if (!existing) {
    return error('Card not found.', 404);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.title === 'string') {
    const title = body.title.trim();
    if (!title) {
      return error('Title cannot be empty.', 400);
    }
    updates.push('title = ?');
    values.push(title);
  }

  if (typeof body.description === 'string') {
    updates.push('description = ?');
    values.push(body.description.trim());
  }

  if (typeof body.status === 'string') {
    if (!allowedStatuses.has(body.status)) {
      return error('Invalid status.', 400);
    }
    updates.push('status = ?');
    values.push(body.status);
  }

  if (typeof body.position === 'number' && Number.isFinite(body.position)) {
    updates.push('position = ?');
    values.push(Math.max(0, Math.floor(body.position)));
  }

  if (!updates.length) {
    return error('No valid fields provided.', 400);
  }

  updates.push("updated_at = datetime('now')");

  const sql = `UPDATE cards SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
  values.push(cardId, user.id);

  await env.DB.prepare(sql)
    .bind(...values)
    .run();

  const card = await env.DB.prepare(
    'SELECT id, title, description, status, position, created_at, updated_at FROM cards WHERE id = ? AND user_id = ?'
  )
    .bind(cardId, user.id)
    .first();

  return json({ card });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const user = await requireUser(request, env);
  if (!user) {
    return error('Unauthorized.', 401);
  }

  const cardId = Number(params.id);
  if (!Number.isInteger(cardId) || cardId <= 0) {
    return error('Invalid card id.', 400);
  }

  const result = await env.DB.prepare('DELETE FROM cards WHERE id = ? AND user_id = ?')
    .bind(cardId, user.id)
    .run();

  if (!result.meta.changes) {
    return error('Card not found.', 404);
  }

  return json({ ok: true });
};
