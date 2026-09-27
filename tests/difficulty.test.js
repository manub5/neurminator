import { assertEqual } from "./harness.js";
import * as difficulty from "../js/core/difficulty.js";

export function register({ suite, test }) {
  suite("difficulty: garde-fous", () => {
    test("ne change pas le niveau avec moins de 2 scores", () => {
      assertEqual(difficulty.nextLevel("span", 3, []), 3);
      assertEqual(difficulty.nextLevel("span", 3, [5]), 3);
    });

    test("plancher à 1", () => {
      assertEqual(difficulty.nextLevel("span", 1, [0, 0, 0]), 1);
    });

    test("pas de saut de plus d'un niveau", () => {
      assertEqual(difficulty.nextLevel("span", 3, [9, 9, 9]), 4);
    });
  });

  suite("difficulty: seuils discrets span", () => {
    test("plafond span à 12", () => {
      assertEqual(difficulty.nextLevel("span", 12, [12, 12, 12]), 12);
    });

    test("2 réussites sur 3 → montée", () => {
      assertEqual(difficulty.nextLevel("span", 3, [3, 3, 2]), 4);
    });

    test("3 réussites sur 3 → montée (+1 seulement)", () => {
      assertEqual(difficulty.nextLevel("span", 3, [4, 4, 4]), 4);
    });

    test("1 réussite sur 3 → descente", () => {
      assertEqual(difficulty.nextLevel("span", 3, [3, 2, 2]), 2);
    });

    test("0 réussite sur 3 → descente", () => {
      assertEqual(difficulty.nextLevel("span", 3, [2, 2, 1]), 2);
    });

    test("mixte 2 réussites et 1 échec → montée", () => {
      assertEqual(difficulty.nextLevel("span", 4, [4, 3, 4]), 5);
    });
  });

  suite("difficulty: nback", () => {
    test("3 scores ≥ 0.85 → montée", () => {
      assertEqual(difficulty.nextLevel("nback", 2, [0.9, 0.9, 0.9]), 3);
    });
    test("3 scores faibles → descente plafonnée au plancher 2", () => {
      assertEqual(difficulty.nextLevel("nback", 2, [0.5, 0.5, 0.5]), 2);
    });
    test("3 scores faibles à un niveau supérieur → descente d'un cran", () => {
      assertEqual(difficulty.nextLevel("nback", 3, [0.5, 0.5, 0.5]), 2);
    });
    test("plafond nback à 5", () => {
      assertEqual(difficulty.nextLevel("nback", 5, [0.99, 0.99]), 5);
    });
  });

  suite("difficulty: stroop", () => {
    test("3 scores ≥ 0.85 → montée", () => {
      assertEqual(difficulty.nextLevel("stroop", 1, [0.9, 0.9, 0.9]), 2);
    });
  });

  suite("difficulty: reaction", () => {
    test("temps sous le seuil → montée", () => {
      assertEqual(difficulty.nextLevel("reaction", 1, [400, 420, 430]), 2);
    });
    test("temps au-dessus du seuil → descente", () => {
      assertEqual(difficulty.nextLevel("reaction", 3, [600, 620, 610]), 2);
    });
    test("score 0 (aucun correct) → descente", () => {
      assertEqual(difficulty.nextLevel("reaction", 2, [0, 0, 0]), 1);
    });
  });

  suite("difficulty: pairs", () => {
    test("3 scores ≥ 0.75 → montée", () => {
      assertEqual(difficulty.nextLevel("pairs", 1, [0.8, 0.9, 1]), 2);
    });
    test("plafond pairs à 5", () => {
      assertEqual(difficulty.nextLevel("pairs", 5, [1, 1, 1]), 5);
    });
  });

  suite("difficulty: gonogo", () => {
    test("3 scores ≥ 0.85 → montée", () => {
      assertEqual(difficulty.nextLevel("gonogo", 1, [0.9, 0.9, 0.9]), 2);
    });
    test("3 scores faibles → descente plafonnée au plancher 1", () => {
      assertEqual(difficulty.nextLevel("gonogo", 2, [0.4, 0.4, 0.4]), 1);
    });
    test("plafond gonogo à 9 (la difficulté n'évolue plus au-delà)", () => {
      assertEqual(difficulty.nextLevel("gonogo", 9, [0.99, 0.99]), 9);
    });
  });
}
