export function appUrl(baseUrl, { speed = 1 } = {}) {
  const params = new URLSearchParams({ test: "1" });
  if (speed > 1) params.set("speed", String(speed));
  return `${baseUrl}/?${params.toString()}`;
}

export async function openGame(page, baseUrl, gameName, { speed = 1 } = {}) {
  await page.goto(appUrl(baseUrl, { speed }));
  await page.getByRole("button", { name: gameName }).click();
  await page.waitForSelector("canvas.game-canvas", { state: "visible" });
  await page.waitForFunction(() => window.__cog && window.__cog.state() !== null);
}

export async function waitForPhase(page, phase, timeout = 30000) {
  await page.waitForFunction(
    (expected) => window.__cog && window.__cog.state() && window.__cog.state().phase === expected,
    phase,
    { timeout }
  );
}

export async function submit(page, payload) {
  await page.evaluate((p) => window.__cog.submit(p), payload);
}

export async function state(page) {
  return page.evaluate(() => (window.__cog ? window.__cog.state() : null));
}

export async function installAutoResponder(page, game) {
  await page.evaluate((g) => {
    window.__auto = { stop: false, ticks: 0 };
    const respond = () => {
      if (window.__auto.stop || !window.__cog) return;
      const s = window.__cog.state();
      if (s) {
        window.__auto.ticks += 1;
        if (g === "stroop" && (s.phase === "stimulus" || s.phase === "recall")) {
          const order = ["rouge", "vert", "bleu", "jaune", "violet", "orange"];
          const targetId = s.rule === "word" ? s.wordColorId : s.ink;
          const index = order.indexOf(targetId);
          if (index >= 0) window.__cog.submit({ index });
        } else if (g === "nback" && s.phase === "show" && s.target) {
          window.__cog.submit({ kind: "press" });
        } else if (g === "reaction" && s.phase === "stimulus" && s.activePos >= 0) {
          window.__cog.submit({ index: s.activePos });
        } else if (g === "span" && s.phase === "answer") {
          for (const index of s.sequence) window.__cog.submit({ index });
        } else if (g === "gonogo" && s.phase === "stimulus" && s.isGo) {
          window.__cog.submit({ kind: "press" });
        } else if (g === "pairs" && s.phase === "playing") {
          const pendingIndex = s.revealed.findIndex((r, i) => r && !s.matched[i]);
          let target = -1;
          if (pendingIndex >= 0) {
            const symbol = s.deck[pendingIndex];
            target = s.deck.findIndex(
              (sym, i) => sym === symbol && i !== pendingIndex && !s.matched[i] && !s.revealed[i]
            );
          } else {
            target = s.deck.findIndex((sym, i) => !s.matched[i] && !s.revealed[i]);
          }
          if (target >= 0) window.__cog.submit({ index: target });
        }
      }
      if (!window.__auto.stop) requestAnimationFrame(respond);
    };
    requestAnimationFrame(respond);
  }, game);
}

export async function stopAutoResponder(page) {
  await page.evaluate(() => {
    if (window.__auto) window.__auto.stop = true;
  });
}

export async function dismissOverlay(page) {
  const overlay = await page.$(".achievement-overlay");
  if (overlay) await overlay.click();
}

export async function gotoHistory(page) {
  await dismissOverlay(page);
  await page.getByRole("button", { name: "Accueil", exact: true }).click();
  await page.getByRole("button", { name: "Historique", exact: true }).click();
  await page.waitForSelector(".history-entry");
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || "assertion failed");
}
