import { assertEqual, assertTrue } from "./harness.js";
import { playBeep } from "../js/sound.js";

export function register({ suite, test }) {
  suite("sound: bip de fin", () => {
    test("monte puis redescend progressivement avant de s'arrêter", () => {
      const originalContext = window.AudioContext;
      const created = [];

      class FakeAudioContext {
        constructor() {
          this.currentTime = 10;
          this.destination = {};
          created.push(this);
        }

        createOscillator() {
          this.oscillator = {
            frequency: {},
            connect() {},
            start: (time) => { this.startedAt = time; },
            stop: (time) => { this.stoppedAt = time; },
          };
          return this.oscillator;
        }

        createGain() {
          this.gain = {
            gain: {
              events: [],
              setValueAtTime(value, time) { this.events.push(["set", value, time]); },
              linearRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); },
            },
            connect() {},
          };
          return this.gain;
        }
      }

      window.AudioContext = FakeAudioContext;
      playBeep(true);
      window.AudioContext = originalContext;

      const audio = created[0];
      assertEqual(audio.oscillator.type, "sine");
      assertEqual(audio.gain.gain.events[0], ["set", 0, 10]);
      assertTrue(audio.gain.gain.events.some(([kind, value]) => kind === "ramp" && value > 0));
      assertEqual(audio.gain.gain.events.at(-1)[1], 0);
      assertEqual(audio.stoppedAt, audio.gain.gain.events.at(-1)[2]);
    });
  });
}
