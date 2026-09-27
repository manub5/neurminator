import { assertEqual, assertTrue } from "./harness.js";
import { pairsForLevel, gridDims, buildDeck } from "../js/games/pairs.js";

function cyclicRng(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

export function register({ suite, test }) {
  suite("pairs: pairsForLevel", () => {
    test("progresse de 4 à 12 paires", () => {
      assertEqual(pairsForLevel(1), 4);
      assertEqual(pairsForLevel(2), 6);
      assertEqual(pairsForLevel(3), 8);
      assertEqual(pairsForLevel(4), 10);
      assertEqual(pairsForLevel(5), 12);
    });
    test("plafonne à 12 paires au-delà du niveau 5", () => {
      assertEqual(pairsForLevel(9), 12);
    });
  });

  suite("pairs: gridDims", () => {
    test("8 cartes tiennent sur 4 colonnes", () => {
      assertEqual(gridDims(4), { cols: 4, rows: 2 });
    });
    test("24 cartes tiennent sur 6 colonnes", () => {
      assertEqual(gridDims(12), { cols: 6, rows: 4 });
    });
  });

  suite("pairs: buildDeck", () => {
    test("produit deux fois chaque symbole", () => {
      const deck = buildDeck(4, { rng: cyclicRng([0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4]) });
      assertEqual(deck.length, 8);
      const counts = {};
      for (const s of deck) counts[s] = (counts[s] || 0) + 1;
      assertEqual(Object.keys(counts).length, 4);
      assertTrue(Object.values(counts).every((c) => c === 2), "chaque symbole doit apparaître deux fois");
    });
  });
}
