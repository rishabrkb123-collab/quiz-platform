export default function Leaderboard({ leaderboard }) {
  if (!leaderboard.length) {
    return <div className="empty-state compact">No scores yet.</div>;
  }

  return (
    <div className="leaderboard-table">
      <div className="leaderboard-row header">
        <span>Rank</span>
        <span>Name</span>
        <span>Score</span>
      </div>
      {leaderboard.map((entry) => (
        <div className="leaderboard-row" key={entry.userId}>
          <strong>#{entry.rank}</strong>
          <span>{entry.name}</span>
          <strong>{entry.score}</strong>
        </div>
      ))}
    </div>
  );
}
