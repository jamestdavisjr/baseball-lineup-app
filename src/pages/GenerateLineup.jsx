import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { POSITIONS, INNINGS_PER_GAME, MIN_PLAYERS } from '../utils/constants.js';

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
    // Mark everyone as BN first, then override with actual position
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

export default function GenerateLineup({ players, generateLineup, saveLineup }) {
  const [lineup, setLineup] = useState(null);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = () => {
    const newLineup = generateLineup();
    if (newLineup) {
      setLineup(newLineup);
      setSaved(false);
    }
  };

  const handleSave = () => {
    if (lineup && !saved) {
      saveLineup(lineup);
      setSaved(true);
    }
  };

  const handleSaveAndView = () => {
    if (lineup && !saved) {
      saveLineup(lineup);
      setSaved(true);
    }
    navigate('/history');
  };

  const swapBattingOrder = (idx1, idx2) => {
    if (!lineup || idx2 < 0 || idx2 >= lineup.battingOrder.length) return;
    const newOrder = [...lineup.battingOrder];
    [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
    setLineup({ ...lineup, battingOrder: newOrder });
    setSaved(false);
  };

  const swapPosition = (inningIdx, pos1, pos2) => {
    if (!lineup) return;
    const newInnings = lineup.innings.map((inn, i) => {
      if (i !== inningIdx) return { ...inn };
      const updated = { ...inn };
      const temp = updated[pos1];
      updated[pos1] = updated[pos2];
      updated[pos2] = temp;
      return updated;
    });
    setLineup({ ...lineup, innings: newInnings });
    setSaved(false);
  };

  const swapFieldAndBench = (inningIdx, position, benchPlayerIdx) => {
    if (!lineup) return;
    const benchPid = lineup.bench[inningIdx][benchPlayerIdx];
    const fieldPid = lineup.innings[inningIdx][position];

    const newInnings = lineup.innings.map((inn, i) => {
      if (i !== inningIdx) return { ...inn };
      return { ...inn, [position]: benchPid };
    });
    const newBench = lineup.bench.map((b, i) => {
      if (i !== inningIdx) return [...b];
      const updated = [...b];
      updated[benchPlayerIdx] = fieldPid;
      return updated;
    });
    setLineup({ ...lineup, innings: newInnings, bench: newBench });
    setSaved(false);
  };

  const getPlayerName = (id) => {
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : '?';
  };

  const hasBench = players.length > MIN_PLAYERS;

  if (players.length < MIN_PLAYERS) {
    return (
      <div className="page">
        <h2>Generate Lineup</h2>
        <div className="empty-state">
          <p>You need at least {MIN_PLAYERS} players on your roster.</p>
          <p>Currently: {players.length}/{MIN_PLAYERS}</p>
          <button onClick={() => navigate('/roster')}>Go to Roster</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Generate Lineup</h2>

      {!lineup && (
        <div className="generate-prompt">
          <p>Ready to create a new game lineup!</p>
          <p className="section-hint">
            {players.length} players &mdash; {hasBench ? `${players.length - MIN_PLAYERS} will rotate to bench` : 'all players field every inning'}
          </p>
          <button className="btn-primary btn-large" onClick={handleGenerate}>
            Generate New Lineup
          </button>
        </div>
      )}

      {lineup && (
        <>
          <div className="lineup-actions">
            <button className="btn-secondary" onClick={handleGenerate}>
              Re-Generate
            </button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saved}
            >
              {saved ? 'Saved!' : 'Save Lineup'}
            </button>
            <button className="btn-secondary" onClick={handleSaveAndView}>
              Save & View
            </button>
          </div>

          <section className="lineup-section">
            <h3>Lineup Card</h3>
            <p className="section-hint">
              Batting order with positions per inning. Use arrows to reorder batters.
            </p>
            <LineupCard
              lineup={lineup}
              players={players}
              getPlayerName={getPlayerName}
              swapBattingOrder={swapBattingOrder}
            />
          </section>

          <section className="lineup-section">
            <h3>Edit Positions by Inning</h3>
            <p className="section-hint">
              Tap two players in an inning to swap them
              {hasBench ? ' — tap bench player then field position to swap in/out' : ''}
            </p>
            <InningTabs
              lineup={lineup}
              players={players}
              getPlayerName={getPlayerName}
              swapPosition={swapPosition}
              swapFieldAndBench={swapFieldAndBench}
              hasBench={hasBench}
            />
          </section>
        </>
      )}
    </div>
  );
}

function LineupCard({ lineup, players, getPlayerName, swapBattingOrder }) {
  const playerInningMap = buildPlayerInningMap(lineup);

  return (
    <div className="lineup-card-grid">
      <table className="lineup-table">
        <thead>
          <tr>
            <th className="col-order">#</th>
            <th className="col-name">Player</th>
            {Array.from({ length: INNINGS_PER_GAME }, (_, i) => (
              <th key={i} className="col-inning">{i + 1}</th>
            ))}
            <th className="col-arrows"></th>
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
                <td className="cell-arrows">
                  <button
                    className="btn-arrow-sm"
                    disabled={idx === 0}
                    onClick={() => swapBattingOrder(idx, idx - 1)}
                  >
                    ▲
                  </button>
                  <button
                    className="btn-arrow-sm"
                    disabled={idx === lineup.battingOrder.length - 1}
                    onClick={() => swapBattingOrder(idx, idx + 1)}
                  >
                    ▼
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InningTabs({ lineup, players, getPlayerName, swapPosition, swapFieldAndBench, hasBench }) {
  const [activeInning, setActiveInning] = useState(0);
  const [selectedPos, setSelectedPos] = useState(null);
  const [selectedBenchIdx, setSelectedBenchIdx] = useState(null);

  const handlePosClick = (pos) => {
    if (selectedBenchIdx !== null) {
      swapFieldAndBench(activeInning, pos, selectedBenchIdx);
      setSelectedBenchIdx(null);
      setSelectedPos(null);
    } else if (selectedPos === null) {
      setSelectedPos(pos);
    } else if (selectedPos === pos) {
      setSelectedPos(null);
    } else {
      swapPosition(activeInning, selectedPos, pos);
      setSelectedPos(null);
    }
  };

  const handleBenchClick = (benchIdx) => {
    if (selectedPos !== null) {
      swapFieldAndBench(activeInning, selectedPos, benchIdx);
      setSelectedPos(null);
      setSelectedBenchIdx(null);
    } else if (selectedBenchIdx === benchIdx) {
      setSelectedBenchIdx(null);
    } else {
      setSelectedBenchIdx(benchIdx);
    }
  };

  const inning = lineup.innings[activeInning];
  const benchPlayers = lineup.bench?.[activeInning] || [];

  const getRestrictionWarning = (pos, pid) => {
    const player = players.find((p) => p.id === pid);
    return player && player.restrictions?.includes(pos);
  };

  return (
    <div className="inning-tabs-container">
      <div className="inning-tabs">
        {Array.from({ length: INNINGS_PER_GAME }, (_, i) => (
          <button
            key={i}
            className={`inning-tab ${activeInning === i ? 'active' : ''}`}
            onClick={() => {
              setActiveInning(i);
              setSelectedPos(null);
              setSelectedBenchIdx(null);
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="inning-positions">
        {POSITIONS.map((pos) => {
          const pid = inning[pos];
          const hasWarning = getRestrictionWarning(pos, pid);
          return (
            <div
              key={pos}
              className={`position-row ${selectedPos === pos ? 'selected' : ''} ${hasWarning ? 'warning' : ''}`}
              onClick={() => handlePosClick(pos)}
            >
              <span className="pos-label">{pos}</span>
              <span className="pos-player">{getPlayerName(pid)}</span>
              {hasWarning && <span className="warning-icon" title="Player has restriction for this position">⚠</span>}
            </div>
          );
        })}
      </div>
      {hasBench && benchPlayers.length > 0 && (
        <div className="bench-section">
          <div className="bench-label">Bench</div>
          {benchPlayers.map((pid, idx) => (
            <div
              key={pid}
              className={`position-row bench-row ${selectedBenchIdx === idx ? 'selected' : ''}`}
              onClick={() => handleBenchClick(idx)}
            >
              <span className="pos-label bench-icon">BN</span>
              <span className="pos-player">{getPlayerName(pid)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
