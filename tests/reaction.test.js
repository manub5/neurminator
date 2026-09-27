import { assertEqual } from "./harness.js";
import { modeForLevel, windowForLevel, encouragementFor } from "../js/games/reaction.js";

export function register({ suite, test }) {
  suite("reaction: modeForLevel", () => {
    test("niveau 1 → une seule balle", () => {
      assertEqual(modeForLevel(1), 1);
    });
    test("niveau 2 → deux balles", () => {
      assertEqual(modeForLevel(2), 2);
    });
    test("niveau 3 et plus → quatre balles", () => {
      assertEqual(modeForLevel(3), 4);
      assertEqual(modeForLevel(9), 4);
    });
  });

  suite("reaction: windowForLevel", () => {
    test("niveau 1 → fenêtre de base", () => {
      assertEqual(windowForLevel(1), 2.0);
    });
    test("la fenêtre se resserre avec le niveau", () => {
      assertEqual(windowForLevel(3) < windowForLevel(1), true);
    });
    test("la fenêtre ne descend jamais sous le plancher", () => {
      assertEqual(windowForLevel(50), 0.9);
    });
  });

  suite("reaction: encouragementFor", () => {
    test("aucun message hors des paliers", () => {
      assertEqual(encouragementFor(1), null);
      assertEqual(encouragementFor(4), null);
    });
    test("un message aux paliers de série", () => {
      assertEqual(encouragementFor(3), "Bien joué !");
      assertEqual(encouragementFor(5), "Beau rythme !");
      assertEqual(encouragementFor(8), "Excellent !");
      assertEqual(encouragementFor(12), "Implacable !");
    });
    test("un message récurrent au-delà de 12, tous les 4", () => {
      assertEqual(encouragementFor(16), "Extraordinaire !");
      assertEqual(encouragementFor(18), null);
      assertEqual(encouragementFor(20), "Extraordinaire !");
    });
  });
}
