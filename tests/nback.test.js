import { assertEqual, assertTrue } from "./harness.js";
import { buildSequence } from "../js/games/nback.js";

export function register({ suite, test }) {
  suite("nback: buildSequence", () => {
    test("produit n + judgedTrials lettres", () => {
      const { seq } = buildSequence(2, 20, 0.3);
      assertEqual(seq.length, 22);
    });

    test("les drapeaux de cible correspondent à seq[index] === seq[index-n]", () => {
      for (let run = 0; run < 20; run++) {
        const n = 2;
        const judged = 20;
        const { seq, targetFlags } = buildSequence(n, judged, 0.3);
        assertEqual(targetFlags.length, judged);
        for (let j = 0; j < judged; j++) {
          const index = n + j;
          const expected = seq[index] === seq[index - n];
          assertEqual(targetFlags[j], expected, `incohérence à l'essai jugé ${j}`);
        }
      }
    });

    test("aucun drapeau de cible avant les n premières lettres", () => {
      const { seq, targetFlags } = buildSequence(3, 10, 0.5);
      assertEqual(seq.length, 13);
      assertEqual(targetFlags.length, 10);
    });

    test("une lettre non cible ne répète pas la lettre d'il y a n", () => {
      const n = 2;
      const { seq, targetFlags } = buildSequence(n, 30, 0.5);
      targetFlags.forEach((flag, j) => {
        const index = n + j;
        if (!flag) {
          assertTrue(seq[index] !== seq[index - n], `répétition inattendue à ${index}`);
        }
      });
    });
  });
}
