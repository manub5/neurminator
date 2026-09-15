import { assertEqual } from "./harness.js";
import { randomSequence, isSequenceCorrect, GRID_SIZE } from "../js/core/sequence.js";

function cyclicRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

export function register({ suite, test }) {
  suite("sequence: randomSequence", () => {
    test("produit la longueur demandée", () => {
      const seq = randomSequence(5, { rng: cyclicRng([0.1, 0.3, 0.5, 0.7, 0.9, 0.2]) });
      assertEqual(seq.length, 5);
    });

    test("ne répète jamais deux cases identiques consécutives", () => {
      const seq = randomSequence(8, {
        rng: cyclicRng([0.1, 0.6, 0.1, 0.3, 0.6, 0.9, 0.1, 0.2]),
      });
      for (let i = 1; i < seq.length; i++) {
        assertEqual(seq[i] === seq[i - 1], false, `répétition à l'index ${i}`);
      }
    });

    test("respecte maxLength", () => {
      const seq = randomSequence(20, {
        maxLength: 6,
        rng: cyclicRng([0.1, 0.3, 0.5, 0.7, 0.9, 0.2, 0.4, 0.6]),
      });
      assertEqual(seq.length, 6);
    });

    test("les valeurs restent dans la grille", () => {
      const seq = randomSequence(10, {
        rng: cyclicRng([0.0, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88, 0.99]),
      });
      seq.forEach((v) => {
        assertEqual(v >= 0 && v < GRID_SIZE, true);
      });
    });

    test("ne boucle pas à l'infini avec un rng constant", () => {
      const seq = randomSequence(10, { rng: () => 0.99 });
      assertEqual(seq.length, 10);
      for (let i = 1; i < seq.length; i++) {
        assertEqual(seq[i] === seq[i - 1], false);
      }
    });

    test("gère une grille de taille 1 sans boucler", () => {
      const seq = randomSequence(4, { size: 1, rng: () => 0.5 });
      assertEqual(seq, [0, 0, 0, 0]);
    });
  });

  suite("sequence: isSequenceCorrect", () => {
    test("vrai si la réponse est identique", () => {
      assertEqual(isSequenceCorrect([1, 2, 3], [1, 2, 3]), true);
    });
    test("faux si un élément diffère", () => {
      assertEqual(isSequenceCorrect([1, 2, 3], [1, 2, 4]), false);
    });
    test("faux si la longueur diffère", () => {
      assertEqual(isSequenceCorrect([1, 2, 3], [1, 2]), false);
    });
  });
}
