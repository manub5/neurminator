export const GAMES = [
  {
    id: "nback",
    name: "N-back",
    emoji: "🔁",
    description: "Mémoire de travail — repérer les répétitions",
    unit: "%",
    higherIsBetter: true,
    startLevel: 2,
  },
  {
    id: "span",
    name: "Span de mémoire",
    emoji: "🔷",
    description: "Répéter des séquences de plus en plus longues",
    unit: "",
    higherIsBetter: true,
  },
  {
    id: "stroop",
    name: "Stroop",
    emoji: "🎨",
    description: "Inhibition — nommer la couleur de l'encre",
    unit: "%",
    higherIsBetter: true,
  },
  {
    id: "reaction",
    name: "Temps de réaction",
    emoji: "⚡",
    description: "Réagir le plus vite possible",
    unit: "ms",
    higherIsBetter: false,
  },
  {
    id: "pairs",
    name: "Paires",
    emoji: "🃏",
    description: "Mémoire visuelle — retrouvez les paires cachées",
    unit: "%",
    higherIsBetter: true,
  },
  {
    id: "gonogo",
    name: "Go/No-Go",
    emoji: "🚦",
    description: "Attention et inhibition — n'appuyez que sur le bon signal",
    unit: "%",
    higherIsBetter: true,
  },
];

export function getGame(id) {
  return GAMES.find((g) => g.id === id) || null;
}

export function displayName(game) {
  if (!game) return "";
  return game.emoji ? `${game.emoji} ${game.name}` : game.name;
}

export function formatScore(game, score) {
  if (!game) return String(score);
  if (game.unit === "%") return `${Math.round(score * 100)}%`;
  return `${score}${game.unit}`;
}
