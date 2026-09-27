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
    extractScore: (raw) => (raw.avgRt == null ? null : raw.avgRt),
    higherIsBetter: false,
  },
  pairs: {
    extractScore: (raw) => (raw.attempts > 0 ? raw.matches / raw.attempts : 0),
    higherIsBetter: true,
  },
  gonogo: {
    extractScore: (raw) => (raw.total > 0 ? raw.correct / raw.total : 0),
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
