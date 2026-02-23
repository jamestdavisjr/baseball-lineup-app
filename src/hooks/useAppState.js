import { useState, useCallback, useEffect, useRef } from 'react';
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
  loadTeamName,
  saveTeamName,
  clearAllData,
} from '../utils/storage.js';
import { loadAllData, saveAllData } from '../utils/firestoreStorage.js';
import {
  generateBattingOrder,
  generatePositionAssignments,
  updatePositionHistory,
  updateBenchHistory,
} from '../utils/lineupGenerator.js';
import { MIN_PLAYERS } from '../utils/constants.js';

export function useAppState(user) {
  const [players, setPlayers] = useState(() => loadPlayers());
  const [lineups, setLineups] = useState(() => loadLineups());
  const [battingHistory, setBattingHistory] = useState(() => loadBattingHistory());
  const [positionHistory, setPositionHistory] = useState(() => loadPositionHistory());
  const [benchHistory, setBenchHistory] = useState(() => loadBenchHistory());
  const [teamName, setTeamName] = useState(() => loadTeamName());
  const [firestoreLoaded, setFirestoreLoaded] = useState(false);

  // Avoid Firestore writes during initial load
  const initialLoadDone = useRef(false);
  const firestoreSaveTimer = useRef(null);

  // ---- Load from Firestore when user signs in ----
  useEffect(() => {
    if (!user) {
      setFirestoreLoaded(false);
      initialLoadDone.current = false;
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await loadAllData(user.uid);
        if (cancelled) return;

        if (data) {
          setPlayers(data.players || []);
          setLineups(data.lineups || []);
          setBattingHistory(data.battingHistory || []);
          setPositionHistory(data.positionHistory || {});
          setBenchHistory(data.benchHistory || {});
          setTeamName(data.teamName || '');

          // Update localStorage as offline cache
          savePlayers(data.players || []);
          saveLineups(data.lineups || []);
          saveBattingHistory(data.battingHistory || []);
          savePositionHistory(data.positionHistory || {});
          saveBenchHistory(data.benchHistory || {});
          saveTeamName(data.teamName || '');
        } else {
          // First sign-in — push current localStorage data to Firestore
          await saveAllData(user.uid, {
            players,
            lineups,
            battingHistory,
            positionHistory,
            benchHistory,
            teamName,
          });
        }
      } catch (err) {
        console.error('Firestore load failed, using localStorage:', err);
      }

      if (!cancelled) {
        setFirestoreLoaded(true);
        setTimeout(() => {
          initialLoadDone.current = true;
        }, 100);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ---- Persist to localStorage (always) ----
  useEffect(() => savePlayers(players), [players]);
  useEffect(() => saveLineups(lineups), [lineups]);
  useEffect(() => saveBattingHistory(battingHistory), [battingHistory]);
  useEffect(() => savePositionHistory(positionHistory), [positionHistory]);
  useEffect(() => saveBenchHistory(benchHistory), [benchHistory]);
  useEffect(() => saveTeamName(teamName), [teamName]);

  // ---- Persist to Firestore (debounced, when signed in) ----
  useEffect(() => {
    if (!user || !initialLoadDone.current) return;

    if (firestoreSaveTimer.current) clearTimeout(firestoreSaveTimer.current);

    firestoreSaveTimer.current = setTimeout(() => {
      saveAllData(user.uid, {
        players,
        lineups,
        battingHistory,
        positionHistory,
        benchHistory,
        teamName,
      }).catch((err) => console.error('Firestore save failed:', err));
    }, 500);

    return () => {
      if (firestoreSaveTimer.current) clearTimeout(firestoreSaveTimer.current);
    };
  }, [user, players, lineups, battingHistory, positionHistory, benchHistory, teamName]);

  // ---- Mutations ----

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

  const updateLineup = useCallback((id, updates) => {
    setLineups((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }, []);

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
    setTeamName('');
  }, []);

  return {
    players,
    lineups,
    battingHistory,
    positionHistory,
    benchHistory,
    teamName,
    setTeamName,
    addPlayer,
    removePlayer,
    updatePlayer,
    generateLineup,
    saveLineup,
    updateLineup,
    deleteLineup,
    resetHistory,
    resetAll,
    firestoreLoaded,
  };
}
