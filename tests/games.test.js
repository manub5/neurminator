import { assertEqual } from "./harness.js";
import { formatScore, getGame } from "../js/games/index.js";

export function register({ suite, test }) {
  suite("games: affichage des scores", () => {
    test("affiche les ratios n-back et stroop comme pourcentages", () => {
      assertEqual(formatScore(getGame("nback"), 0.75), "75%");
      assertEqual(formatScore(getGame("stroop"), 1), "100%");
    });

    test("affiche les ratios paires et go/no-go comme pourcentages", () => {
      assertEqual(formatScore(getGame("pairs"), 0.5), "50%");
      assertEqual(formatScore(getGame("gonogo"), 0.9), "90%");
    });

    test("conserve les unités des autres jeux", () => {
      assertEqual(formatScore(getGame("span"), 5), "5");
      assertEqual(formatScore(getGame("reaction"), 412), "412ms");
    });
  });
}
