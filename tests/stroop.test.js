import { assertEqual, assertTrue } from "./harness.js";
import {
  buildTrial,
  ruleForTrial,
  targetIdFor,
  burstSizeForLevel,
  incongruentRatioForLevel,
  colorCount,
} from "../js/games/stroop.js";

export function register({ suite, test }) {
  suite("stroop: buildTrial", () => {
    test("un essai congruent a le même mot et la même encre", () => {
      for (let i = 0; i < 20; i++) {
        const trial = buildTrial(false);
        assertEqual(trial.wordColorId, trial.ink.id);
        assertEqual(trial.incongruent, false);
      }
    });

    test("un essai incongruent a un mot et une encre différents", () => {
      for (let i = 0; i < 20; i++) {
        const trial = buildTrial(true);
        assertTrue(trial.wordColorId !== trial.ink.id, "mot identique à l'encre");
        assertEqual(trial.incongruent, true);
      }
    });
  });

  suite("stroop: ruleForTrial", () => {
    test("alterne encre/mot toutes les 6 réponses", () => {
      assertEqual(ruleForTrial(0), "ink");
      assertEqual(ruleForTrial(5), "ink");
      assertEqual(ruleForTrial(6), "word");
      assertEqual(ruleForTrial(11), "word");
      assertEqual(ruleForTrial(12), "ink");
      assertEqual(ruleForTrial(18), "word");
    });
  });

  suite("stroop: targetIdFor", () => {
    test("règle encre → id de l'encre", () => {
      const trial = { wordColorId: "rouge", ink: { id: "bleu" } };
      assertEqual(targetIdFor(trial, "ink"), "bleu");
    });
    test("règle mot → id du mot", () => {
      const trial = { wordColorId: "rouge", ink: { id: "bleu" } };
      assertEqual(targetIdFor(trial, "word"), "rouge");
    });
  });

  suite("stroop: burstSizeForLevel", () => {
    test("niveau 1 → réponses une par une", () => {
      assertEqual(burstSizeForLevel(1), 1);
    });
    test("niveau 2 → séries de deux", () => {
      assertEqual(burstSizeForLevel(2), 2);
    });
    test("niveau 3 et plus → séries de trois", () => {
      assertEqual(burstSizeForLevel(3), 3);
      assertEqual(burstSizeForLevel(9), 3);
    });
  });

  suite("stroop: divers", () => {
    test("6 couleurs disponibles", () => {
      assertEqual(colorCount(), 6);
    });
    test("le ratio d'incongruence augmente avec le niveau", () => {
      assertTrue(incongruentRatioForLevel(4) > incongruentRatioForLevel(1));
    });
  });
}
