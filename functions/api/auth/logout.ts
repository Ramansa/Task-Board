import { clearSessionCookieHeader, getSessionId } from '../../_lib/auth';
import { json } from '../../_lib/http';
import { Env } from '../../_lib/types';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sessionId = getSessionId(request);
  if (sessionId) {
    await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }

  return json(
    { ok: true },
    {
      headers: {
        'set-cookie': clearSessionCookieHeader()
      }
    }
  );
};
