const RULES = {
  span: {
    extractScore: (raw) => raw.maxSpan,
    higherIsBetter: true,
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
