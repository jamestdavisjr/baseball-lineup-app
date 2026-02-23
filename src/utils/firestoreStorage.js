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

export async function loadAllData(uid) {
  const snap = await getDoc(teamDocRef(uid));
  if (!snap.exists()) return null;
  return snap.data();
}

export async function saveAllData(uid, data) {
  await setDoc(teamDocRef(uid), data);
}
