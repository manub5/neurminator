import { getHistory } from "../storage/local.js";
import { GAMES, getGame, formatScore } from "../games/index.js";
import { groupByDay, seriesForGame, trendForGame } from "../core/history.js";

export const meta = { title: "Historique", nav: true };

const TREND_ARROW = { up: "↑", down: "↓", flat: "→" };
const TREND_LABEL = { up: "progression", down: "baisse", flat: "stable" };

function sparkline(scores, higherIsBetter) {
  const width = 120;
  const height = 32;
  const values = scores.slice(-15);
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const norm = (v - min) / range;
      const y = higherIsBetter ? height - norm * height : norm * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("class", "sparkline");
  const poly = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  poly.setAttribute("points", points);
  poly.setAttribute("fill", "none");
  poly.setAttribute("stroke", "var(--accent)");
  poly.setAttribute("stroke-width", "2");
  svg.appendChild(poly);
  return svg;
}

function gameSummary(history, game) {
  const series = seriesForGame(history, game.id);
  if (!series.length) return null;

  const card = document.createElement("div");
  card.className = "card summary-card";

  const header = document.createElement("div");
  header.className = "summary-header";
  const name = document.createElement("span");
  name.className = "summary-name";
  name.textContent = game.name;
  const count = document.createElement("span");
  count.className = "game-card__meta";
  count.textContent = `${series.length} partie(s)`;
  header.append(name, count);

  const trend = trendForGame(history, game.id, game.higherIsBetter);
  const values = document.createElement("p");
  values.className = "game-card__meta";
  values.textContent = trend
    ? `${TREND_ARROW[trend]} ${TREND_LABEL[trend]}`
    : "tendance : assez de données bientôt";

  card.append(header, values);
  const line = sparkline(series, game.higherIsBetter);
  if (line) card.appendChild(line);
  return card;
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

  for (const game of GAMES) {
    const summary = gameSummary(history, game);
    if (summary) container.appendChild(summary);
  }

  for (const group of groupByDay(history)) {
    const heading = document.createElement("h2");
    heading.className = "history-day";
    heading.textContent = group.label;
    container.appendChild(heading);

    for (const entry of group.entries) {
      const game = getGame(entry.game);
      const card = document.createElement("div");
      card.className = "card history-entry";
      const name = game ? game.name : entry.game;
      const time = new Date(entry.date).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const score = game ? formatScore(game, entry.score) : String(entry.score);
      card.textContent = `${time} · ${name} · Niveau ${entry.level} · ${score}`;
      container.appendChild(card);
    }
  }
}
