import { GAMES } from "../games/index.js";
import { getGames } from "../storage/local.js";

export const meta = { title: "Accueil", nav: true };

export function render(container, params = {}) {
  const progress = getGames();

  for (const game of GAMES) {
    const state = progress[game.id] || { level: 1, attempts: 0, bestScore: null };
    const card = document.createElement("button");
    card.className = "game-card";
    card.type = "button";

    const name = document.createElement("p");
    name.className = "game-card__name";
    name.textContent = game.name;

    const meta = document.createElement("p");
    meta.className = "game-card__meta";
    const best = state.bestScore == null
      ? "aucun score"
      : `record ${state.bestScore}${game.unit}`;
    meta.textContent = `Niveau ${state.level} · ${best} · ${state.attempts} partie(s)`;

    card.append(name, meta);
    card.addEventListener("click", () => params.navigate("game", { id: game.id }));
    container.appendChild(card);
  }
}
