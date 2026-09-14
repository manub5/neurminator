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
}
