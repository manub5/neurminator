export function createRouter({ routes, container, onNavigate }) {
  const byPath = new Map(routes.map((r) => [r.path, r]));

  function navigate(path, params = {}) {
    const route = byPath.get(path);
    if (!route) {
      console.warn(`Unknown route: ${path}`);
      return;
    }
    container.innerHTML = "";
    route.render(container, { ...params, navigate });
    if (onNavigate) onNavigate(path, params, route);
  }

  function start() {
    navigate("home");
  }

  return { navigate, start };
}
