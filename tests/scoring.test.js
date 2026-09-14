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
}
