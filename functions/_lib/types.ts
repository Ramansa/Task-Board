export interface Env {
  DB: D1Database;
  SESSION_SECRET: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'member';
}
