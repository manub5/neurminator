export const SETTINGS_KEY = "cog.settings";
export const GAMES_KEY = "cog.games";
export const HISTORY_KEY = "cog.history";

const SETTINGS_VERSION = 1;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to write ${key}`, err);
  }
}

export function getSettings() {
  const existing = read(SETTINGS_KEY, null);
  if (existing && typeof existing === "object") return existing;
  const defaults = {
    version: SETTINGS_VERSION,
    theme: "auto",
    soundEnabled: true,
    createdAt: new Date().toISOString(),
  };
  write(SETTINGS_KEY, defaults);
  return defaults;
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings);
}

export function getGames() {
  return read(GAMES_KEY, {});
}

export function saveGames(games) {
  write(GAMES_KEY, games);
}

export function getHistory() {
  return read(HISTORY_KEY, []);
}

export function addHistoryEntry(entry) {
  const history = getHistory();
  history.push(entry);
  write(HISTORY_KEY, history);
}

export function clearHistory() {
  write(HISTORY_KEY, []);
}

export function makeId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
