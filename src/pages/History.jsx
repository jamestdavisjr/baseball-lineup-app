import { useState } from 'react';
import { POSITIONS, INNINGS_PER_GAME } from '../utils/constants.js';

export default function History({ players, lineups, deleteLineup }) {
  const [expandedId, setExpandedId] = useState(null);

  const getPlayerName = (id) => {
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : '(removed)';
  };

  const handlePrint = (lineup) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = buildPrintHTML(lineup, getPlayerName);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  if (lineups.length === 0) {
    return (
      <div className="page">
        <h2>Lineup History</h2>
        <div className="empty-state">
          <p>No lineups saved yet. Generate your first lineup!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Lineup History</h2>
      <p className="subtitle">{lineups.length} game(s) saved</p>

      <div className="history-list">
        {[...lineups].reverse().map((lineup) => (
          <div key={lineup.id} className="history-card">
            <div
              className="history-header"
              onClick={() =>
                setExpandedId(expandedId === lineup.id ? null : lineup.id)
              }
            >
              <div>
                <strong>Game #{lineup.gameNumber}</strong>
                <span className="history-date">
                  {new Date(lineup.date).toLocaleDateString()}
                </span>
              </div>
              <span className="expand-icon">
                {expandedId === lineup.id ? '▲' : '▼'}
              </span>
            </div>

            {expandedId === lineup.id && (
              <div className="history-detail">
                <div className="history-actions">
                  <button
                    className="btn-secondary btn-small"
                    onClick={() => handlePrint(lineup)}
                  >
                    Print
                  </button>
                  <button
                    className="btn-danger-outline btn-small"
                    onClick={() => {
                      if (confirm('Delete this lineup?')) {
                        deleteLineup(lineup.id);
                        setExpandedId(null);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>

                <h4>Batting Order</h4>
                <ol className="print-batting">
                  {lineup.battingOrder.map((pid) => (
                    <li key={pid}>{getPlayerName(pid)}</li>
                  ))}
                </ol>

                <h4>Field Positions</h4>
                <div className="print-innings-grid">
                  <table className="innings-table">
                    <thead>
                      <tr>
                        <th>Pos</th>
                        {Array.from({ length: INNINGS_PER_GAME }, (_, i) => (
                          <th key={i}>Inn {i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {POSITIONS.map((pos) => (
                        <tr key={pos}>
                          <td className="pos-cell">{pos}</td>
                          {lineup.innings.map((inning, i) => (
                            <td key={i}>{getPlayerName(inning[pos])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildPrintHTML(lineup, getPlayerName) {
  const battingRows = lineup.battingOrder
    .map((pid, i) => `<tr><td>${i + 1}</td><td>${getPlayerName(pid)}</td></tr>`)
    .join('');

  const posHeaders = Array.from({ length: INNINGS_PER_GAME }, (_, i) => `<th>Inn ${i + 1}</th>`).join('');
  const posRows = POSITIONS.map(
    (pos) =>
      `<tr><td><strong>${pos}</strong></td>${lineup.innings
        .map((inn) => `<td>${getPlayerName(inn[pos])}</td>`)
        .join('')}</tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Game #${lineup.gameNumber} - ${new Date(lineup.date).toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    h2 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; }
    .date { color: #666; font-size: 14px; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; font-size: 13px; }
    th { background: #f5f5f5; }
    ol { padding-left: 24px; }
    li { margin-bottom: 2px; font-size: 14px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>Game #${lineup.gameNumber} Lineup</h1>
  <div class="date">${new Date(lineup.date).toLocaleDateString()}</div>

  <h2>Batting Order</h2>
  <table>
    <thead><tr><th>#</th><th>Player</th></tr></thead>
    <tbody>${battingRows}</tbody>
  </table>

  <h2>Field Positions</h2>
  <table>
    <thead><tr><th>Pos</th>${posHeaders}</tr></thead>
    <tbody>${posRows}</tbody>
  </table>
</body>
</html>`;
}
