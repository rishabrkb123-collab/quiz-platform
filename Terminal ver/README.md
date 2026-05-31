# Terminal Quiz Platform

Terminal-only version of the quiz project. This folder keeps the backend logic, removes the React web app, and adds a CLI so every action happens from the terminal.

## What Is Inside

- `backend/`: Express + Prisma + PostgreSQL API
- `cli/`: terminal client for admin and normal user commands
- `docker-compose.yml`: local PostgreSQL on port `5433`
- `EDGE_CASES.md`: edge-case notes and chosen solutions

## Prerequisites

- Node.js `18+`
- Docker

## Demo Accounts

- Admin: `admin@quiz.com` / `password123`
- User: `user1@quiz.com` / `password123`
- User: `user2@quiz.com` / `password123`

## One-Time Setup

```bash
npm install
npm run db:start
npm run migrate
npm run seed
npm run dev
```

Backend defaults:

- API base URL: `http://localhost:3100`
- PostgreSQL host port: `5433`

If you want to stop PostgreSQL later:

```bash
npm run db:stop
```

## Environment File

This project already includes `backend/.env` for local development.

If you want to reset it from the example:

```bash
cp backend/.env.example backend/.env
```

## How CLI Login Works

- `auth:login` stores the active session in `cli/.session.json`
- `auth:logout` removes that saved session
- Log in as admin when you want admin commands
- Log in as a normal user when you want normal user commands

Optional on any CLI command:

```bash
--server http://localhost:3100
```

## Core Run Commands

Start backend:

```bash
npm run dev
```

Start backend in normal start mode:

```bash
npm run start
```

Show CLI help:

```bash
npm run cli -- help
```

Run backend stress test:

```bash
npm run stress:test -- --scenario login --requests 200 --concurrency 20 --server http://localhost:3100
```

Mixed login and read traffic stress test:

```bash
npm run stress:test -- --scenario mixed --requests 200 --concurrency 20 --server http://localhost:3100
```

## Auth Commands

Register normal user:

```bash
npm run cli -- auth:register --name "User Three" --email "user3@quiz.com" --password "password123"
```

Register admin user:

```bash
npm run cli -- auth:register --name "Second Admin" --email "admin2@quiz.com" --password "password123" --role admin
```

Login as admin:

```bash
npm run cli -- auth:login --email "admin@quiz.com" --password "password123"
```

Login as normal user:

```bash
npm run cli -- auth:login --email "user1@quiz.com" --password "password123"
```

Show current logged-in user:

```bash
npm run cli -- auth:whoami
```

Logout:

```bash
npm run cli -- auth:logout
```

## Normal User Commands

Check backend health:

```bash
npm run cli -- health
```

List questions:

```bash
npm run cli -- questions:list
```

Submit an answer:

```bash
npm run cli -- answers:submit --questionId 1 --selectedAnswer A
```

View leaderboard:

```bash
npm run cli -- leaderboard:list
```

View backend debug logs:

```bash
npm run cli -- debug:logs
```

## Admin Commands

Admin can do everything a normal user can do, plus add and remove questions.

List questions as admin:

```bash
npm run cli -- questions:list
```

When an admin runs `questions:list`, the response includes `correctAnswer` too.

Add a question:

```bash
npm run cli -- questions:add --questionText "What does CLI stand for?" --optionA "Command Line Interface" --optionB "Code Link Input" --optionC "Central Logic Index" --optionD "Command Logic Internet" --correctAnswer A --points 10
```

Remove a question:

```bash
npm run cli -- questions:remove --id 1
```

## Full Command Reference

```bash
npm run cli -- help
npm run cli -- health
npm run cli -- auth:register --name "Name" --email "email@example.com" --password "password123" [--role normal_user|admin]
npm run cli -- auth:login --email "email@example.com" --password "password123"
npm run cli -- auth:whoami
npm run cli -- auth:logout
npm run cli -- questions:list
npm run cli -- questions:add --questionText "..." --optionA "..." --optionB "..." --optionC "..." --optionD "..." --correctAnswer A --points 10
npm run cli -- questions:remove --id 1
npm run cli -- answers:submit --questionId 1 --selectedAnswer A
npm run cli -- leaderboard:list
npm run cli -- debug:logs
```

## Backend Maintenance Commands

Install dependencies:

```bash
npm install
```

Start PostgreSQL:

```bash
npm run db:start
```

Stop PostgreSQL:

```bash
npm run db:stop
```

Run Prisma migration:

```bash
npm run migrate
```

Generate Prisma client:

```bash
npm run generate
```

Seed database:

```bash
npm run seed
```

Run full local setup:

```bash
npm run setup
```

## Notes

- `questions:add` and `questions:remove` are admin only
- `answers:submit` updates the same user/question submission if you answer again
- deleting a question also removes linked submissions because of the Prisma schema relation
- edge-case writeup is in `EDGE_CASES.md`
