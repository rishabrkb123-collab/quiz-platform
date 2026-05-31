const { performance } = require('node:perf_hooks');

const DEFAULT_SERVER = 'http://localhost:3000';
const DEFAULT_SCENARIO = 'login';
const DEFAULT_REQUESTS = 100;
const DEFAULT_CONCURRENCY = 10;
const DEMO_USERS = [
  { email: 'admin@quiz.com', password: 'password123' },
  { email: 'user1@quiz.com', password: 'password123' },
  { email: 'user2@quiz.com', password: 'password123' }
];

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      continue;
    }

    const trimmed = arg.slice(2);
    if (trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      options[key] = rest.join('=');
      continue;
    }

    const nextArg = argv[index + 1];
    if (!nextArg || nextArg.startsWith('--')) {
      options[trimmed] = true;
      continue;
    }

    options[trimmed] = nextArg;
    index += 1;
  }

  return options;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function percentile(sortedValues, p) {
  if (!sortedValues.length) {
    return 0;
  }

  const position = Math.ceil((p / 100) * sortedValues.length) - 1;
  const safeIndex = Math.max(0, Math.min(position, sortedValues.length - 1));
  return sortedValues[safeIndex];
}

function printHelp() {
  console.log(`Stress test options:

  npm run stress:test -- --scenario login --requests 200 --concurrency 20 --server http://localhost:3000
  npm run stress:test -- --scenario mixed --requests 200 --concurrency 20 --server http://localhost:3000

Options:

  --scenario      login | mixed
  --requests      Total number of requests to send
  --concurrency   Number of parallel workers
  --server        Backend base URL
  --email         Optional single account email for login scenario
  --password      Optional single account password for login scenario
  --help          Show this message
`);
}

async function sendJsonRequest(url, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let payload = {};

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (_error) {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(payload.error || `request failed with status ${response.status}`);
  }

  return {
    status: response.status,
    payload
  };
}

async function login(server, user) {
  const result = await sendJsonRequest(`${server}/auth/login`, {
    method: 'POST',
    body: user
  });

  return result.payload.token;
}

function buildUsers(options) {
  if (options.email && options.password) {
    return [{ email: options.email, password: options.password }];
  }

  return DEMO_USERS;
}

async function performScenarioRequest({ scenario, server, users, sharedToken, requestIndex }) {
  if (scenario === 'login') {
    const user = users[requestIndex % users.length];
    return sendJsonRequest(`${server}/auth/login`, {
      method: 'POST',
      body: user
    });
  }

  switch (requestIndex % 4) {
    case 0: {
      const user = users[requestIndex % users.length];
      return sendJsonRequest(`${server}/auth/login`, {
        method: 'POST',
        body: user
      });
    }
    case 1:
      return sendJsonRequest(`${server}/health`);
    case 2:
      return sendJsonRequest(`${server}/leaderboard`);
    default:
      return sendJsonRequest(`${server}/questions`, {
        headers: {
          Authorization: `Bearer ${sharedToken}`
        }
      });
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const scenario = options.scenario || DEFAULT_SCENARIO;
  if (!['login', 'mixed'].includes(scenario)) {
    throw new Error('scenario must be login or mixed');
  }

  const requests = toPositiveInteger(options.requests, DEFAULT_REQUESTS);
  const concurrency = Math.min(toPositiveInteger(options.concurrency, DEFAULT_CONCURRENCY), requests);
  const server = options.server || DEFAULT_SERVER;
  const users = buildUsers(options);
  const latencies = [];
  const statusCounts = {};
  const errorCounts = {};
  let successCount = 0;
  let failureCount = 0;
  let nextRequestIndex = 0;
  let sharedToken = null;

  if (scenario === 'mixed') {
    sharedToken = await login(server, users[0]);
  }

  async function worker() {
    while (true) {
      const requestIndex = nextRequestIndex;
      nextRequestIndex += 1;

      if (requestIndex >= requests) {
        return;
      }

      const startedAt = performance.now();

      try {
        const result = await performScenarioRequest({
          scenario,
          server,
          users,
          sharedToken,
          requestIndex
        });

        const endedAt = performance.now();
        latencies.push(endedAt - startedAt);
        successCount += 1;
        statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
      } catch (error) {
        const endedAt = performance.now();
        latencies.push(endedAt - startedAt);
        failureCount += 1;
        errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
      }
    }
  }

  const suiteStartedAt = performance.now();
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const suiteEndedAt = performance.now();

  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const totalDurationMs = suiteEndedAt - suiteStartedAt;
  const totalRequests = successCount + failureCount;
  const summary = {
    scenario,
    server,
    requests: totalRequests,
    concurrency,
    successCount,
    failureCount,
    successRate: totalRequests ? Number(((successCount / totalRequests) * 100).toFixed(2)) : 0,
    throughputReqPerSec: totalDurationMs ? Number(((totalRequests / totalDurationMs) * 1000).toFixed(2)) : 0,
    latencyMs: {
      avg: totalRequests ? Number((sortedLatencies.reduce((sum, value) => sum + value, 0) / totalRequests).toFixed(2)) : 0,
      min: sortedLatencies.length ? Number(sortedLatencies[0].toFixed(2)) : 0,
      p95: Number(percentile(sortedLatencies, 95).toFixed(2)),
      max: sortedLatencies.length ? Number(sortedLatencies[sortedLatencies.length - 1].toFixed(2)) : 0
    },
    statusCounts,
    errorCounts,
    totalDurationMs: Number(totalDurationMs.toFixed(2))
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(`Stress test failed: ${error.message}`);
  process.exit(1);
});
