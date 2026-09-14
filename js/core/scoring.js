const RULES = {
  span: {
    extractScore: (raw) => raw.maxSpan,
    higherIsBetter: true,
  },
  nback: {
    extractScore: (raw) => (raw.total > 0 ? raw.correct / raw.total : 0),
    higherIsBetter: true,
  },
  stroop: {
    extractScore: (raw) => (raw.total > 0 ? raw.correct / raw.total : 0),
    higherIsBetter: true,
  },
  reaction: {
    extractScore: (raw) => raw.avgRt,
    higherIsBetter: false,
  },
};

export function normalize(gameId, raw) {
  const rule = RULES[gameId];
  if (!rule) throw new Error(`Unknown game: ${gameId}`);
  return { score: rule.extractScore(raw), higherIsBetter: rule.higherIsBetter };
}

export function hasRule(gameId) {
  return Boolean(RULES[gameId]);
}
