import {
  doc, getDoc, runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// ── Bucket system ──────────────────────────────────────────────────────────
//
// Scores 1–1000: one bucket per score (key = "s1", "s2", ... "s1000")
// Scores 1001+:  grouped buckets (key = "s1001_1500", "s1501_2000", etc.)
//
// Each bucket value = count of players whose personal best falls in that range.

const HIGH_BUCKETS = [
  { key: 's1001_1500',  min: 1001,  max: 1500  },
  { key: 's1501_2000',  min: 1501,  max: 2000  },
  { key: 's2001_3000',  min: 2001,  max: 3000  },
  { key: 's3001_5000',  min: 3001,  max: 5000  },
  { key: 's5001_10000', min: 5001,  max: 10000 },
  { key: 's10001_20000',min: 10001, max: 20000 },
  { key: 's20001_30000',min: 20001, max: 30000 },
  { key: 's30000plus',  min: 30001, max: Infinity },
];

/** Return the Firestore bucket key for a given score. */
function bucketKey(score) {
  if (score <= 1000) return `s${score}`;
  const band = HIGH_BUCKETS.find(b => score >= b.min && score <= b.max);
  return band ? band.key : 's30000plus';
}

/**
 * Calculate what percentage of players scored STRICTLY GREATER than this score.
 * Returns an integer 1–100, the string "< 1", or null if not enough data.
 */
export function calcPercentile(score, totalPlayers, data) {
  if (!totalPlayers || totalPlayers < 1) return null;

  // Count players who scored strictly MORE than this score
  let playersAbove = 0;

  // Individual buckets (score+1)..1000
  if (score < 1000) {
    for (let s = score + 1; s <= 1000; s++) {
      playersAbove += data[`s${s}`] || 0;
    }
  }

  // High buckets entirely above score
  for (const band of HIGH_BUCKETS) {
    if (band.min > score) {
      playersAbove += data[band.key] || 0;
    }
  }

  const fraction = playersAbove / totalPlayers; // 0 = you beat everyone, 1 = everyone beat you
  const pct = fraction * 100;

  if (pct === 0) return '< 1'; // nobody scored higher — effectively top
  if (pct < 1) return '< 1';

  return Math.min(100, Math.round(pct)); // integer 1–100
}

// ── Firestore helpers ──────────────────────────────────────────────────────

function dateDocRef(dateStr) {
  return doc(db, 'dailyScores', dateStr);
}

/** Fetch the global data for a date. Returns the document data or null. */
export async function fetchGlobalData(dateStr) {
  try {
    const snap = await getDoc(dateDocRef(dateStr));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.error('fetchGlobalData error:', e);
    return null;
  }
}

/**
 * Submit a completed game to Firestore.
 *
 * - Updates the global high score + sequence if beaten.
 * - Counts each player once per day (localStorage flag).
 * - Maintains the score distribution:
 *     • First play today → increment their score's bucket.
 *     • Improved personal best → decrement old bucket, increment new bucket.
 *     • Didn't improve → no bucket change.
 */
export async function submitScore({
  dateStr,
  currentScore,
  sequence,
  cheatedAt,
}) {
  try {
    const ref = dateDocRef(dateStr);

    // Personal best tracking (localStorage)
    const pbKey      = `collatz-pb-${dateStr}`;
    const countedKey = `collatz-counted-${dateStr}`;
    const prevBest   = parseInt(localStorage.getItem(pbKey) || '0', 10) || 0;
    const isNewPB    = currentScore > prevBest;
    const alreadyCounted = localStorage.getItem(countedKey) === 'true';

    // Only hit Firestore if something changed
    const needsWrite = !alreadyCounted || isNewPB;
    if (!needsWrite) return;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      const data = snap.exists() ? snap.data() : {
        globalHighScore: 0,
        globalHighSequence: [],
        globalHighCheatedAt: [],
        totalPlayers: 0,
      };

      const updates = { ...data };

      // ── Global high score ──
      if (currentScore > (data.globalHighScore || 0)) {
        updates.globalHighScore    = currentScore;
        updates.globalHighSequence = sequence;
        updates.globalHighCheatedAt = cheatedAt;
      }

      // ── Player count ──
      if (!alreadyCounted) {
        updates.totalPlayers = (data.totalPlayers || 0) + 1;
      }

      // ── Score distribution ──
      if (!alreadyCounted) {
        // First play today — add to this score's bucket
        const key = bucketKey(currentScore);
        updates[key] = (data[key] || 0) + 1;
      } else if (isNewPB) {
        // Improved personal best — move from old bucket to new bucket
        const oldKey = bucketKey(prevBest);
        const newKey = bucketKey(currentScore);
        if (oldKey !== newKey) {
          updates[oldKey] = Math.max(0, (data[oldKey] || 0) - 1);
          updates[newKey] = (data[newKey] || 0) + 1;
        }
        // If same bucket (e.g. both in 1001-1500), no change needed
      }

      transaction.set(ref, updates);
    });

    // Update localStorage after successful write
    if (isNewPB) {
      localStorage.setItem(pbKey, String(currentScore));
    }
    if (!alreadyCounted) {
      localStorage.setItem(countedKey, 'true');
      // Also set pb on first play
      if (!prevBest) localStorage.setItem(pbKey, String(currentScore));
    }

  } catch (e) {
    console.error('submitScore error:', e);
  }
}
