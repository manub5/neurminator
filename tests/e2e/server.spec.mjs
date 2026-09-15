import { assert } from "./helpers.mjs";
import { resolvePublicPath } from "./server.mjs";

export async function run({ results }) {
  const record = async (name, fn) => {
    try {
      await fn();
      results.push({ suite: "server", name, ok: true });
    } catch (err) {
      results.push({ suite: "server", name, ok: false, error: String(err.message || err) });
    }
  };

  await record("ne sert que les fichiers publics de la PWA", async () => {
    assert(resolvePublicPath("/index.html"), "index.html devrait être public");
    assert(resolvePublicPath("/js/app.js"), "js/app.js devrait être public");
    assert(resolvePublicPath("/.git/config") === null, ".git ne doit pas être servi");
    assert(resolvePublicPath("/package.json") === null, "package.json ne doit pas être servi");
    assert(resolvePublicPath("/../secret.txt") === null, "un chemin parent ne doit pas être servi");
    assert(resolvePublicPath("/%2e%2e/repo-secret/file") === null, "un chemin encodé ne doit pas sortir du dépôt");
  });
}
