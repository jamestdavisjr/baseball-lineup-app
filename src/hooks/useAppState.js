import { useState, useCallback, useEffect } from 'react';
import {
  loadPlayers,
  savePlayers,
  loadLineups,
  saveLineups,
  loadBattingHistory,
  saveBattingHistory,
  loadPositionHistory,
  savePositionHistory,
  clearAllData,
} from '../utils/storage.js';
import {
  generateBattingOrder,
  generatePositionAssignments,
  updatePositionHistory,
} from '../utils/lineupGenerator.js';

export function useAppState() {
  const [players, setPlayers] = useState(() => loadPlayers());
  const [lineups, setLineups] = useState(() => loadLineups());
  const [battingHistory, setBattingHistory] = useState(() => loadBattingHistory());
  const [positionHistory, setPositionHistory] = useState(() => loadPositionHistory());

  // Persist on change
  useEffect(() => savePlayers(players), [players]);
  useEffect(() => saveLineups(lineups), [lineups]);
  useEffect(() => saveBattingHistory(battingHistory), [battingHistory]);
  useEffect(() => savePositionHistory(positionHistory), [positionHistory]);

  const addPlayer = useCallback((name) => {
    const id = crypto.randomUUID();
    setPlayers((prev) => [...prev, { id, name, restrictions: [] }]);
  }, []);

  const removePlayer = useCallback((id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const updatePlayer = useCallback((id, updates) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }, []);

  const generateLineup = useCallback(() => {
    if (players.length !== 10) return null;

    const restrictions = {};
    players.forEach((p) => {
      restrictions[p.id] = p.restrictions || [];
    });

    const battingOrder = generateBattingOrder(players, battingHistory);
    const positionAssignments = generatePositionAssignments(
      players,
      restrictions,
      positionHistory
    );

    const lineup = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      gameNumber: lineups.length + 1,
      battingOrder,
      innings: positionAssignments,
    };

    return lineup;
  }, [players, battingHistory, positionHistory, lineups]);

  const saveLineup = useCallback(
    (lineup) => {
      setLineups((prev) => [...prev, lineup]);
      setBattingHistory((prev) => [...prev, JSON.stringify(lineup.battingOrder)]);
      setPositionHistory((prev) => updatePositionHistory(prev, lineup.innings));
    },
    []
  );

  const deleteLineup = useCallback((id) => {
    setLineups((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const resetHistory = useCallback(() => {
    setBattingHistory([]);
    setPositionHistory({});
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    setPlayers([]);
    setLineups([]);
    setBattingHistory([]);
    setPositionHistory({});
  }, []);

  return {
    players,
    lineups,
    battingHistory,
    positionHistory,
    addPlayer,
    removePlayer,
    updatePlayer,
    generateLineup,
    saveLineup,
    deleteLineup,
    resetHistory,
    resetAll,
  };
}
