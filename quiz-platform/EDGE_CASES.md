# Edge Cases

This file tracks key backend edge cases, the problem each one creates, and the solution used in the current project.

## 1. Several Students Accessing the Test at the Same Time

Problem:

- Many students can log in, fetch questions, and submit answers at the same time.
- If the backend stores per-user session state in memory, requests can conflict or become harder to scale.
- If writes are not isolated correctly, concurrent traffic can create inconsistent quiz data.

Solution used:

- Authentication is stateless because the backend uses JWT tokens instead of in-memory login sessions.
- Each request carries its own bearer token, so one user's session does not overwrite another user's session.
- Persistent state lives in PostgreSQL through Prisma instead of temporary in-memory user state.
- This keeps the API safer for concurrent access and easier to scale horizontally later.

Where this is implemented:

- `backend/src/controllers/authController.js`
- `backend/src/middleware/auth.js`
- `backend/prisma/schema.prisma`

## 2. Multiple Answers for the Same Question by the Same User

Problem:

- A user may answer the same question more than once.
- If every submission is inserted as a new row, the same user can get duplicate records and incorrect scoring.

Solution used:

- The database enforces one submission per user per question with `@@unique([userId, questionId])`.
- Answer saving uses Prisma `upsert`, so a repeated answer updates the existing row instead of creating a second one.
- This means the latest answer becomes the stored answer, and duplicate scoring is avoided.

Where this is implemented:

- `backend/prisma/schema.prisma`
- `backend/src/controllers/answersController.js`

## 3. High Login Traffic and General Load Handling

Problem:

- Login spikes and many parallel requests can slow the API or expose bottlenecks.
- Without a repeatable test, it is hard to measure throughput, latency, and failure rate before release.

Solution used:

- Added a repeatable stress test script at `scripts/stress-test.js`.
- The script supports two scenarios:
  - `login`: repeated concurrent `POST /auth/login` requests using demo users.
  - `mixed`: a mix of login, health, leaderboard, and authenticated question requests.
- The script reports total requests, success and failure counts, throughput, average latency, p95 latency, status-code counts, and top errors.

Commands used:

```bash
npm run stress:test -- --scenario login --requests 200 --concurrency 20 --server http://localhost:3000
npm run stress:test -- --scenario mixed --requests 200 --concurrency 20 --server http://localhost:3000
```

Where this is implemented:

- `scripts/stress-test.js`

## Current Notes

- The concurrency and duplicate-answer cases are already handled in the backend code.
- Stress testing is now available as a command, but the actual numbers depend on your local machine, Docker, database state, and chosen concurrency.
- As traffic grows further, likely next steps would be rate limiting, DB connection tuning, and deployment-level scaling.
