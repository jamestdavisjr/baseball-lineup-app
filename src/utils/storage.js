const STORAGE_KEYS = {
  PLAYERS: 'baseball-lineup-players',
  LINEUPS: 'baseball-lineup-history',
  BATTING_HISTORY: 'baseball-batting-history',
  POSITION_HISTORY: 'baseball-position-history',
  BENCH_HISTORY: 'baseball-bench-history',
};

export function loadPlayers() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePlayers(players) {
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
}

export function loadLineups() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LINEUPS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLineups(lineups) {
  localStorage.setItem(STORAGE_KEYS.LINEUPS, JSON.stringify(lineups));
}

export function loadBattingHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BATTING_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveBattingHistory(history) {
  localStorage.setItem(STORAGE_KEYS.BATTING_HISTORY, JSON.stringify(history));
}

export function loadPositionHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.POSITION_HISTORY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function savePositionHistory(history) {
  localStorage.setItem(STORAGE_KEYS.POSITION_HISTORY, JSON.stringify(history));
}

export function loadBenchHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BENCH_HISTORY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveBenchHistory(history) {
  localStorage.setItem(STORAGE_KEYS.BENCH_HISTORY, JSON.stringify(history));
}

export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
