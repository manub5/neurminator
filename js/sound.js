let context = null;

function getContext() {
  context = context || new (window.AudioContext || window.webkitAudioContext)();
  return context;
}

// Exposé uniquement pour les tests (chaque test veut son propre faux contexte).
export function _resetAudioContextForTests() {
  context = null;
}

// Single soft tone with a short fade-in/fade-out envelope, so nothing on
// smartphone speakers ever pops or clicks.
function tone(freq, { duration = 0.18, peak = 0.03, type = "sine", delay = 0 } = {}) {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = ctx.currentTime + delay;
  const end = start + duration;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peak, start + Math.min(0.02, duration / 3));
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end);
}

function safePlay(fn) {
  try {
    fn();
  } catch (err) {
    console.warn("Sound failed", err);
  }
}

// Fin de partie.
export function playBeep(enabled) {
  if (!enabled) return;
  safePlay(() => tone(520, { duration: 0.18, peak: 0.03 }));
}

// Sélection dans les menus / navigation / choix d'un jeu.
export function playClick(enabled) {
  if (!enabled) return;
  safePlay(() => tone(720, { duration: 0.05, peak: 0.018 }));
}

// Pentatonique douce pour les cases du span de mémoire (une note par case).
const TOUCH_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51];

export function playTouch(enabled, index = 0) {
  if (!enabled) return;
  const freq = TOUCH_NOTES[index % TOUCH_NOTES.length];
  safePlay(() => tone(freq, { duration: 0.12, peak: 0.025 }));
}

// Petit arpège ascendant : passage de palier.
export function playLevelUp(enabled) {
  if (!enabled) return;
  safePlay(() => {
    tone(523.25, { duration: 0.14, peak: 0.03, delay: 0 });
    tone(659.25, { duration: 0.16, peak: 0.032, delay: 0.11 });
    tone(783.99, { duration: 0.22, peak: 0.032, delay: 0.22 });
  });
}

// Deux notes neutres et douces : signale un changement important (ex. règle
// du Stroop) sans les connotations positives de playLevelUp/playVictory.
export function playNotice(enabled) {
  if (!enabled) return;
  safePlay(() => {
    tone(660, { duration: 0.1, peak: 0.022, delay: 0 });
    tone(494, { duration: 0.16, peak: 0.022, delay: 0.09 });
  });
}

// Carillon plus riche : nouveau record.
export function playVictory(enabled) {
  if (!enabled) return;
  safePlay(() => {
    tone(523.25, { duration: 0.14, peak: 0.032, type: "triangle", delay: 0 });
    tone(659.25, { duration: 0.14, peak: 0.032, type: "triangle", delay: 0.1 });
    tone(783.99, { duration: 0.14, peak: 0.032, type: "triangle", delay: 0.2 });
    tone(1046.5, { duration: 0.3, peak: 0.035, type: "triangle", delay: 0.3 });
  });
}
