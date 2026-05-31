# Quiz Platform

Full-stack quiz application with two variants:
- **`quiz-platform/`** — Web app (Express + PostgreSQL + Prisma + React/Vite)
- **`Terminal ver/`** — Terminal-only version (Express + PostgreSQL + Prisma + CLI)

Both share the same backend logic and support role-based access (admin + normal user).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | JWT, bcrypt |
| Web Frontend | React, Vite |
| Terminal CLI | Node.js (no dependencies) |
| Container | Docker, docker-compose |
| Stress Test | Node.js (built-in, no dependencies) |

---

## Features

- User registration and login with JWT
- Role-based access: `admin` and `normal_user`
- Admin: add questions, remove questions, see correct answers
- Normal user: list questions, submit answers, view leaderboard
- Duplicate answer handling via Prisma upsert
- Stateless auth for concurrent user support
- Built-in stress test script (login and mixed scenarios)
- In-app debug logging (route, SQL, Prisma queries, controller, errors)
- Prisma migrations for database version control

---

## Demo Accounts

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | `admin@quiz.com` | `password123` | admin |
| Normal User One | `user1@quiz.com` | `password123` | normal_user |
| Normal User Two | `user2@quiz.com` | `password123` | normal_user |

---

## Quick Start (Both Versions)

**Prerequisites:** Node.js 18+, Docker

### 1. Web App (`quiz-platform/`)

```bash
cd quiz-platform
npm install
npm run db:start
npm run migrate
npm run seed
npm run dev
```

The dev script detects free ports and prints both backend and frontend URLs.

### 2. Terminal Version (`Terminal ver/`)

```bash
cd "Terminal ver"
npm install
npm run db:start
npm run migrate
npm run seed
npm run dev
```

Backend defaults to `http://localhost:3100`, PostgreSQL on port `5433`.

---

## Command Reference

### Web App (`quiz-platform/`)

| Action | Command | Role |
|---|---|---|
| Start app | `npm run dev` | any |
| Start DB | `npm run db:start` | any |
| Stop DB | `npm run db:stop` | any |
| Run migration | `npm run migrate` | any |
| Seed DB | `npm run seed` | any |
| Generate Prisma client | `npm run generate` | any |
| Full setup | `npm run setup` | any |
| Stress test | `npm run stress:test -- --scenario login --requests 200 --concurrency 20 --server http://localhost:3000` | any |
| Stress test mixed | `npm run stress:test -- --scenario mixed --requests 200 --concurrency 20 --server http://localhost:3000` | any |

### Terminal CLI (`Terminal ver/`)

Run every command with `npm run cli -- <command>` from the `Terminal ver/` directory.

#### System Commands

| Action | Command | Role |
|---|---|---|
| Backend health | `npm run cli -- health` | any |
| View debug logs | `npm run cli -- debug:logs` | any |
| Start backend | `npm run dev` | any |
| Run stress test | `npm run stress:test -- --scenario login --requests 200 --concurrency 20` | any |
| Run stress test mixed | `npm run stress:test -- --scenario mixed --requests 200 --concurrency 20` | any |

#### Auth Commands

| Action | Command | Role |
|---|---|---|
| Register user | `npm run cli -- auth:register --name "User" --email "user@example.com" --password "pass123"` | any |
| Register admin | `npm run cli -- auth:register --name "Admin" --email "admin@example.com" --password "pass123" --role admin` | any |
| Login | `npm run cli -- auth:login --email "admin@quiz.com" --password "password123"` | any |
| Show current user | `npm run cli -- auth:whoami` | any |
| Logout | `npm run cli -- auth:logout` | any |

#### User Commands

| Action | Command | Role |
|---|---|---|
| List questions | `npm run cli -- questions:list` | normal_user, admin |
| Submit answer | `npm run cli -- answers:submit --questionId 1 --selectedAnswer A` | normal_user, admin |
| View leaderboard | `npm run cli -- leaderboard:list` | normal_user, admin |

#### Admin Commands

| Action | Command | Role |
|---|---|---|
| List questions (with answers) | `npm run cli -- questions:list` | admin |
| Add a question | `npm run cli -- questions:add --questionText "..." --optionA "..." --optionB "..." --optionC "..." --optionD "..." --correctAnswer A --points 10` | admin |
| Remove a question | `npm run cli -- questions:remove --id 1` | admin |

---

