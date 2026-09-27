import { GAMES, formatScore, displayName } from "../games/index.js";
import { getGames, getSettings } from "../storage/local.js";
import { playClick } from "../sound.js";
import { minLevelFor } from "../core/difficulty.js";

export const meta = { title: "Accueil", nav: true };

export function render(container, params = {}) {
  const progress = getGames();

  for (const game of GAMES) {
    const state = progress[game.id] || { level: game.startLevel ?? 1, attempts: 0, bestScore: null };
    const level = Math.max(state.level, minLevelFor(game.id));
    const card = document.createElement("button");
    card.className = "game-card";
    card.type = "button";

    const name = document.createElement("p");
    name.className = "game-card__name";
    name.textContent = displayName(game);

    const meta = document.createElement("p");
    meta.className = "game-card__meta";
    const best = state.bestScore == null
      ? "aucun score"
      : `record ${formatScore(game, state.bestScore)}`;
    meta.textContent = `Niveau ${level} · ${best} · ${state.attempts} partie(s)`;

    card.append(name, meta);
    card.addEventListener("click", () => {
      playClick(getSettings().soundEnabled);
      params.navigate("game", { id: game.id });
    });
    container.appendChild(card);
  }
}
