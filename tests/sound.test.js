import { assertEqual, assertTrue } from "./harness.js";
import {
  playBeep,
  playClick,
  playTouch,
  playLevelUp,
  playVictory,
  playNotice,
  _resetAudioContextForTests,
} from "../js/sound.js";

class FakeAudioContext {
  constructor() {
    this.currentTime = 10;
    this.destination = {};
    this.oscillators = [];
  }

  createOscillator() {
    const osc = {
      frequency: {},
      connect() {},
      start: (time) => { osc.startedAt = time; },
      stop: (time) => { osc.stoppedAt = time; },
    };
    this.oscillators.push(osc);
    this.lastOscillator = osc;
    return osc;
  }

  createGain() {
    const gain = {
      gain: {
        events: [],
        setValueAtTime(value, time) { this.events.push(["set", value, time]); },
        linearRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); },
      },
      connect() {},
    };
    this.lastOscillator.gain = gain;
    return gain;
  }
}

function withFakeAudio(fn) {
  const originalContext = window.AudioContext;
  const created = [];
  class TrackedContext extends FakeAudioContext {
    constructor() {
      super();
      created.push(this);
    }
  }
  window.AudioContext = TrackedContext;
  _resetAudioContextForTests();
  try {
    fn();
  } finally {
    window.AudioContext = originalContext;
  }
  return created[0];
}

export function register({ suite, test }) {
  suite("sound: bip de fin", () => {
    test("monte puis redescend progressivement avant de s'arrêter", () => {
      const audio = withFakeAudio(() => playBeep(true));
      const osc = audio.oscillators[0];
      assertEqual(osc.type, "sine");
      assertEqual(osc.gain.gain.events[0], ["set", 0, 10]);
      assertTrue(osc.gain.gain.events.some(([kind, value]) => kind === "ramp" && value > 0));
      assertEqual(osc.gain.gain.events.at(-1)[1], 0);
      assertEqual(osc.stoppedAt, osc.gain.gain.events.at(-1)[2]);
    });

    test("désactivé, ne crée aucun contexte audio", () => {
      const audio = withFakeAudio(() => playBeep(false));
      assertEqual(audio, undefined);
    });
  });

  suite("sound: sons doux d'interface", () => {
    test("playClick joue un seul ton court", () => {
      const audio = withFakeAudio(() => playClick(true));
      assertEqual(audio.oscillators.length, 1);
    });

    test("playTouch varie la note selon l'index", () => {
      const a = withFakeAudio(() => playTouch(true, 0));
      const b = withFakeAudio(() => playTouch(true, 1));
      assertTrue(a.oscillators[0].frequency.value !== b.oscillators[0].frequency.value);
    });

    test("playLevelUp joue un petit arpège de plusieurs notes", () => {
      const audio = withFakeAudio(() => playLevelUp(true));
      assertTrue(audio.oscillators.length >= 3);
    });

    test("playVictory joue un carillon de plusieurs notes", () => {
      const audio = withFakeAudio(() => playVictory(true));
      assertTrue(audio.oscillators.length >= 3);
    });

    test("playNotice joue deux notes neutres", () => {
      const audio = withFakeAudio(() => playNotice(true));
      assertEqual(audio.oscillators.length, 2);
    });

    test("désactivés, aucun son ne joue", () => {
      assertEqual(withFakeAudio(() => playClick(false)), undefined);
      assertEqual(withFakeAudio(() => playTouch(false, 2)), undefined);
      assertEqual(withFakeAudio(() => playLevelUp(false)), undefined);
      assertEqual(withFakeAudio(() => playVictory(false)), undefined);
      assertEqual(withFakeAudio(() => playNotice(false)), undefined);
    });
  });
}
