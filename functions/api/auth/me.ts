import { requireUser } from '../../_lib/auth';
import { Env } from '../../_lib/types';
import { json } from '../../_lib/http';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await requireUser(request, env);
  if (!user) {
    return json({ user: null }, { status: 401 });
  }

  return json({ user });
};
