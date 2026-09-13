import { assertEqual, assertTrue } from "./harness.js";
import * as storage from "../js/storage/local.js";

export function register({ suite, test }) {
  suite("storage: settings", () => {
    test("getSettings crée des défauts si absent", () => {
      localStorage.clear();
      const s = storage.getSettings();
      assertEqual(s.version, 1);
      assertEqual(s.theme, "auto");
      assertEqual(s.soundEnabled, true);
      assertTrue(typeof s.createdAt === "string");
    });

    test("saveSettings puis getSettings conserve les valeurs", () => {
      localStorage.clear();
      const s = storage.getSettings();
      s.theme = "light";
      storage.saveSettings(s);
      assertEqual(storage.getSettings().theme, "light");
    });
  });

  suite("storage: games", () => {
    test("getGames renvoie un objet vide si absent", () => {
      localStorage.clear();
      assertEqual(storage.getGames(), {});
    });

    test("saveGames puis getGames conserve les niveaux", () => {
      localStorage.clear();
      storage.saveGames({ nback: { level: 2, attempts: 1, bestScore: 0.8 } });
      assertEqual(storage.getGames().nback.level, 2);
    });
  });

  suite("storage: history", () => {
    test("getHistory renvoie un tableau vide si absent", () => {
      localStorage.clear();
      assertEqual(storage.getHistory(), []);
    });

    test("addHistoryEntry ajoute en fin de tableau", () => {
      localStorage.clear();
      storage.addHistoryEntry({ id: "a", game: "nback", score: 0.5 });
      storage.addHistoryEntry({ id: "b", game: "span", score: 4 });
      const h = storage.getHistory();
      assertEqual(h.length, 2);
      assertEqual(h[1].game, "span");
    });

    test("clearHistory vide l'historique", () => {
      localStorage.clear();
      storage.addHistoryEntry({ id: "a", game: "nback" });
      storage.clearHistory();
      assertEqual(storage.getHistory(), []);
    });
  });

  suite("storage: ids", () => {
    test("makeId génère des identifiants uniques", () => {
      const a = storage.makeId();
      const b = storage.makeId();
      assertTrue(a !== b, "ids différents");
    });
  });
}
