import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

/**
 * All team data is stored in a single Firestore document per user:
 *   users/{uid}/teams/default
 *
 * This keeps reads/writes simple and cheap (1 read or 1 write per sync).
 * The document shape mirrors what localStorage holds:
 *   { players, lineups, battingHistory, positionHistory, benchHistory, teamName }
 */

function teamDocRef(uid) {
  return doc(db, 'users', uid, 'teams', 'default');
}

// Firestore doesn't support nested arrays. lineup.bench is an array of arrays
// (each inning has an array of benched player IDs), so we convert each inner
// array to a comma-joined string before saving, and split it back on load.

function sanitizeForFirestore(data) {
  if (!data.lineups) return data;
  return {
    ...data,
    lineups: data.lineups.map((lineup) => ({
      ...lineup,
      bench: lineup.bench
        ? lineup.bench.map((inningBench) =>
            Array.isArray(inningBench) ? inningBench.join(',') : inningBench
          )
        : [],
    })),
  };
}

function deserializeFromFirestore(data) {
  if (!data.lineups) return data;
  return {
    ...data,
    lineups: data.lineups.map((lineup) => ({
      ...lineup,
      bench: lineup.bench
        ? lineup.bench.map((inningBench) =>
            typeof inningBench === 'string' && inningBench.length > 0
              ? inningBench.split(',')
              : Array.isArray(inningBench) ? inningBench : []
          )
        : [],
    })),
  };
}

export async function loadAllData(uid) {
  const snap = await getDoc(teamDocRef(uid));
  if (!snap.exists()) return null;
  return deserializeFromFirestore(snap.data());
}

export async function saveAllData(uid, data) {
  await setDoc(teamDocRef(uid), sanitizeForFirestore(data));
}
