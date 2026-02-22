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
  loadBenchHistory,
  saveBenchHistory,
  clearAllData,
} from '../utils/storage.js';
import {
  generateBattingOrder,
  generatePositionAssignments,
  updatePositionHistory,
  updateBenchHistory,
} from '../utils/lineupGenerator.js';
import { MIN_PLAYERS } from '../utils/constants.js';

export function useAppState() {
  const [players, setPlayers] = useState(() => loadPlayers());
  const [lineups, setLineups] = useState(() => loadLineups());
  const [battingHistory, setBattingHistory] = useState(() => loadBattingHistory());
  const [positionHistory, setPositionHistory] = useState(() => loadPositionHistory());
  const [benchHistory, setBenchHistory] = useState(() => loadBenchHistory());

  // Persist on change
  useEffect(() => savePlayers(players), [players]);
  useEffect(() => saveLineups(lineups), [lineups]);
  useEffect(() => saveBattingHistory(battingHistory), [battingHistory]);
  useEffect(() => savePositionHistory(positionHistory), [positionHistory]);
  useEffect(() => saveBenchHistory(benchHistory), [benchHistory]);

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
    if (players.length < MIN_PLAYERS) return null;

    const restrictions = {};
    players.forEach((p) => {
      restrictions[p.id] = p.restrictions || [];
    });

    const battingOrder = generateBattingOrder(players, battingHistory);
    const { innings, bench } = generatePositionAssignments(
      players,
      restrictions,
      positionHistory,
      benchHistory
    );

    const lineup = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      gameNumber: lineups.length + 1,
      battingOrder,
      innings,
      bench,
    };

    return lineup;
  }, [players, battingHistory, positionHistory, benchHistory, lineups]);

  const saveLineup = useCallback(
    (lineup) => {
      setLineups((prev) => [...prev, lineup]);
      setBattingHistory((prev) => [...prev, JSON.stringify(lineup.battingOrder)]);
      setPositionHistory((prev) => updatePositionHistory(prev, lineup.innings));
      if (lineup.bench) {
        setBenchHistory((prev) => updateBenchHistory(prev, lineup.bench));
      }
    },
    []
  );

  const deleteLineup = useCallback((id) => {
    setLineups((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const resetHistory = useCallback(() => {
    setBattingHistory([]);
    setPositionHistory({});
    setBenchHistory({});
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    setPlayers([]);
    setLineups([]);
    setBattingHistory([]);
    setPositionHistory({});
    setBenchHistory({});
  }, []);

  return {
    players,
    lineups,
    battingHistory,
    positionHistory,
    benchHistory,
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
