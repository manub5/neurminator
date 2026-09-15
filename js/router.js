export function createRouter({ routes, container, onNavigate }) {
  const byPath = new Map(routes.map((r) => [r.path, r]));
  let cleanup = null;
  let currentPath = null;
  let currentParams = null;
  let backNavigationConsumed = false;

  function runCleanup() {
    if (cleanup && typeof cleanup.destroy === "function") {
      try {
        cleanup.destroy();
      } catch (err) {
        console.warn("Route cleanup failed", err);
      }
    }
    cleanup = null;
  }

  function render(path, params) {
    const route = byPath.get(path);
    runCleanup();
    container.innerHTML = "";
    const result = route.render(container, { ...params, navigate });
    cleanup = typeof result === "function" ? { destroy: result } : result || null;
    currentPath = path;
    currentParams = params;
    backNavigationConsumed = false;
    if (onNavigate) onNavigate(path, params, route);
  }

  function navigate(path, params = {}) {
    const route = byPath.get(path);
    if (!route) {
      console.warn(`Unknown route: ${path}`);
      return;
    }
    window.history.pushState({ path, params }, "");
    render(path, params);
  }

  window.addEventListener("popstate", (event) => {
    const backResult = cleanup && typeof cleanup.onBack === "function" ? cleanup.onBack() : null;
    const gameIsActive = typeof backResult === "boolean";
    const consumed = backResult === true || (gameIsActive && !backNavigationConsumed);
    if (consumed) {
      backNavigationConsumed = true;
      window.history.pushState({ path: currentPath, params: currentParams }, "");
      return;
    }

    const { path, params } = event.state || {};
    if (byPath.has(path)) render(path, params || {});
  });

  function start() {
    window.history.replaceState({ path: "home", params: {} }, "");
    render("home", {});
  }

  return { navigate, start };
}