## SQL Queries for Every Action

Each backend action maps to specific SQL queries. These are logged by the debug logger on every request.

### Auth Actions

#### Register User

```
SELECT * FROM "User" WHERE email = $1 LIMIT 1;
INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role;
```

**Backend files:** `backend/src/controllers/authController.js`, `backend/src/middleware/auth.js`

#### Login

```
SELECT * FROM "User" WHERE email = $1 LIMIT 1;
```

Sends back a JWT token on success. No per-session storage on the server — fully stateless.

**Backend files:** `backend/src/controllers/authController.js`

#### Auth Middleware (on every authenticated request)

```
SELECT id, name, email, role FROM "User" WHERE id = $1 LIMIT 1;
```

**Backend files:** `backend/src/middleware/auth.js`

---

### Question Actions

#### List Questions

```
SELECT * FROM "Question" ORDER BY id ASC;
```

For normal users the `correctAnswer` field is stripped from the response. Admins see all fields.

**Backend files:** `backend/src/controllers/questionsController.js`

#### Add Question (Admin only)

```
INSERT INTO "Question" (questionText, optionA, optionB, optionC, optionD, correctAnswer, points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
```

**Backend files:** `backend/src/controllers/questionsController.js`

#### Delete Question (Admin only)

```
SELECT * FROM "Question" WHERE id = $1 LIMIT 1;
DELETE FROM "Question" WHERE id = $1 RETURNING *;
```

Linked `Submission` rows are automatically deleted by the Prisma `onDelete: Cascade` relation.

**Backend files:** `backend/src/controllers/questionsController.js`

---

### Answer Actions

#### Submit Answer

```
SELECT * FROM "Question" WHERE id = $1 LIMIT 1;
INSERT INTO "Submission" (userId, questionId, selectedAnswer, isCorrect)
VALUES ($1, $2, $3, $4)
ON CONFLICT (userId, questionId)
DO UPDATE SET selectedAnswer = $3, isCorrect = $4
RETURNING *;
```

If the user already answered this question, the previous answer is updated (upsert). This prevents duplicate scoring.

**Backend files:** `backend/src/controllers/answersController.js`

---

### Leaderboard Actions

#### View Leaderboard

```sql
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      COALESCE(SUM(CASE WHEN s."isCorrect" THEN q.points ELSE 0 END), 0) DESC,
      u.name ASC
  ) AS rank,
  u.id,
  u.name,
  COALESCE(SUM(CASE WHEN s."isCorrect" THEN q.points ELSE 0 END), 0)::int AS score
FROM "User" u
LEFT JOIN "Submission" s ON s."userId" = u.id
LEFT JOIN "Question" q ON q.id = s."questionId"
GROUP BY u.id
ORDER BY score DESC, u.name ASC;
```

**Backend files:** `backend/src/controllers/leaderboardController.js`

---

### Database Schema

```sql
-- Users
CREATE TABLE "User" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'normal_user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Questions
CREATE TABLE "Question" (
    "id" SERIAL PRIMARY KEY,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" "AnswerChoice" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Submissions
CREATE TABLE "Submission" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "questionId" INTEGER NOT NULL REFERENCES "Question"("id") ON DELETE CASCADE,
    "selectedAnswer" "AnswerChoice" NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    UNIQUE ("userId", "questionId")
);
```

**Enums used:**

```
CREATE TYPE "Role" AS ENUM ('admin', 'normal_user');
CREATE TYPE "AnswerChoice" AS ENUM ('A', 'B', 'C', 'D');
```

**Backend file:** `backend/prisma/schema.prisma`

---

## Stress Test

A built-in stress test script is available in both versions at `scripts/stress-test.js`.

### How It Works

1. Spawns N concurrent worker functions based on `--concurrency`
2. Each worker pulls the next request index from a shared counter
3. Fires the HTTP call, records latency via `performance.now()`
4. Reports: success count, failure count, throughput (req/s), average latency, p95 latency, min/max latency, status code breakdown, top error messages

### Scenarios

| Scenario | Behavior |
|---|---|
| `login` | Concurrent `POST /auth/login` requests using demo accounts in round-robin |
| `mixed` | 25% login, 25% health check, 25% leaderboard, 25% authenticated question list |

### Commands

