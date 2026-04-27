# Task Board (Cloudflare Pages + D1)

A fully functional Kanban board built for Cloudflare Pages with D1.

## Features

- User registration and login.
- The first registered user is automatically assigned the `admin` role.
- Session-based authentication using secure HTTP-only cookies.
- Kanban board with three columns:
  - To Do
  - In Progress
  - Done
- Create, move, edit, and delete cards.

## Project structure

- `public/` — static frontend served by Cloudflare Pages.
- `functions/api/` — Cloudflare Pages Functions API.
- `migrations/` — D1 SQL schema.
- `functions/_lib/` — shared helpers for auth, db, and HTTP responses.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create D1 database:
   ```bash
   npx wrangler d1 create task_board
   ```
3. Update `wrangler.toml` with the returned `database_id`.
4. Apply migration locally:
   ```bash
   npx wrangler d1 execute task_board --local --file=./migrations/0001_init.sql
   ```
5. Run locally:
   ```bash
   npm run dev
   ```

## Deploy

Deploy with Cloudflare Pages using Wrangler:

```bash
npm run deploy
```

Ensure your Pages project has:

- `D1` binding named `DB`
- Environment variable `SESSION_SECRET` (a long random string)
