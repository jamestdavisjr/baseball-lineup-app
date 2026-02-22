import { POSITIONS, INNINGS_PER_GAME, FIELD_SPOTS } from './constants.js';

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Generate a batting order that hasn't been used before.
 * All players on the roster bat (continuous batting order).
 */
export function generateBattingOrder(players, battingHistory) {
  const playerIds = players.map((p) => p.id);
  const historySet = new Set(battingHistory);

  for (let attempt = 0; attempt < 1000; attempt++) {
    const order = shuffle(playerIds);
    const key = JSON.stringify(order);
    if (!historySet.has(key)) {
      return order;
    }
  }

  return shuffle(playerIds);
}

/**
 * Generate position assignments for each inning.
 *
 * When roster > 10, each inning picks 10 players to field and the rest sit.
 * Bench rotation is balanced so everyone sits out roughly equally.
 *
 * Returns: { innings: [{pos: playerId}...], bench: [[playerId...]...] }
 */
export function generatePositionAssignments(players, restrictions, positionHistory, benchHistory) {
  const playerIds = players.map((p) => p.id);
  const positions = [...POSITIONS];
  const rosterSize = playerIds.length;
  const benchSize = rosterSize - FIELD_SPOTS;

  // Build eligible-positions map
  const canPlay = {};
  for (const pid of playerIds) {
    const restricted = restrictions[pid] || [];
    canPlay[pid] = positions.filter((pos) => !restricted.includes(pos));
  }

  // Track positions played in THIS game
  const gamePositions = {};
  playerIds.forEach((pid) => {
    gamePositions[pid] = new Set();
  });

  // Track bench innings in THIS game
  const gameBenchCount = {};
  playerIds.forEach((pid) => {
    gameBenchCount[pid] = 0;
  });

  const innings = [];
  const bench = [];

  for (let inning = 0; inning < INNINGS_PER_GAME; inning++) {
    // Determine who sits this inning
    let benchPlayers = [];

    if (benchSize > 0) {
      benchPlayers = pickBenchPlayers(
        playerIds,
        benchSize,
        gameBenchCount,
        benchHistory
      );
      benchPlayers.forEach((pid) => {
        gameBenchCount[pid]++;
      });
    }

    const fieldPlayers = playerIds.filter((pid) => !benchPlayers.includes(pid));

    const assignment = assignInning(
      fieldPlayers,
      positions,
      canPlay,
      positionHistory,
      gamePositions
    );

    if (assignment) {
      innings.push(assignment);
      for (const [pos, pid] of Object.entries(assignment)) {
        gamePositions[pid].add(pos);
      }
    } else {
      const fallback = fallbackAssignment(fieldPlayers, positions, canPlay);
      innings.push(fallback);
      for (const [pos, pid] of Object.entries(fallback)) {
        gamePositions[pid].add(pos);
      }
    }

    bench.push(benchPlayers);
  }

  return { innings, bench };
}

/**
 * Pick which players sit on the bench for an inning.
 * Prefers players who have sat out the least this game, then historically.
 */
function pickBenchPlayers(playerIds, benchSize, gameBenchCount, benchHistory) {
  const scored = playerIds.map((pid) => ({
    pid,
    gameCount: gameBenchCount[pid],
    histCount: benchHistory[pid] || 0,
  }));

  // Sort: fewest game bench innings first, then fewest historical, then random
  scored.sort((a, b) => {
    if (a.gameCount !== b.gameCount) return a.gameCount - b.gameCount;
    if (a.histCount !== b.histCount) return a.histCount - b.histCount;
    return Math.random() - 0.5;
  });

  // Take players who have sat least — but we want the ones who should sit MORE
  // Actually we want the opposite: pick players who have sat the LEAST so far,
  // because they're "due" to sit. Wait — we want to equalize, so pick players
  // who have sat the LEAST so everyone ends up even.
  // No — if someone has sat 0 times and another sat 2 times, the 0-sitter should sit next.
  // So pick from lowest bench count.
  return scored.slice(0, benchSize).map((s) => s.pid);
}

/**
 * Assign positions for a single inning using backtracking.
 */
function assignInning(fieldPlayers, positions, canPlay, positionHistory, gamePositions) {
  function score(pid, pos) {
    let s = 0;
    if (gamePositions[pid].has(pos)) s += 1000;
    const hist = positionHistory[pid] || {};
    s += hist[pos] || 0;
    return s;
  }

  const sortedPositions = [...positions].sort((a, b) => {
    const aCount = fieldPlayers.filter((pid) => canPlay[pid].includes(a)).length;
    const bCount = fieldPlayers.filter((pid) => canPlay[pid].includes(b)).length;
    return aCount - bCount;
  });

  const assignment = {};
  const usedPlayers = new Set();

  function backtrack(posIdx) {
    if (posIdx === sortedPositions.length) return true;
    const pos = sortedPositions[posIdx];

    const eligible = fieldPlayers
      .filter((pid) => !usedPlayers.has(pid) && canPlay[pid].includes(pos))
      .map((pid) => ({ pid, score: score(pid, pos) }))
      .sort((a, b) => a.score - b.score);

    const grouped = groupByScore(eligible);
    const randomized = grouped.flatMap((group) => shuffle(group));

    for (const { pid } of randomized) {
      assignment[pos] = pid;
      usedPlayers.add(pid);
      if (backtrack(posIdx + 1)) return true;
      usedPlayers.delete(pid);
      delete assignment[pos];
    }
    return false;
  }

  if (backtrack(0)) return assignment;
  return null;
}

function groupByScore(items) {
  const groups = [];
  let current = [];
  let currentScore = null;
  for (const item of items) {
    if (item.score !== currentScore) {
      if (current.length) groups.push(current);
      current = [item];
      currentScore = item.score;
    } else {
      current.push(item);
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

function fallbackAssignment(fieldPlayers, positions, canPlay) {
  const shuffledPlayers = shuffle(fieldPlayers);
  const shuffledPositions = shuffle(positions);
  const assignment = {};
  const used = new Set();

  for (const pos of shuffledPositions) {
    for (const pid of shuffledPlayers) {
      if (!used.has(pid) && canPlay[pid].includes(pos)) {
        assignment[pos] = pid;
        used.add(pid);
        break;
      }
    }
  }
  return assignment;
}

/**
 * Update position history with a completed game's assignments.
 */
export function updatePositionHistory(positionHistory, innings) {
  const updated = { ...positionHistory };
  for (const inning of innings) {
    for (const [pos, pid] of Object.entries(inning)) {
      if (!updated[pid]) updated[pid] = {};
      updated[pid][pos] = (updated[pid][pos] || 0) + 1;
    }
  }
  return updated;
}

/**
 * Update bench history with a completed game's bench assignments.
 */
export function updateBenchHistory(benchHistory, benchInnings) {
  const updated = { ...benchHistory };
  for (const benchList of benchInnings) {
    for (const pid of benchList) {
      updated[pid] = (updated[pid] || 0) + 1;
    }
  }
  return updated;
}
