const REACTION_TARGET = { 1: 500, 2: 480, 3: 460 };
const REACTION_TARGET_HIGH = 440;

function reactionTarget(level) {
  return REACTION_TARGET[level] ?? REACTION_TARGET_HIGH;
}

const RULES = {
  span: {
    isSuccess: (score, level) => score >= level,
  },
  nback: {
    isSuccess: (score) => score >= 0.85,
  },
  stroop: {
    isSuccess: (score) => score >= 0.85,
  },
  reaction: {
    isSuccess: (score, level) => score > 0 && score <= reactionTarget(level),
  },
  pairs: {
    isSuccess: (score) => score >= 0.75,
  },
  gonogo: {
    isSuccess: (score) => score >= 0.85,
  },
};

const CEILINGS = { span: 12, nback: 5, pairs: 5, gonogo: 9 };
const FLOORS = { nback: 2 };

const MIN_LEVEL = 1;
const MIN_SAMPLES = 2;
const WINDOW = 3;
const UP_THRESHOLD = 0.5;
const DOWN_THRESHOLD = 0.5;

export function minLevelFor(gameId) {
  return FLOORS[gameId] ?? MIN_LEVEL;
}

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

  const floor = FLOORS[gameId] ?? MIN_LEVEL;

  let next = currentLevel;
  if (rate > UP_THRESHOLD) next = currentLevel + 1;
  else if (rate < DOWN_THRESHOLD) next = Math.max(floor, currentLevel - 1);

  const ceiling = CEILINGS[gameId];
  if (ceiling) next = Math.min(next, ceiling);
  return next;
}
