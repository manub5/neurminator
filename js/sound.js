let context = null;

export function playBeep(enabled) {
  if (!enabled) return;
  try {
    context = context || new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = 520;
    const start = context.currentTime;
    const end = start + 0.18;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.03, start + 0.02);
    gain.gain.linearRampToValueAtTime(0, end);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(start);
    osc.stop(end);
  } catch (err) {
    console.warn("Sound failed", err);
  }
}
