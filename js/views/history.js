export const meta = { title: "Historique", nav: true };

export function render(container) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = "Historique — alimenté au palier C.";
  container.appendChild(card);
}
