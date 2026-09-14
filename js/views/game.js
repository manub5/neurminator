import { getGame } from "../games/index.js";
import * as span from "../games/span.js";
import { normalize } from "../core/scoring.js";
import { nextLevel } from "../core/difficulty.js";
import {
  getGames,
  saveGames,
  getHistory,
  addHistoryEntry,
  makeId,
} from "../storage/local.js";

export const meta = { title: "Jeu", nav: false, hideHeader: true };

const MODULES = { span };

export function render(container, params = {}) {
  const game = getGame(params.id);
  const mod = MODULES[params.id];

  if (!game || !mod) {
    container.textContent = "Jeu inconnu.";
    return;
  }

  const progress = getGames();
  const state = progress[game.id] || { level: 1, attempts: 0, bestScore: null };
  const level = state.level;
  const startedAt = Date.now();

  mod.prepare(level, {
    container,
    onFinish(raw) {
      const { score } = normalize(game.id, raw);
      const durationMs = Date.now() - startedAt;

      addHistoryEntry({
        id: makeId(),
        game: game.id,
        date: new Date().toISOString(),
        level,
        score,
        raw,
        durationMs,
      });

      const history = getHistory();
      const recent = history
        .filter((h) => h.game === game.id)
        .map((h) => h.score);
      const newLevel = nextLevel(game.id, level, recent);

      const isBest =
        state.bestScore == null ||
        (game.higherIsBetter ? score > state.bestScore : score < state.bestScore);
      const bestScore = isBest ? score : state.bestScore;

      saveGames({
        ...progress,
        [game.id]: { level: newLevel, attempts: state.attempts + 1, bestScore },
      });

      showResult(container, { game, score, isBest, bestScore, newLevel, params });
    },
  });
}

function showResult(container, { game, score, isBest, bestScore, newLevel, params }) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card result-card";

  const title = document.createElement("h2");
  title.textContent = isBest ? "Nouveau record !" : "Bien joué";

  const value = document.createElement("p");
  value.className = "result-value";
  value.textContent = `${score}${game.unit}`;

  const record = document.createElement("p");
  record.className = "game-card__meta";
  record.textContent = `Record : ${bestScore}${game.unit}`;

  const next = document.createElement("p");
  next.className = "game-card__meta";
  next.textContent = `Prochain niveau : ${newLevel}`;

  const actions = document.createElement("div");
  actions.className = "span-actions";

  const replay = document.createElement("button");
  replay.type = "button";
  replay.textContent = "Rejouer";
  replay.addEventListener("click", () => params.navigate("game", { id: game.id }));

  const home = document.createElement("button");
  home.type = "button";
  home.textContent = "Accueil";
  home.addEventListener("click", () => params.navigate("home"));

  actions.append(replay, home);
  card.append(title, value, record, next, actions);
  container.appendChild(card);
}
