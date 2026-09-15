import { openGame, state, installAutoResponder, stopAutoResponder, assert, gotoHistory } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "stroop", name, ok: true });
    } catch (err) {
      results.push({ suite: "stroop", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le canvas est monté et la partie démarre", async () => {
    await openGame(page, baseUrl, "Stroop", { speed: 20 });
    const el = await page.$("canvas.game-canvas");
    assert(el, "canvas absent");
    const s = await state(page);
    assert(s && s.word && s.ink, "état initial indisponible");
  });

  await record("le mot et l'encre sont incohérents quand incongruent", async () => {
    const s = await state(page);
    if (s.incongruent) {
      assert(s.word.toLowerCase() !== s.ink, "mot identique à l'encre alors qu'incongruent");
    }
  });

  await record("répondre la couleur de l'encre donne un score parfait", async () => {
    await installAutoResponder(page, "stroop");
    await page.waitForSelector(".result-card", { timeout: 30000 });
    await stopAutoResponder(page);
    const value = await page.textContent(".result-value");
    assert(value && value.endsWith("%"), `score inattendu: ${value}`);
    const numeric = Number(String(value).replace(/%/g, ""));
    assert(numeric > 0.9, `score trop faible pour un auto-répondeur correct: ${value}`);
  });

  await record("la partie est enregistrée dans l'historique", async () => {
    await gotoHistory(page);
    const entries = await page.$$(".history-entry");
    assert(entries.length >= 1, "aucune entrée d'historique");
  });
}
