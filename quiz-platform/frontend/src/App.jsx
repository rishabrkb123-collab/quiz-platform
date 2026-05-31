import { useEffect, useState } from 'react';
import { apiRequest } from './api.js';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DebugTerminal from './components/DebugTerminal.jsx';

function makeLogEntry(type, message, timestamp) {
  return {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    timestamp: timestamp || new Date().toISOString(),
    type,
    message
  };
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem('quiz_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [logs, setLogs] = useState([
    makeLogEntry('terminal', 'npm run dev'),
    makeLogEntry('terminal', 'npx prisma migrate dev --name init'),
    makeLogEntry('terminal', 'npx prisma db seed')
  ]);
  const [token, setToken] = useState(() => localStorage.getItem('quiz_token') || '');
  const [user, setUser] = useState(readStoredUser);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [notice, setNotice] = useState('');

  function appendLog(type, message, timestamp) {
    setLogs((currentLogs) => [...currentLogs.slice(-450), makeLogEntry(type, message, timestamp)]);
  }

  async function loadLeaderboard() {
    appendLog('ui', 'Leaderboard refreshed');
    try {
      const payload = await apiRequest('/leaderboard', {}, appendLog);
      setLeaderboard(payload.leaderboard || []);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadQuestions(authToken = token) {
    appendLog('ui', 'Get Questions clicked');

    if (!authToken) {
      appendLog('error', 'login required before GET /questions');
      return;
    }

    try {
      const payload = await apiRequest('/questions', { token: authToken }, appendLog);
      setQuestions(payload.questions || []);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleAuth(mode, formData) {
    appendLog('ui', `${mode === 'login' ? 'Login' : 'Register'} clicked`);
    setNotice('');

    try {
      const payload = await apiRequest(`/auth/${mode}`, { method: 'POST', body: formData }, appendLog);
      setToken(payload.token);
      setUser(payload.user);
      localStorage.setItem('quiz_token', payload.token);
      localStorage.setItem('quiz_user', JSON.stringify(payload.user));
      appendLog('terminal', 'token generated and saved in localStorage');
      await loadQuestions(payload.token);
      await loadLeaderboard();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleSubmitAnswer(questionId, selectedAnswer) {
    appendLog('ui', 'Submit Answer clicked');
    setNotice('');

    try {
      const payload = await apiRequest(
        '/answers',
        { method: 'POST', token, body: { questionId, selectedAnswer } },
        appendLog
      );
      setNotice(payload.isCorrect ? `Correct. +${payload.awardedPoints} points.` : 'Saved. That answer was not correct.');
      await loadLeaderboard();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function handleAddQuestion(formData) {
    appendLog('ui', 'Add Question clicked');
    setNotice('');

    try {
      await apiRequest('/questions', { method: 'POST', token, body: formData }, appendLog);
      setNotice('Question added.');
      await loadQuestions();
      return true;
    } catch (error) {
      setNotice(error.message);
      return false;
    }
  }

  async function handleHealthCheck() {
    appendLog('ui', 'Health Check clicked');
    setNotice('');

    try {
      const payload = await apiRequest('/health', {}, appendLog);
      setNotice(`Backend health: ${payload.status}`);
    } catch (error) {
      setNotice(error.message);
    }
  }

  function handleLogout() {
    appendLog('ui', 'Logout clicked');
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    setToken('');
    setUser(null);
    setQuestions([]);
    setNotice('Logged out.');
  }

  useEffect(() => {
    appendLog('terminal', 'frontend booted; debug sidebar ready');
    loadLeaderboard();

    if (token) {
      loadQuestions(token);
    }
  }, []);

  return (
    <div className="app-shell">
      <main className="main-panel">
        <header className="hero-card">
          <div>
            <p className="eyebrow">Mini Quiz Platform</p>
            <h1>Quiz dashboard with live API trace</h1>
            <p className="hero-copy">
              Register, log in, answer questions, view scores, and watch every API step in the terminal panel.
            </p>
          </div>
          {user ? (
            <div className="session-card">
              <span>Signed in as</span>
              <strong>{user.name}</strong>
              <small>{user.role}</small>
              <button className="ghost-button" onClick={handleLogout}>Logout</button>
            </div>
          ) : null}
        </header>

        {notice ? <div className="notice">{notice}</div> : null}

        {user ? (
          <Dashboard
            user={user}
            questions={questions}
            leaderboard={leaderboard}
            onRefreshQuestions={() => loadQuestions()}
            onRefreshLeaderboard={loadLeaderboard}
            onSubmitAnswer={handleSubmitAnswer}
            onAddQuestion={handleAddQuestion}
          />
        ) : (
          <AuthPage leaderboard={leaderboard} onAuth={handleAuth} onRefreshLeaderboard={loadLeaderboard} />
        )}
      </main>

      <DebugTerminal
        logs={logs}
        isAuthenticated={Boolean(token)}
        onHealthCheck={handleHealthCheck}
        onRefreshQuestions={() => loadQuestions()}
        onRefreshLeaderboard={loadLeaderboard}
        onClear={() => setLogs([makeLogEntry('terminal', 'logs cleared')])}
      />
    </div>
  );
}
