export default function Settings({ resetHistory, resetAll, lineups, battingHistory }) {
  return (
    <div className="page">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>History Stats</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{lineups.length}</div>
            <div className="stat-label">Games Saved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{battingHistory.length}</div>
            <div className="stat-label">Batting Orders Used</div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Reset Options</h3>
        <div className="settings-actions">
          <button
            className="btn-warning"
            onClick={() => {
              if (
                confirm(
                  'Reset rotation history? This will allow previously used batting orders and position combos to be reused. Saved lineups will be kept.'
                )
              ) {
                resetHistory();
              }
            }}
          >
            Reset Rotation History
          </button>
          <p className="settings-hint">
            Use this when you want to start fresh rotations but keep your roster and saved lineups.
          </p>

          <button
            className="btn-danger-fill"
            onClick={() => {
              if (
                confirm(
                  'Delete ALL data? This removes all players, lineups, and history. This cannot be undone.'
                )
              ) {
                resetAll();
              }
            }}
          >
            Reset Everything
          </button>
          <p className="settings-hint">
            Nuclear option: removes all players, lineups, and history.
          </p>
        </div>
      </div>
    </div>
  );
}
