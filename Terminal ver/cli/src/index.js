const fs = require('node:fs');
const path = require('node:path');

const SESSION_FILE = path.join(__dirname, '..', '.session.json');
const DEFAULT_API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3100';

function parseArgs(argv) {
  const options = {};
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg.startsWith('--')) {
      positional.push(arg);
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

  return {
    command: positional[0] || 'help',
    options
  };
}

function readSession() {
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

function clearSession() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

function getApiBaseUrl(options) {
  const session = readSession();
  return options.server || session?.apiBaseUrl || DEFAULT_API_BASE_URL;
}

function requireOption(options, key, message) {
  const value = options[key];

  if (value === undefined || value === '') {
    throw new Error(message || `missing required option --${key}`);
  }

  return value;
}

function requireSession() {
  const session = readSession();

  if (!session || !session.token) {
    throw new Error('no saved session; run auth:login first');
  }

  return session;
}

async function apiRequest(targetPath, { method = 'GET', body, requiresAuth = false, apiBaseUrl } = {}) {
  const session = requiresAuth ? requireSession() : null;
  const headers = { 'Content-Type': 'application/json' };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${targetPath}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(payload.error || `request failed with status ${response.status}`);
  }

  return payload;
}

function printJson(payload) {
  console.log(JSON.stringify(payload, null, 2));
}

function printHelp() {
  console.log(`Available commands:

  help
  health
  auth:register --name "Name" --email "email@example.com" --password "password123" [--role normal_user|admin]
  auth:login --email "email@example.com" --password "password123"
  auth:whoami
  auth:logout
  questions:list
  questions:add --questionText "..." --optionA "..." --optionB "..." --optionC "..." --optionD "..." --correctAnswer A --points 10
  questions:remove --id 1
  answers:submit --questionId 1 --selectedAnswer A
  leaderboard:list
  debug:logs

Optional on any command:

  --server http://localhost:3100
`);
}

async function run() {
  const { command, options } = parseArgs(process.argv.slice(2));
  const apiBaseUrl = getApiBaseUrl(options);

  switch (command) {
    case 'help':
      printHelp();
      return;

    case 'health': {
      const payload = await apiRequest('/health', { apiBaseUrl });
      printJson(payload);
      return;
    }

    case 'auth:register': {
      const payload = await apiRequest('/auth/register', {
        method: 'POST',
        apiBaseUrl,
        body: {
          name: requireOption(options, 'name'),
          email: requireOption(options, 'email'),
          password: requireOption(options, 'password'),
          role: options.role || 'normal_user'
        }
      });

      printJson(payload);
      return;
    }

    case 'auth:login': {
      const payload = await apiRequest('/auth/login', {
        method: 'POST',
        apiBaseUrl,
        body: {
          email: requireOption(options, 'email'),
          password: requireOption(options, 'password')
        }
      });

      saveSession({
        apiBaseUrl,
        token: payload.token,
        user: payload.user
      });

      printJson({
        message: 'session saved',
        apiBaseUrl,
        user: payload.user
      });
      return;
    }

    case 'auth:whoami': {
      const session = requireSession();
      printJson({
        apiBaseUrl: session.apiBaseUrl,
        user: session.user
      });
      return;
    }

    case 'auth:logout': {
      clearSession();
      printJson({ message: 'session cleared' });
      return;
    }

    case 'questions:list': {
      const payload = await apiRequest('/questions', {
        apiBaseUrl,
        requiresAuth: true
      });

      printJson(payload);
      return;
    }

    case 'questions:add': {
      const payload = await apiRequest('/questions', {
        method: 'POST',
        apiBaseUrl,
        requiresAuth: true,
        body: {
          questionText: requireOption(options, 'questionText'),
          optionA: requireOption(options, 'optionA'),
          optionB: requireOption(options, 'optionB'),
          optionC: requireOption(options, 'optionC'),
          optionD: requireOption(options, 'optionD'),
          correctAnswer: requireOption(options, 'correctAnswer'),
          points: Number(requireOption(options, 'points'))
        }
      });

      printJson(payload);
      return;
    }

    case 'questions:remove': {
      const questionId = Number(requireOption(options, 'id'));
      const payload = await apiRequest(`/questions/${questionId}`, {
        method: 'DELETE',
        apiBaseUrl,
        requiresAuth: true
      });

      printJson(payload);
      return;
    }

    case 'answers:submit': {
      const payload = await apiRequest('/answers', {
        method: 'POST',
        apiBaseUrl,
        requiresAuth: true,
        body: {
          questionId: Number(requireOption(options, 'questionId')),
          selectedAnswer: requireOption(options, 'selectedAnswer')
        }
      });

      printJson(payload);
      return;
    }

    case 'leaderboard:list': {
      const payload = await apiRequest('/leaderboard', { apiBaseUrl });
      printJson(payload);
      return;
    }

    case 'debug:logs': {
      const payload = await apiRequest('/debug/logs', { apiBaseUrl });
      printJson(payload);
      return;
    }

    default:
      throw new Error(`unknown command: ${command}`);
  }
}

run().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
