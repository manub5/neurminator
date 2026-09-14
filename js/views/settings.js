import {
  getSettings,
  saveSettings,
  clearHistory,
  saveGames,
} from "../storage/local.js";
import { setTheme } from "../theme.js";

export const meta = { title: "Réglages", nav: true };

function card() {
  const el = document.createElement("div");
  el.className = "card settings-card";
  return el;
}

export function render(container) {
  const settings = getSettings();

  const themeCard = card();
  const themeTitle = document.createElement("p");
  themeTitle.className = "settings-title";
  themeTitle.textContent = "Thème";
  themeCard.appendChild(themeTitle);

  const themeOptions = document.createElement("div");
  themeOptions.className = "settings-options";
  for (const value of ["auto", "light", "dark"]) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent =
      value === "auto" ? "Auto" : value === "light" ? "Clair" : "Sombre";
    btn.setAttribute("aria-pressed", settings.theme === value ? "true" : "false");
    btn.addEventListener("click", () => {
      setTheme(value);
      render(container);
    });
    themeOptions.appendChild(btn);
  }
  themeCard.appendChild(themeOptions);
  container.appendChild(themeCard);

  const soundCard = card();
  const soundLabel = document.createElement("label");
  soundLabel.className = "settings-row";
  const soundText = document.createElement("span");
  soundText.textContent = "Son en fin de partie";
  const toggle = document.createElement("input");
  toggle.type = "checkbox";
  toggle.checked = settings.soundEnabled;
  toggle.addEventListener("change", () => {
    const s = getSettings();
    s.soundEnabled = toggle.checked;
    saveSettings(s);
  });
  soundLabel.append(soundText, toggle);
  soundCard.appendChild(soundLabel);
  container.appendChild(soundCard);

  const clearCard = card();
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "danger";
  clearBtn.textContent = "Effacer l'historique";
  clearBtn.addEventListener("click", () => {
    if (!confirm("Effacer tout l'historique et remettre les niveaux à 1 ?")) return;
    clearHistory();
    saveGames({});
    render(container);
  });
  clearCard.appendChild(clearBtn);
  container.appendChild(clearCard);

  const iosCard = card();
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Installer sur l'écran d'accueil (iOS)";
  const steps = document.createElement("p");
  steps.className = "settings-help";
  steps.textContent =
    "Sur iPhone/iPad : ouvrez cette page dans Safari, touchez le bouton Partager, puis « Sur l'écran d'accueil ». Sur Android, une bannière d'installation apparaît automatiquement.";
  details.append(summary, steps);
  iosCard.appendChild(details);
  container.appendChild(iosCard);
}
