import { assertEqual } from "./harness.js";
import * as history from "../js/core/history.js";

const mk = (game, score, date) => ({ game, score, date });

export function register({ suite, test }) {
  suite("history: groupByDay", () => {
    test("groupe par jour, plus récent d'abord", () => {
      const h = [
        mk("span", 3, "2026-09-13T10:00:00Z"),
        mk("span", 4, "2026-09-14T09:00:00Z"),
        mk("span", 5, "2026-09-14T11:00:00Z"),
      ];
      const g = history.groupByDay(h);
      assertEqual(g.length, 2);
      assertEqual(g[0].day, "2026-09-14");
      assertEqual(g[0].entries.length, 2);
      assertEqual(g[0].entries[0].score, 5);
      assertEqual(g[1].day, "2026-09-13");
    });

    test("historique vide", () => {
      assertEqual(history.groupByDay([]), []);
    });
  });

  suite("history: seriesForGame", () => {
    test("scores du jeu, ancien → récent", () => {
      const h = [
        mk("span", 3, "2026-09-14T08:00:00Z"),
        mk("nback", 0.5, "2026-09-14T09:00:00Z"),
        mk("span", 4, "2026-09-14T10:00:00Z"),
      ];
      assertEqual(history.seriesForGame(h, "span"), [3, 4]);
      assertEqual(history.seriesForGame(h, "nback"), [0.5]);
    });
  });

  suite("history: trendForGame", () => {
    const make6 = (scores) =>
      scores.map((s, i) => mk("span", s, `2026-09-14T0${i}:00:00Z`));

    test("moins de 6 parties → null", () => {
      assertEqual(history.trendForGame(make6([3, 3, 3]), "span", true), null);
    });

    test("progression → up", () => {
      const h = make6([1, 1, 1, 5, 5, 5]);
      assertEqual(history.trendForGame(h, "span", true), "up");
    });

    test("régression → down", () => {
      const h = make6([5, 5, 5, 1, 1, 1]);
      assertEqual(history.trendForGame(h, "span", true), "down");
    });

    test("stable → flat", () => {
      const h = make6([3, 3, 3, 3, 3, 3]);
      assertEqual(history.trendForGame(h, "span", true), "flat");
    });

    test("reaction (plus bas mieux) : temps qui baissent → up", () => {
      const h = [500, 500, 500, 300, 300, 300].map((s, i) =>
        mk("reaction", s, `2026-09-14T0${i}:00:00Z`)
      );
      assertEqual(history.trendForGame(h, "reaction", false), "up");
    });
  });
}
