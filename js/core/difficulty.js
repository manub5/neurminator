const RULES = {
  span: {
    isSuccess: (score, level) => score >= level,
  },
};

const MIN_LEVEL = 1;
const MIN_SAMPLES = 2;
const WINDOW = 3;
const UP_THRESHOLD = 0.5;
const DOWN_THRESHOLD = 0.5;

export function successRate(gameId, currentLevel, recentScores) {
  const rule = RULES[gameId];
  if (!rule) throw new Error(`Unknown game: ${gameId}`);
  const window = recentScores.slice(-WINDOW);
  if (window.length < MIN_SAMPLES) return null;
  const successes = window.filter((s) => rule.isSuccess(s, currentLevel)).length;
  return successes / window.length;
}

export function nextLevel(gameId, currentLevel, recentScores) {
  const rate = successRate(gameId, currentLevel, recentScores);
  if (rate === null) return currentLevel;

  if (rate > UP_THRESHOLD) return currentLevel + 1;
  if (rate < DOWN_THRESHOLD) return Math.max(MIN_LEVEL, currentLevel - 1);
  return currentLevel;
}
