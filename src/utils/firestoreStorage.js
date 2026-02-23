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

// Firestore doesn't support nested arrays. Rather than hunting for every
// specific field, we deep-walk the data and JSON-stringify any array element
// that is itself an array, prefixed with a marker so we can restore it on load.

const NESTED_ARRAY_PREFIX = '__arr__';

function deepSanitize(value, insideArray = false) {
  if (Array.isArray(value)) {
    if (insideArray) {
      // Nested array — serialize to a marked JSON string
      return NESTED_ARRAY_PREFIX + JSON.stringify(value);
    }
    return value.map((item) => deepSanitize(item, true));
  }
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepSanitize(v, false);
    }
    return out;
  }
  return value;
}

function deepRestore(value) {
  if (typeof value === 'string' && value.startsWith(NESTED_ARRAY_PREFIX)) {
    return JSON.parse(value.slice(NESTED_ARRAY_PREFIX.length));
  }
  if (Array.isArray(value)) {
    return value.map(deepRestore);
  }
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepRestore(v);
    }
    return out;
  }
  return value;
}

export async function loadAllData(uid) {
  const snap = await getDoc(teamDocRef(uid));
  if (!snap.exists()) return null;
  return deepRestore(snap.data());
}

export async function saveAllData(uid, data) {
  await setDoc(teamDocRef(uid), deepSanitize(data));
}
