import { assertEqual, assertTrue } from "./harness.js";
import { noGoRatioForLevel, stimulusDurationForLevel } from "../js/games/gonogo.js";

export function register({ suite, test }) {
  suite("gonogo: noGoRatioForLevel", () => {
    test("augmente avec le niveau", () => {
      assertTrue(noGoRatioForLevel(3) > noGoRatioForLevel(1));
    });
    test("plafonne à 0.4", () => {
      assertEqual(noGoRatioForLevel(20), 0.4);
    });
    test("niveau 1 → 0.15", () => {
      assertEqual(noGoRatioForLevel(1), 0.15);
    });
  });

  suite("gonogo: stimulusDurationForLevel", () => {
    test("diminue avec le niveau", () => {
      assertTrue(stimulusDurationForLevel(3) < stimulusDurationForLevel(1));
    });
    test("ne descend jamais sous 0.5s", () => {
      assertEqual(stimulusDurationForLevel(20), 0.5);
    });
  });
}
