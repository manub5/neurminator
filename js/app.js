import { createRouter } from "./router.js";
import * as home from "./views/home.js";
import * as game from "./views/game.js";
import * as history from "./views/history.js";
import * as settings from "./views/settings.js";

const routes = [
  { path: "home", ...home },
  { path: "game", ...game },
  { path: "history", ...history },
  { path: "settings", ...settings },
];

const container = document.getElementById("app");
const nav = document.getElementById("app-nav");
const title = document.getElementById("app-title");

const router = createRouter({
  routes,
  container,
  onNavigate(path, params, route) {
    document.body.classList.toggle("playing", !!route.meta.hideHeader);
    title.textContent = route.meta.title;

    nav.innerHTML = "";
    for (const r of routes) {
      if (!r.meta.nav) continue;
      const btn = document.createElement("button");
      btn.textContent = r.meta.title;
      btn.setAttribute("aria-current", r.path === path ? "page" : "false");
      btn.addEventListener("click", () => router.navigate(r.path));
      nav.appendChild(btn);
    }
  },
});

router.start();
