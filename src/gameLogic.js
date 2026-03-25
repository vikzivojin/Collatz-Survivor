function seedFromDate(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function getStartingNumberForDate(dateStr) {
  const seed = seedFromDate(dateStr);
  const x = Math.floor(seededRandom(seed) * 201); // 0 to 200
  // 50% chance of 6x+1, 50% chance of 6x+5 (i.e. add +4)
  const offset = seededRandom(seed + 999) >= 0.5 ? 5 : 1;
  return 6 * x + offset;
}

// Returns all daily variables: starting number, initial cheats (2-4), recharge interval (30-50 in steps of 5)
export function getDailyParams(dateStr) {
  const seed = seedFromDate(dateStr);
  const x = Math.floor(seededRandom(seed) * 201);
  const offset = seededRandom(seed + 999) >= 0.5 ? 5 : 1;
  const startingNumber = 6 * x + offset;

  // initialCheats: 2, 3, 4, or 5
  const initialCheats = 2 + Math.floor(seededRandom(seed + 1111) * 4);

  // rechargeInterval: 40, 45, 50, ..., 100 (13 possible values)
  const rechargeInterval = 40 + Math.floor(seededRandom(seed + 2222) * 13) * 5;

  return { startingNumber, initialCheats, rechargeInterval };
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function collatzNext(n) {
  if (n % 2 === 1) return n * 3 + 1;
  return n / 2;
}

export function cheatNext(n) {
  return n * 3 + 1;
}

export function isEven(n) {
  return n % 2 === 0;
}

export const INITIAL_CHEATS = 5;
export const CHEAT_RECHARGE_INTERVAL = 30;
