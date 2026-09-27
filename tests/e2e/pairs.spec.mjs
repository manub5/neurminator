import {
  openGame,
  state,
  installAutoResponder,
  stopAutoResponder,
  assert,
  gotoHistory,
  dismissOverlay,
} from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "pairs", name, ok: true });
    } catch (err) {
      results.push({ suite: "pairs", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le canvas est monté et la partie démarre", async () => {
    await openGame(page, baseUrl, "Paires", { speed: 20 });
    const el = await page.$("canvas.game-canvas");
    assert(el, "canvas absent");
    const s = await state(page);
    assert(s && s.pairs >= 1 && s.deck.length === s.pairs * 2, "état initial indisponible");
  });

  await record("un jeu parfait retrouve toutes les paires", async () => {
    await installAutoResponder(page, "pairs");
    await page.waitForSelector(".result-card", { timeout: 30000 });
    await stopAutoResponder(page);
    const value = await page.textContent(".result-value");
    assert(value && value.endsWith("%"), `score inattendu: ${value}`);
    const numeric = Number(String(value).replace(/%/g, ""));
    assert(numeric === 100, `score non parfait pour un jeu sans erreur: ${value}`);
  });

  await record("un encart de victoire apparaît et se ferme au toucher", async () => {
    const overlay = await page.$(".achievement-overlay");
    assert(overlay, "aucun encart de victoire pour un premier score enregistré");
    await dismissOverlay(page);
  });

  await record("la partie est enregistrée dans l'historique", async () => {
    await gotoHistory(page);
    const entries = await page.$$(".history-entry");
    assert(entries.length >= 1, "aucune entrée d'historique");
  });
}
