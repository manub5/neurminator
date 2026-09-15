export function createRouter({ routes, container, onNavigate }) {
  const byPath = new Map(routes.map((r) => [r.path, r]));
  let cleanup = null;

  function runCleanup() {
    if (typeof cleanup === "function") {
      try {
        cleanup();
      } catch (err) {
        console.warn("Route cleanup failed", err);
      }
    }
    cleanup = null;
  }

  function navigate(path, params = {}) {
    const route = byPath.get(path);
    if (!route) {
      console.warn(`Unknown route: ${path}`);
      return;
    }
    runCleanup();
    container.innerHTML = "";
    cleanup = route.render(container, { ...params, navigate }) || null;
    if (onNavigate) onNavigate(path, params, route);
  }

  function start() {
    navigate("home");
  }

  return { navigate, start };
}
