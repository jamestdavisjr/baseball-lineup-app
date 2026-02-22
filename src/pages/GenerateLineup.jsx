import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { POSITIONS, POSITION_LABELS, INNINGS_PER_GAME } from '../utils/constants.js';

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

  const getPlayerName = (id) => {
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : '?';
  };

  if (players.length !== 10) {
    return (
      <div className="page">
        <h2>Generate Lineup</h2>
        <div className="empty-state">
          <p>You need exactly 10 players on your roster.</p>
          <p>Currently: {players.length}/10</p>
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
            <p className="section-hint">Use arrows to adjust order</p>
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
            <p className="section-hint">Tap two players in an inning to swap them</p>
            <InningTabs
              lineup={lineup}
              players={players}
              getPlayerName={getPlayerName}
              swapPosition={swapPosition}
            />
          </section>
        </>
      )}
    </div>
  );
}

function InningTabs({ lineup, players, getPlayerName, swapPosition }) {
  const [activeInning, setActiveInning] = useState(0);
  const [selectedPos, setSelectedPos] = useState(null);

  const handlePosClick = (pos) => {
    if (selectedPos === null) {
      setSelectedPos(pos);
    } else if (selectedPos === pos) {
      setSelectedPos(null);
    } else {
      swapPosition(activeInning, selectedPos, pos);
      setSelectedPos(null);
    }
  };

  const inning = lineup.innings[activeInning];

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
    </div>
  );
}