```bash
# Web app (backend on :3000)
cd quiz-platform
npm run stress:test -- --scenario login --requests 500 --concurrency 50 --server http://localhost:3000
npm run stress:test -- --scenario mixed --requests 500 --concurrency 50 --server http://localhost:3000

# Terminal version (backend on :3100)
cd "Terminal ver"
npm run stress:test -- --scenario login --requests 500 --concurrency 50 --server http://localhost:3100
npm run stress:test -- --scenario mixed --requests 500 --concurrency 50 --server http://localhost:3100
```

### Example Stress Test Output

```json
{
  "scenario": "login",
  "requests": 500,
  "concurrency": 50,
  "successCount": 500,
  "failureCount": 0,
  "successRate": 100,
  "throughputReqPerSec": 73.14,
  "latencyMs": {
    "avg": 649.2,
    "min": 73.85,
    "p95": 704.33,
    "max": 723.3
  },
  "statusCounts": { "200": 500 },
  "errorCounts": {},
  "totalDurationMs": 6835.77
}
```

### Performance Notes

- Login is slower (~73 req/s) because bcrypt hashing is CPU-intensive
- Mixed traffic reaches ~283 req/s since read endpoints are faster
- 50 concurrent workers produce zero failures under this test
- p95 latency stays under 710ms even at 50 concurrency

---

## Edge Cases

### 1. Concurrent Users

**Problem:** Many students accessing the test simultaneously can cause session conflicts or data races.

**Solution:** The backend uses stateless JWT auth. Each request carries its own bearer token. Persistent state lives in PostgreSQL, not in-memory. This is safe for concurrent access and scales horizontally.

**Files:** `backend/src/controllers/authController.js`, `backend/src/middleware/auth.js`

### 2. Duplicate Answers

**Problem:** A user answering the same question twice creates duplicate rows and incorrect scoring.

**Solution:** The database enforces `UNIQUE("userId", "questionId")` and the backend uses Prisma `upsert`. Repeated answers update the existing row instead of creating a second one.

**Files:** `backend/prisma/schema.prisma`, `backend/src/controllers/answersController.js`

### 3. High Load / Login Spikes

**Problem:** Without a repeatable way to measure throughput and latency, bottlenecks are hard to find before release.

**Solution:** A built-in stress test script (`scripts/stress-test.js`) supports login and mixed traffic scenarios. It reports throughput, latencies, and error counts.

**Files:** `scripts/stress-test.js`

Detailed edge-case notes are also in `EDGE_CASES.md` inside each project variant.

---

## Project Structure

```
ElectraCode Assignment/
├── README.md                        ← This file
├── quiz-platform/                   ← Web app version
│   ├── backend/                     ← Express + Prisma API
│   ├── frontend/                    ← React + Vite UI
│   ├── scripts/
│   │   ├── start-dev.js             ← Dev launcher (frontend + backend)
│   │   └── stress-test.js           ← Stress test script
│   ├── docker-compose.yml           ← PostgreSQL (port 5432)
│   ├── package.json
│   └── EDGE_CASES.md
│
├── Terminal ver/                    ← Terminal-only version
│   ├── backend/                     ← Express + Prisma API (same logic)
│   ├── cli/                         ← Node CLI client
│   ├── scripts/
│   │   └── stress-test.js           ← Stress test script (port 3100)
│   ├── docker-compose.yml           ← PostgreSQL (port 5433)
│   ├── package.json
│   └── EDGE_CASES.md
```

---

## API Routes

| Method | Path | Auth | Admin | Description |
|---|---|---|---|---|
| `GET` | `/health` | No | No | Backend health check |
| `POST` | `/auth/register` | No | No | Register new user |
| `POST` | `/auth/login` | No | No | Login, returns JWT |
| `GET` | `/questions` | Yes | No | List questions (no correctAnswer for user) |
| `POST` | `/questions` | Yes | Yes | Add a question |
| `DELETE` | `/questions/:id` | Yes | Yes | Delete a question |
| `POST` | `/answers` | Yes | No | Submit an answer |
| `GET` | `/leaderboard` | No | No | View ranked scores |
| `GET` | `/debug/logs` | No | No | View server debug logs |

---

## Environment Variables

```
DATABASE_URL="postgresql://quiz_user:quiz_password@localhost:5432/quiz_platform?schema=public"
JWT_SECRET="replace_me_with_a_long_random_secret"
PORT=3000
```

For the terminal version the defaults are port `3100` and database `quiz_platform_terminal` on port `5433`.
