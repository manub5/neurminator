import { assertEqual } from "./harness.js";
import * as scoring from "../js/core/scoring.js";

export function register({ suite, test }) {
  suite("scoring: span", () => {
    test("normalize extrait maxSpan et higherIsBetter", () => {
      const r = scoring.normalize("span", { maxSpan: 5 });
      assertEqual(r.score, 5);
      assertEqual(r.higherIsBetter, true);
    });

    test("normalize gère maxSpan 0", () => {
      const r = scoring.normalize("span", { maxSpan: 0 });
      assertEqual(r.score, 0);
    });

    test("normalize lève une erreur pour un jeu inconnu", () => {
      let threw = false;
      try { scoring.normalize("inconnu", {}); } catch { threw = true; }
      assertEqual(threw, true);
    });
  });

  suite("scoring: nback/stroop/reaction", () => {
    test("nback = correct/total", () => {
      const r = scoring.normalize("nback", { correct: 8, total: 10 });
      assertEqual(r.score, 0.8);
      assertEqual(r.higherIsBetter, true);
    });

    test("stroop = correct/total", () => {
      const r = scoring.normalize("stroop", { correct: 18, total: 24 });
      assertEqual(r.score, 0.75);
      assertEqual(r.higherIsBetter, true);
    });

    test("reaction = avgRt, plus bas mieux", () => {
      const r = scoring.normalize("reaction", { avgRt: 412 });
      assertEqual(r.score, 412);
      assertEqual(r.higherIsBetter, false);
    });

    test("reaction avgRt null → score null (aucun essai correct)", () => {
      const r = scoring.normalize("reaction", { avgRt: null });
      assertEqual(r.score, null);
    });

    test("nback total 0 ne divise pas par zéro", () => {
      const r = scoring.normalize("nback", { correct: 0, total: 0 });
      assertEqual(r.score, 0);
    });
  });

  suite("scoring: pairs/gonogo", () => {
    test("pairs = matches/attempts", () => {
      const r = scoring.normalize("pairs", { pairs: 4, attempts: 5, matches: 4 });
      assertEqual(r.score, 0.8);
      assertEqual(r.higherIsBetter, true);
    });

    test("pairs attempts 0 ne divise pas par zéro", () => {
      const r = scoring.normalize("pairs", { pairs: 0, attempts: 0, matches: 0 });
      assertEqual(r.score, 0);
    });

    test("gonogo = correct/total", () => {
      const r = scoring.normalize("gonogo", { correct: 20, total: 25 });
      assertEqual(r.score, 0.8);
      assertEqual(r.higherIsBetter, true);
    });
  });
}
