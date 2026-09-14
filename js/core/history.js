export function groupByDay(history) {
  if (!history.length) return [];
  const sorted = [...history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const groups = new Map();
  for (const entry of sorted) {
    const day = entry.date.slice(0, 10);
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(entry);
  }
  return [...groups.entries()].map(([day, entries]) => ({
    day,
    label: new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    entries,
  }));
}

export function seriesForGame(history, gameId) {
  return history
    .filter((h) => h.game === gameId)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((h) => h.score);
}

function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function trendForGame(history, gameId, higherIsBetter) {
  const series = seriesForGame(history, gameId);
  if (series.length < 6) return null;

  const recent = series.slice(-3);
  const previous = series.slice(-6, -3);
  const delta = average(recent) - average(previous);
  const tolerance = Math.abs(average(previous)) * 0.05 || 0.001;

  if (Math.abs(delta) <= tolerance) return "flat";
  const improving = higherIsBetter ? delta > 0 : delta < 0;
  return improving ? "up" : "down";
}
