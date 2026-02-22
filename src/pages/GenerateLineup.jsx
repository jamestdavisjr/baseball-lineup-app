import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { POSITIONS, INNINGS_PER_GAME, MIN_PLAYERS } from '../utils/constants.js';

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
            <h3>Batting Order</h3>
            <p className="section-hint">
              {hasBench ? 'All players bat (continuous order) — use arrows to adjust' : 'Use arrows to adjust order'}
            </p>
            <div className="batting-order">
              {lineup.battingOrder.map((pid, idx) => (
                <div key={pid} className="batting-row">
                  <span className="batting-num">{idx + 1}.</span>
                  <span className="batting-name">{getPlayerName(pid)}</span>
                  <div className="batting-arrows">
                    <button
                      className="btn-arrow"
                      disabled={idx === 0}
                      onClick={() => swapBattingOrder(idx, idx - 1)}
                    >
                      ▲
                    </button>
                    <button
                      className="btn-arrow"
                      disabled={idx === lineup.battingOrder.length - 1}
                      onClick={() => swapBattingOrder(idx, idx + 1)}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="lineup-section">
            <h3>Field Positions by Inning</h3>
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

function InningTabs({ lineup, players, getPlayerName, swapPosition, swapFieldAndBench, hasBench }) {
  const [activeInning, setActiveInning] = useState(0);
  const [selectedPos, setSelectedPos] = useState(null);
  const [selectedBenchIdx, setSelectedBenchIdx] = useState(null);

  const handlePosClick = (pos) => {
    if (selectedBenchIdx !== null) {
      // Swap bench player into this field position
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
      // Swap field player to bench
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
    if (player && player.restrictions?.includes(pos)) {
      return true;
    }
    return false;
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
