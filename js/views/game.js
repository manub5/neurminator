export const meta = { title: "Jeu", nav: false, hideHeader: true };

export function render(container, params = {}) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = `Jeu : ${params.id || "(aucun)"} — jeu factice au palier C.`;
  container.appendChild(card);
}
