export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function readServerLogs(payload, appendLog) {
  if (!payload || !Array.isArray(payload._debugLogs)) {
    return;
  }

  payload._debugLogs.forEach((entry) => {
    appendLog(entry.type, entry.message, entry.timestamp);
  });
}

export async function apiRequest(path, options, appendLog) {
  const method = options?.method || 'GET';
  const token = options?.token;
  const body = options?.body;

  appendLog('route', `${method} ${path}`);
  appendLog('terminal', `fetch ${API_BASE_URL}${path}`);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    readServerLogs(payload, appendLog);
    appendLog('response', `${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(payload.error || 'request failed');
    }

    return payload;
  } catch (error) {
    appendLog('error', error.message);
    throw error;
  }
}
