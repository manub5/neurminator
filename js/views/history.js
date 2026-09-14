import { getHistory } from "../storage/local.js";
import { getGame } from "../games/index.js";

export const meta = { title: "Historique", nav: true };

function formatDay(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function render(container) {
  const history = getHistory();

  if (history.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.textContent = "Aucune partie pour l'instant. Jouez pour voir votre progression ici.";
    container.appendChild(empty);
    return;
  }

  const sorted = [...history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  let currentDay = null;
  for (const entry of sorted) {
    const day = formatDay(entry.date);
    if (day !== currentDay) {
      currentDay = day;
      const heading = document.createElement("h2");
      heading.className = "history-day";
      heading.textContent = day;
      container.appendChild(heading);
    }

    const game = getGame(entry.game);
    const card = document.createElement("div");
    card.className = "card history-entry";
    const name = game ? game.name : entry.game;
    const unit = game ? game.unit : "";
    card.textContent = `${formatTime(entry.date)} · ${name} · Niveau ${entry.level} · ${entry.score}${unit}`;
    container.appendChild(card);
  }
}
