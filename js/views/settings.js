export const meta = { title: "Réglages", nav: true };

export function render(container) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = "Réglages — thème et son au palier E.";
  container.appendChild(card);
}
