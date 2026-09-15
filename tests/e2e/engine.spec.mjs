import { openGame, state, assert } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "engine", name, ok: true });
    } catch (err) {
      results.push({ suite: "engine", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("Échap met la partie en pause et la reprend", async () => {
    await openGame(page, baseUrl, "Span de mémoire", { speed: 20 });
    await page.waitForFunction(() => window.__cog && window.__cog.state());
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    const paused = await page.evaluate(() => window.__cog.isPaused());
    assert(paused === true, "la partie n'est pas en pause après Échap");
    const before = await page.evaluate(() => window.__cog.state());
    await page.waitForTimeout(400);
    const after = await page.evaluate(() => window.__cog.state());
    assert(after.phase === before.phase, "la partie progresse malgré la pause");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    const resumed = await page.evaluate(() => window.__cog.isPaused());
    assert(resumed === false, "la partie ne reprend pas après Échap");
  });

  await record("ignore les répétitions automatiques du clavier", async () => {
    await openGame(page, baseUrl, "Span de mémoire", { speed: 20 });
    await page.evaluate(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", repeat: true }));
    });
    assert(await page.evaluate(() => !window.__cog.isPaused()), "une touche répétée a été traitée");
  });

  await record("un payload de test malformé ne fait pas planter le jeu", async () => {
    await openGame(page, baseUrl, "Stroop", { speed: 20 });
    await page.evaluate(() => {
      window.__cog.submit({ index: NaN });
      window.__cog.submit({ index: -1 });
      window.__cog.submit({ index: 999 });
      window.__cog.submit(null);
      window.__cog.submit({});
    });
    await page.waitForTimeout(200);
    const alive = await page.evaluate(() => !!window.__cog && window.__cog.state() !== null);
    assert(alive, "le jeu a planté après un payload invalide");
  });

  await record("la pause gèle le chronométrage de réaction", async () => {
    await openGame(page, baseUrl, "Temps de réaction", { speed: 20 });
    await page.waitForFunction(
      () => window.__cog.state().phase === "stimulus",
      null,
      { timeout: 15000 }
    );
    await page.keyboard.press("Escape");
    const before = await page.evaluate(() => window.__cog.state());
    await page.waitForTimeout(3000);
    const during = await page.evaluate(() => window.__cog.state());
    assert(during.total === before.total, "un essai a été jugé pendant la pause");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    const after = await page.evaluate(() => window.__cog.state());
    assert(after.total === before.total, "un essai a été jugé juste après la reprise");
  });
}
