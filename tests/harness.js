export function createRunner() {
  const results = [];
  let currentSuite = "";

  function suite(name, fn) {
    currentSuite = name;
    fn();
  }

  function test(name, fn) {
    try {
      fn();
      results.push({ suite: currentSuite, name, ok: true });
    } catch (err) {
      results.push({ suite: currentSuite, name, ok: false, error: err.message });
    }
  }

  function render(target) {
    const passed = results.filter((r) => r.ok).length;
    const failed = results.length - passed;
    const summary = document.createElement("h2");
    summary.textContent = `${passed} réussis, ${failed} échoués`;
    summary.style.color = failed ? "var(--danger)" : "#4caf50";
    target.appendChild(summary);

    for (const r of results) {
      const line = document.createElement("p");
      line.textContent = `${r.ok ? "PASS" : "FAIL"} — ${r.suite} › ${r.name}`;
      line.style.color = r.ok ? "#4caf50" : "var(--danger)";
      if (!r.ok) line.textContent += ` (${r.error})`;
      target.appendChild(line);
    }
  }

  return { suite, test, render };
}

export function assertEqual(actual, expected, message = "") {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message} attendu ${e}, obtenu ${a}`);
}

export function assertTrue(value, message = "") {
  if (!value) throw new Error(`${message} attendu vrai, obtenu ${value}`);
}
