# Mini Quiz Platform

Full-stack quiz app with Express, PostgreSQL, Prisma, JWT auth, bcrypt password hashing, React/Vite, role-based admin question creation, leaderboard scoring, and an in-app terminal debug panel.

## Demo Accounts

- Admin: `admin@quiz.com` / `password123`
- User: `user1@quiz.com` / `password123`
- User: `user2@quiz.com` / `password123`

## Run Locally

```bash
npm install
npm run db:start
npm run migrate
npm run seed
npm run dev
```

`npm run dev` detects free backend and frontend ports, launches both apps, and prints the final URLs.

## Edge Cases

Detailed notes for concurrency, duplicate answers, and load handling are in `EDGE_CASES.md`.

## Stress Test

Use the printed backend URL from `npm run dev`, then run:

```bash
npm run stress:test -- --scenario login --requests 200 --concurrency 20 --server http://localhost:3000
```

Mixed login and read traffic:

```bash
npm run stress:test -- --scenario mixed --requests 200 --concurrency 20 --server http://localhost:3000
```

## Required Routes

- `POST /auth/register`
- `POST /auth/login`
- `GET /questions`
- `POST /questions` admin only
- `POST /answers`
- `GET /leaderboard`

The frontend sidebar logs UI actions, API routes, controller names, Prisma operations, SQL queries, terminal/server output, responses, and errors.
