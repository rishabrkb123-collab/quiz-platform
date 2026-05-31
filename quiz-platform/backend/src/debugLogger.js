const { AsyncLocalStorage } = require('node:async_hooks');
const http = require('node:http');

const debugStore = new AsyncLocalStorage();
const globalLogs = [];
const MAX_GLOBAL_LOGS = 500;

function createEntry(type, message) {
  return {
    timestamp: new Date().toISOString(),
    type,
    message: String(message)
  };
}

function addDebugLog(type, message) {
  const entry = createEntry(type, message);
  const store = debugStore.getStore();

  if (store) {
    store.logs.push(entry);
  }

  globalLogs.push(entry);
  if (globalLogs.length > MAX_GLOBAL_LOGS) {
    globalLogs.shift();
  }

  console.log(`[${entry.timestamp}] ${type.toUpperCase()} ${entry.message}`);
  return entry;
}

function getRequestLogs() {
  const store = debugStore.getStore();
  return store ? [...store.logs] : [];
}

function getGlobalLogs() {
  return [...globalLogs];
}

function debugRequestMiddleware(req, res, next) {
  debugStore.run({ logs: [] }, () => {
    addDebugLog('route', `${req.method} ${req.originalUrl}`);

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      const statusText = http.STATUS_CODES[res.statusCode] || 'OK';
      addDebugLog('response', `${res.statusCode} ${statusText}`);

      if (body && typeof body === 'object' && !Array.isArray(body)) {
        return originalJson({ ...body, _debugLogs: getRequestLogs() });
      }

      return originalJson({ data: body, _debugLogs: getRequestLogs() });
    };

    next();
  });
}

module.exports = {
  addDebugLog,
  debugRequestMiddleware,
  getGlobalLogs,
  getRequestLogs
};
