import { openGame, state, installAutoResponder, stopAutoResponder, assert, appUrl, gotoHistory } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "reaction", name, ok: true });
    } catch (err) {
      results.push({ suite: "reaction", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le canvas est monté et la partie démarre", async () => {
    await openGame(page, baseUrl, "Temps de réaction", { speed: 20 });
    const el = await page.$("canvas.game-canvas");
    assert(el, "canvas absent");
    const s = await state(page);
    assert(s && s.mode === 1, `mode initial inattendu: ${s && s.mode}`);
  });

  await record("ignore une cellule sans cible", async () => {
    await page.waitForFunction(() => window.__cog.state().phase === "stimulus");
    const before = await state(page);
    const empty = Array.from({ length: 9 }, (_, index) => index)
      .find((index) => !before.positions.includes(index));
    await page.evaluate((index) => window.__cog.submit({ index }), empty);
    await page.waitForTimeout(50);
    const after = await state(page);
    assert(after.total === before.total, "une cellule vide a consommé l'essai");
  });

  await record("répondre à la cible donne un temps de réaction", async () => {
    await installAutoResponder(page, "reaction");
    await page.waitForSelector(".result-card", { timeout: 30000 });
    await stopAutoResponder(page);
    const value = await page.textContent(".result-value");
    assert(value && value.endsWith("ms"), `score inattendu: ${value}`);
    const numeric = Number(String(value).replace(/ms/g, ""));
    assert(numeric > 0, `temps non valide: ${value}`);
  });

  await record("la partie est enregistrée dans l'historique", async () => {
    await gotoHistory(page);
    const entries = await page.$$(".history-entry");
    assert(entries.length >= 1, "aucune entrée d'historique");
  });

  await record("au niveau 3, quatre cibles apparaissent", async () => {
    await page.goto(appUrl(baseUrl, { speed: 20 }));
    await page.evaluate(() => {
      localStorage.setItem(
        "cog.games",
        JSON.stringify({ reaction: { level: 3, attempts: 1, bestScore: 400 } })
      );
    });
    await page.reload();
    await page.getByRole("button", { name: "Temps de réaction" }).click();
    await page.waitForFunction(() => window.__cog && window.__cog.state() !== null);
    const s = await state(page);
    assert(s.mode === 4, `mode attendu 4, obtenu ${s.mode}`);
  });
}
