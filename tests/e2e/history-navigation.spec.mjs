import { appUrl, assert, installAutoResponder, stopAutoResponder } from "./helpers.mjs";

export async function run({ page, baseUrl, results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "history-navigation", name, ok: true });
    } catch (err) {
      results.push({ suite: "history-navigation", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("le retour met chaque partie en pause puis revient à l'accueil", async () => {
    await page.goto(appUrl(baseUrl));

    for (const gameName of [
      "Span de mémoire",
      "N-back",
      "Stroop",
      "Temps de réaction",
      "Paires",
      "Go/No-Go",
    ]) {
      await page.getByRole("button", { name: gameName }).click();
      await page.waitForFunction(() => window.__cog && window.__cog.state() !== null);

      await page.goBack();
      await page.waitForFunction(() => window.__cog && window.__cog.isPaused());
      assert(await page.$("canvas.game-canvas"), `le premier retour a quitté ${gameName}`);

      await page.goBack();
      await page.getByRole("button", { name: gameName }).waitFor();
    }
  });

  await record("chaque navigation applicative ajoute une entrée d'historique", async () => {
    await page.goto(appUrl(baseUrl));
    await page.getByRole("button", { name: "Historique", exact: true }).click();
    await page.goBack();
    await page.getByRole("button", { name: "Span de mémoire" }).waitFor();

    await page.getByRole("button", { name: "Réglages", exact: true }).click();
    await page.goBack();
    await page.getByRole("button", { name: "Span de mémoire" }).waitFor();
  });

  await record("le retour d'une partie déjà en pause est consommé avant l'accueil", async () => {
    await page.goto(appUrl(baseUrl));
    await page.getByRole("button", { name: "Temps de réaction" }).click();
    await page.waitForFunction(() => window.__cog && window.__cog.state() !== null);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__cog && window.__cog.isPaused());

    await page.goBack();
    await page.waitForFunction(() => window.__cog && window.__cog.isPaused());
    assert(await page.$("canvas.game-canvas"), "le retour a quitté une partie déjà en pause");

    await page.goBack();
    await page.getByRole("button", { name: "Temps de réaction" }).waitFor();
  });

  await record("le retour pause à nouveau une partie reprise", async () => {
    await page.goto(appUrl(baseUrl));
    await page.getByRole("button", { name: "Temps de réaction" }).click();
    await page.waitForFunction(() => window.__cog && window.__cog.state() !== null);

    await page.goBack();
    await page.waitForFunction(() => window.__cog && window.__cog.isPaused());
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__cog && !window.__cog.isPaused());

    await page.goBack();
    await page.waitForFunction(() => window.__cog && window.__cog.isPaused());
    assert(await page.$("canvas.game-canvas"), "le retour a quitté une partie reprise");

    await page.goBack();
    await page.getByRole("button", { name: "Temps de réaction" }).waitFor();
  });

  await record("le retour depuis le résultat revient à l'accueil", async () => {
    await page.goto(appUrl(baseUrl, { speed: 20 }));
    await page.getByRole("button", { name: "Temps de réaction" }).click();
    await page.waitForFunction(() => window.__cog && window.__cog.state() !== null);
    await installAutoResponder(page, "reaction");
    await page.waitForSelector(".result-card", { timeout: 30000 });
    await stopAutoResponder(page);

    await page.goBack();
    await page.getByRole("button", { name: "Temps de réaction" }).waitFor();
  });
}
