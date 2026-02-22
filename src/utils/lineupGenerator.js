import { POSITIONS, INNINGS_PER_GAME } from './constants.js';

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
 * battingHistory is an array of previously used batting order strings (JSON).
 * Returns an array of player IDs in batting order.
 */
export function generateBattingOrder(players, battingHistory) {
  const playerIds = players.map((p) => p.id);
  const historySet = new Set(battingHistory);

  // Try up to 1000 times to find a unique order
  for (let attempt = 0; attempt < 1000; attempt++) {
    const order = shuffle(playerIds);
    const key = JSON.stringify(order);
    if (!historySet.has(key)) {
      return order;
    }
  }

  // If we've exhausted reasonable attempts, the history is likely full.
  // Reset and return a fresh shuffle.
  return shuffle(playerIds);
}

/**
 * Check if a batting history is "full" — meaning all permutations have been used.
 * For 10 players this is 10! = 3,628,800 so practically this never fills up.
 */
export function isBattingHistoryFull(players, battingHistory) {
  // 10! is ~3.6M, so we'll never truly exhaust it. Return false.
  return false;
}

/**
 * Generate position assignments for each inning.
 *
 * Each inning assigns every player to exactly one of the 10 positions.
 * Respects:
 *   - Player restrictions (positions they should NOT play)
 *   - Position history: tries to avoid repeating player→position combos from past games
 *
 * positionHistory: { [playerId]: { [position]: count } }
 * Returns: array of 6 objects, each mapping position → playerId
 */
export function generatePositionAssignments(players, restrictions, positionHistory) {
  const playerIds = players.map((p) => p.id);
  const positions = [...POSITIONS];

  // Build a matrix of which positions each player CAN play
  const canPlay = {};
  for (const pid of playerIds) {
    const restricted = restrictions[pid] || [];
    canPlay[pid] = positions.filter((pos) => !restricted.includes(pos));
  }

  // Track positions played in THIS game (player → Set of positions)
  const gamePositions = {};
  playerIds.forEach((pid) => {
    gamePositions[pid] = new Set();
  });

  const innings = [];

  for (let inning = 0; inning < INNINGS_PER_GAME; inning++) {
    const assignment = assignInning(playerIds, positions, canPlay, positionHistory, gamePositions);
    if (assignment) {
      innings.push(assignment);
      // Update game positions tracker
      for (const [pos, pid] of Object.entries(assignment)) {
        gamePositions[pid].add(pos);
      }
    } else {
      // Fallback: random assignment respecting only restrictions
      const fallback = fallbackAssignment(playerIds, positions, canPlay);
      innings.push(fallback);
      for (const [pos, pid] of Object.entries(fallback)) {
        gamePositions[pid].add(pos);
      }
    }
  }

  return innings;
}

/**
 * Assign positions for a single inning using backtracking.
 * Tries to minimize repeated player→position combos across all history.
 * Also tries to give each player a different position each inning within this game.
 */
function assignInning(playerIds, positions, canPlay, positionHistory, gamePositions) {
  // Score a player-position combo: lower is better (less frequently played)
  function score(pid, pos) {
    let s = 0;
    // Heavily penalize positions already played this game
    if (gamePositions[pid].has(pos)) s += 1000;
    // Add historical count
    const hist = positionHistory[pid] || {};
    s += hist[pos] || 0;
    return s;
  }

  // Sort positions to assign hardest-to-fill first (fewest eligible players)
  const sortedPositions = [...positions].sort((a, b) => {
    const aCount = playerIds.filter((pid) => canPlay[pid].includes(a)).length;
    const bCount = playerIds.filter((pid) => canPlay[pid].includes(b)).length;
    return aCount - bCount;
  });

  const assignment = {};
  const usedPlayers = new Set();

  function backtrack(posIdx) {
    if (posIdx === sortedPositions.length) return true;
    const pos = sortedPositions[posIdx];

    // Get eligible players sorted by score (prefer least-used)
    const eligible = playerIds
      .filter((pid) => !usedPlayers.has(pid) && canPlay[pid].includes(pos))
      .map((pid) => ({ pid, score: score(pid, pos) }))
      .sort((a, b) => a.score - b.score);

    // Add some randomness among equally-scored players
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

  if (backtrack(0)) {
    return assignment;
  }
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

function fallbackAssignment(playerIds, positions, canPlay) {
  const shuffledPlayers = shuffle(playerIds);
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
