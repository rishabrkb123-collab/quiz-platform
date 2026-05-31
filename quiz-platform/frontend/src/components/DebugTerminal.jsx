import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api.js';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function DebugTerminal({
  logs,
  isAuthenticated,
  onHealthCheck,
  onRefreshQuestions,
  onRefreshLeaderboard,
  onClear
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <aside className="terminal-sidebar">
      <div className="terminal-header">
        <div>
          <p>REAL-TIME DEBUG</p>
          <strong>{API_BASE_URL}</strong>
        </div>
        <button onClick={onClear}>Clear</button>
      </div>

      <div className="terminal-actions">
        <button onClick={onHealthCheck}>Health</button>
        <button onClick={onRefreshLeaderboard}>Leaderboard</button>
        <button onClick={onRefreshQuestions} disabled={!isAuthenticated}>Get Questions</button>
      </div>

      <div className="terminal-window" aria-live="polite">
        {logs.map((log) => (
          <div className={`terminal-line ${log.type}`} key={log.id}>
            <span className="terminal-time">[{formatTime(log.timestamp)}]</span>
            <span className="terminal-type">{log.type}</span>
            <span className="terminal-message">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </aside>
  );
}
