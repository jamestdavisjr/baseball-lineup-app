import { useState } from 'react';
import { INNINGS_PER_GAME } from '../utils/constants.js';

/**
 * Build a map of playerId → [position for inning 0, inning 1, ...].
 * Players on the bench get "BN".
 */
function buildPlayerInningMap(lineup) {
  const map = {};
  for (const pid of lineup.battingOrder) {
    map[pid] = [];
  }
  for (let i = 0; i < INNINGS_PER_GAME; i++) {
    const inning = lineup.innings[i];
    const benchList = lineup.bench?.[i] || [];
    for (const pid of lineup.battingOrder) {
      map[pid].push(benchList.includes(pid) ? 'BN' : null);
    }
    for (const [pos, pid] of Object.entries(inning)) {
      if (map[pid]) {
        map[pid][i] = pos;
      }
    }
  }
  return map;
}

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
        {[...lineups].reverse().map((lineup) => {
          const hasBench = lineup.bench && lineup.bench.some((b) => b.length > 0);
          const playerInningMap = buildPlayerInningMap(lineup);

          return (
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
                  {hasBench && <span className="history-badge">{lineup.battingOrder.length}P</span>}
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

                  <div className="lineup-card-grid">
                    <table className="lineup-table">
                      <thead>
                        <tr>
                          <th className="col-order">#</th>
                          <th className="col-name">Player</th>
                          {Array.from({ length: INNINGS_PER_GAME }, (_, i) => (
                            <th key={i} className="col-inning">{i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lineup.battingOrder.map((pid, idx) => {
                          const positions = playerInningMap[pid] || [];
                          return (
                            <tr key={pid}>
                              <td className="cell-order">{idx + 1}</td>
                              <td className="cell-name">{getPlayerName(pid)}</td>
                              {positions.map((pos, i) => (
                                <td key={i} className={`cell-pos ${pos === 'BN' ? 'cell-bench' : ''}`}>
                                  {pos || '—'}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildPrintHTML(lineup, getPlayerName) {
  const playerInningMap = buildPlayerInningMap(lineup);

  const inningHeaders = Array.from(
    { length: INNINGS_PER_GAME },
    (_, i) => `<th>Inn ${i + 1}</th>`
  ).join('');

  const playerRows = lineup.battingOrder
    .map((pid, idx) => {
      const positions = playerInningMap[pid] || [];
      const cells = positions
        .map((pos) => {
          const cls = pos === 'BN' ? ' class="bench-cell"' : '';
          return `<td${cls}>${pos || '—'}</td>`;
        })
        .join('');
      return `<tr><td><strong>${idx + 1}</strong></td><td>${getPlayerName(pid)}</td>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <title>Game #${lineup.gameNumber} - ${new Date(lineup.date).toLocaleDateString()}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .date { color: #666; font-size: 14px; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: center; font-size: 13px; }
    th { background: #2e7d32; color: white; }
    td:first-child { text-align: center; font-weight: bold; width: 30px; }
    td:nth-child(2) { text-align: left; font-weight: 500; white-space: nowrap; }
    .bench-cell { background: #fff8ee; font-style: italic; color: #999; }
    @media print {
      body { padding: 0; }
      th { background: #333 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .bench-cell { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <h1>Game #${lineup.gameNumber} Lineup</h1>
  <div class="date">${new Date(lineup.date).toLocaleDateString()}</div>

  <table>
    <thead><tr><th>#</th><th style="text-align:left">Player</th>${inningHeaders}</tr></thead>
    <tbody>${playerRows}</tbody>
  </table>
</body>
</html>`;
}
