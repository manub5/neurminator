import { openGame, state, installAutoResponder, stopAutoResponder, assert, gotoHistory } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "gonogo", name, ok: true });
    } catch (err) {
      results.push({ suite: "gonogo", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le canvas est monté et la partie démarre", async () => {
    await openGame(page, baseUrl, "Go/No-Go", { speed: 20 });
    const el = await page.$("canvas.game-canvas");
    assert(el, "canvas absent");
    const s = await state(page);
    assert(s && typeof s.isGo === "boolean", "état initial indisponible");
  });

  await record("appuyer sur un signal go/no-go donne un score cohérent", async () => {
    await installAutoResponder(page, "gonogo");
    await page.waitForSelector(".result-card", { timeout: 30000 });
    await stopAutoResponder(page);
    const value = await page.textContent(".result-value");
    assert(value && value.endsWith("%"), `score inattendu: ${value}`);
    const numeric = Number(String(value).replace(/%/g, ""));
    assert(numeric > 80, `score trop faible pour un répondeur correct: ${value}`);
  });

  await record("la partie est enregistrée dans l'historique", async () => {
    await gotoHistory(page);
    const entries = await page.$$(".history-entry");
    assert(entries.length >= 1, "aucune entrée d'historique");
  });
}
