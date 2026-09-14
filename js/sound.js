let context = null;

export function playBeep(enabled) {
  if (!enabled) return;
  try {
    context = context || new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.value = 660;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.12);
  } catch (err) {
    console.warn("Sound failed", err);
  }
}
