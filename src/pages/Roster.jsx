import { useState } from 'react';
import { POSITIONS, POSITION_LABELS } from '../utils/constants.js';

export default function Roster({ players, addPlayer, removePlayer, updatePlayer }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleAdd = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    addPlayer(name);
    setNewName('');
  };

  const toggleRestriction = (playerId, position) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    const restrictions = player.restrictions || [];
    const updated = restrictions.includes(position)
      ? restrictions.filter((r) => r !== position)
      : [...restrictions, position];
    updatePlayer(playerId, { restrictions: updated });
  };

  return (
    <div className="page">
      <h2>Team Roster</h2>
      <p className="subtitle">
        {players.length}/10 players &mdash; {players.length === 10 ? 'Ready to generate!' : 'Add players to get started'}
      </p>

      <form className="add-player-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Player name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={players.length >= 10}
          maxLength={30}
        />
        <button type="submit" disabled={players.length >= 10 || !newName.trim()}>
          Add
        </button>
      </form>

      <div className="player-list">
        {players.map((player, idx) => (
          <div key={player.id} className="player-card">
            <div className="player-header">
              <span className="player-number">#{idx + 1}</span>
              <span className="player-name">{player.name}</span>
              <div className="player-actions">
                <button
                  className="btn-icon"
                  onClick={() =>
                    setEditingId(editingId === player.id ? null : player.id)
                  }
                  title="Edit restrictions"
                >
                  {editingId === player.id ? '▲' : '▼'}
                </button>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => removePlayer(player.id)}
                  title="Remove player"
                >
                  ✕
                </button>
              </div>
            </div>
            {player.restrictions?.length > 0 && editingId !== player.id && (
              <div className="restrictions-summary">
                Can't play: {player.restrictions.join(', ')}
              </div>
            )}
            {editingId === player.id && (
              <div className="restrictions-editor">
                <p className="restrictions-label">
                  Tap positions this player should <strong>NOT</strong> play:
                </p>
                <div className="position-grid">
                  {POSITIONS.map((pos) => (
                    <button
                      key={pos}
                      className={`position-btn ${
                        (player.restrictions || []).includes(pos) ? 'restricted' : ''
                      }`}
                      onClick={() => toggleRestriction(player.id, pos)}
                    >
                      <span className="pos-abbr">{pos}</span>
                      <span className="pos-name">{POSITION_LABELS[pos]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="empty-state">
          <p>No players yet. Add your 10 team members above!</p>
        </div>
      )}
    </div>
  );
}
