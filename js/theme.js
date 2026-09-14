import { getSettings, saveSettings } from "./storage/local.js";

export function resolveTheme(theme) {
  if (theme === "light") return "light";
  if (theme === "dark") return "dark";
  return matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme) {
  const resolved = resolveTheme(theme);
  if (resolved === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function init() {
  const settings = getSettings();
  applyTheme(settings.theme);
  matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    const current = getSettings();
    if (current.theme === "auto") applyTheme("auto");
  });
}

export function setTheme(theme) {
  const settings = getSettings();
  settings.theme = theme;
  saveSettings(settings);
  applyTheme(theme);
}
