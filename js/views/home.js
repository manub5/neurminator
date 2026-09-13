export const meta = { title: "Accueil", nav: true };

export function render(container) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = "Accueil — les jeux arrivent au palier C.";
  container.appendChild(card);
}
