import { chromium } from "playwright";
import { serve } from "./server.mjs";

const suites = [
  ["server", "./server.spec.mjs"],
  ["engine", "./engine.spec.mjs"],
  ["span", "./span.spec.mjs"],
  ["nback", "./nback.spec.mjs"],
  ["stroop", "./stroop.spec.mjs"],
  ["reaction", "./reaction.spec.mjs"],
];

async function main() {
  const port = 8127;
  const server = await serve(port);
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const [name, file] of suites) {
    const mod = await import(file);
    const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
    const ctx = { page, baseUrl, results, suite: name };
    console.log(`→ ${name}`);
    try {
      await mod.run(ctx);
    } catch (err) {
      results.push({ suite: name, name: "runtime", ok: false, error: String(err.message || err) });
    }
    await page.close();
  }

  await browser.close();
  server.close();

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n${passed} réussis, ${failed} échoués`);
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"} — ${r.suite} › ${r.name}${r.ok ? "" : ` (${r.error})`}`);
  }
  process.exit(failed ? 1 : 0);
}

main();
