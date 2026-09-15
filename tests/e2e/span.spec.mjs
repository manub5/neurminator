import { openGame, waitForPhase, submit, state, assert, gotoHistory } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "span", name, ok: true });
    } catch (err) {
      results.push({ suite: "span", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le canvas est monté et la partie démarre", async () => {
    await openGame(page, baseUrl, "Span de mémoire", { speed: 20 });
    const el = await page.$("canvas.game-canvas");
    assert(el, "canvas absent");
    const box = await el.boundingBox();
    assert(box && box.width > 100 && box.height > 100, "canvas mal dimensionné");
    const s = await state(page);
    assert(s && typeof s.length === "number", "état initial indisponible");
  });

  await record("une bonne séquence est acceptée et fait progresser", async () => {
    await waitForPhase(page, "answer");
    const before = await state(page);
    for (const index of before.sequence) await submit(page, { index });
    await page.waitForFunction(
      (len) => window.__cog.state().maxSpan >= len,
      before.length,
      { timeout: 10000 }
    );
    const after = await state(page);
    assert(after.maxSpan >= before.length, "maxSpan non mis à jour");
    assert(after.length > before.length || after.phase !== "answer", "pas de progression");
  });

  await record("un échec termine la partie et affiche le résultat", async () => {
    await page.waitForFunction(
      () => window.__cog.state().phase === "answer",
      null,
      { timeout: 15000 }
    );
    const s = await state(page);
    const wrong = s.sequence.map((v) => (v + 1) % 9);
    for (const index of wrong) await submit(page, { index });
    await page.waitForSelector(".result-card", { timeout: 10000 });
    const text = await page.textContent(".result-value");
    assert(text !== null, "score absent de l'écran de résultat");
  });

  await record("la partie est enregistrée dans l'historique", async () => {
    await gotoHistory(page);
    const entries = await page.$$(".history-entry");
    assert(entries.length >= 1, "aucune entrée d'historique");
  });
}
