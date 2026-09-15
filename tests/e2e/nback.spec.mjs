import { openGame, state, installAutoResponder, stopAutoResponder, assert, gotoHistory } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "nback", name, ok: true });
    } catch (err) {
      results.push({ suite: "nback", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le canvas est monté et la partie démarre", async () => {
    await openGame(page, baseUrl, "N-back", { speed: 20 });
    const el = await page.$("canvas.game-canvas");
    assert(el, "canvas absent");
    const s = await state(page);
    assert(s && s.maxN >= 1, "état initial indisponible");
  });

  await record("la partie se termine et enregistre un score cohérent", async () => {
    await installAutoResponder(page, "nback");
    await page.waitForSelector(".result-card", { timeout: 30000 });
    await stopAutoResponder(page);
    const value = await page.textContent(".result-value");
    assert(value && value.endsWith("%"), `score inattendu: ${value}`);
    const numeric = Number(String(value).replace(/%/g, ""));
    assert(numeric >= 0 && numeric <= 100, `score hors bornes: ${value}`);
  });

  await record("la partie est enregistrée dans l'historique", async () => {
    await gotoHistory(page);
    const entries = await page.$$(".history-entry");
    assert(entries.length >= 1, "aucune entrée d'historique");
  });
}
