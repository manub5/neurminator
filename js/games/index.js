export const GAMES = [
  {
    id: "nback",
    name: "N-back",
    description: "Mémoire de travail — repérer les répétitions",
    unit: "%",
    higherIsBetter: true,
  },
  {
    id: "span",
    name: "Span de mémoire",
    description: "Répéter des séquences de plus en plus longues",
    unit: "",
    higherIsBetter: true,
  },
  {
    id: "stroop",
    name: "Stroop",
    description: "Inhibition — nommer la couleur de l'encre",
    unit: "%",
    higherIsBetter: true,
  },
  {
    id: "reaction",
    name: "Temps de réaction",
    description: "Réagir le plus vite possible",
    unit: "ms",
    higherIsBetter: false,
  },
];

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}

export function formatScore(game, score) {
  if (!game) return String(score);
  if (game.unit === "%") return `${Math.round(score * 100)}%`;
  return `${score}${game.unit}`;
}
