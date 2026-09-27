import { formatScore, getGame, displayName } from "../games/index.js";
import * as span from "../games/span.js";
import * as nback from "../games/nback.js";
import * as stroop from "../games/stroop.js";
import * as reaction from "../games/reaction.js";
import * as pairs from "../games/pairs.js";
import * as gonogo from "../games/gonogo.js";
import { normalize } from "../core/scoring.js";
import { nextLevel, minLevelFor } from "../core/difficulty.js";
import { playBeep, playVictory, playLevelUp } from "../sound.js";
import { showOverlay } from "../ui/overlay.js";
import {
  getGames,
  saveGames,
  getHistory,
  addHistoryEntry,
  makeId,
  getSettings,
} from "../storage/local.js";

export const meta = { title: "Jeu", nav: false, hideHeader: true };

const MODULES = { span, nback, stroop, reaction, pairs, gonogo };

export function render(container, params = {}) {
  const game = getGame(params.id);
  const mod = MODULES[params.id];

  if (!game || !mod) {
    container.textContent = "Jeu inconnu.";
    return null;
  }

  const progress = getGames();
  const state = progress[game.id] || { level: game.startLevel ?? 1, attempts: 0, bestScore: null };
  const level = Math.max(state.level, minLevelFor(game.id));
  const startedAt = Date.now();

  let alive = true;
  let handle = null;

  function destroyGame() {
    if (handle && typeof handle.destroy === "function") {
      handle.destroy();
    }
    handle = null;
  }

  handle = mod.prepare(level, {
    container,
    onFinish(raw) {
      if (!alive) return;
      destroyGame();

      const { score } = normalize(game.id, raw);

      if (score == null) {
        showNoScore(container, { game, params });
        playBeep(getSettings().soundEnabled);
        return;
      }

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

      const soundEnabled = getSettings().soundEnabled;
      if (isBest) {
        playVictory(soundEnabled);
        showOverlay(container, {
          emoji: "🏆",
          title: "Nouveau record !",
          message:
            newLevel > level
              ? `${formatScore(game, score)} · palier ${newLevel} débloqué`
              : formatScore(game, score),
        });
      } else if (newLevel > level) {
        playLevelUp(soundEnabled);
        showOverlay(container, {
          emoji: "⬆️",
          title: `Palier ${newLevel} !`,
          message: "Belle progression, continuez comme ça.",
        });
      } else {
        playBeep(soundEnabled);
      }
    },
  });

  return {
    destroy() {
      alive = false;
      destroyGame();
    },
    onBack() {
      if (!handle || typeof handle.pause !== "function") return null;
      return handle.pause();
    },
  };
}

function showResult(container, { game, score, isBest, bestScore, newLevel, params }) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card result-card";

  const title = document.createElement("h2");
  title.textContent = isBest ? "🏆 Nouveau record !" : "👍 Bien joué";

  const subtitle = document.createElement("p");
  subtitle.className = "game-card__meta";
  subtitle.textContent = displayName(game);

  const value = document.createElement("p");
  value.className = "result-value";
  value.textContent = formatScore(game, score);

  const record = document.createElement("p");
  record.className = "game-card__meta";
  record.textContent = `Record : ${formatScore(game, bestScore)}`;

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
  card.append(title, subtitle, value, record, next, actions);
  container.appendChild(card);
}

function showNoScore(container, { game, params }) {
  container.innerHTML = "";

  const card = document.createElement("div");
  card.className = "card result-card";

  const title = document.createElement("h2");
  title.textContent = "⏱️ Pas de temps valide";

  const text = document.createElement("p");
  text.className = "game-card__meta";
  text.textContent = "Aucun essai correct : rien n'a été enregistré. Réessayez !";

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
  card.append(title, text, actions);
  container.appendChild(card);
}
