// Encart plein écran pour signaler une victoire ou un passage de palier.
// Se ferme au premier appui, où qu'il ait lieu sur l'encart.
export function showOverlay(container, { emoji = "🎉", title, message } = {}) {
  const overlay = document.createElement("div");
  overlay.className = "achievement-overlay";
  overlay.setAttribute("role", "alert");

  const card = document.createElement("div");
  card.className = "achievement-card";

  if (emoji) {
    const emojiEl = document.createElement("div");
    emojiEl.className = "achievement-emoji";
    emojiEl.textContent = emoji;
    emojiEl.setAttribute("aria-hidden", "true");
    card.appendChild(emojiEl);
  }

  const titleEl = document.createElement("p");
  titleEl.className = "achievement-title";
  titleEl.textContent = title;
  card.appendChild(titleEl);

  if (message) {
    const messageEl = document.createElement("p");
    messageEl.className = "achievement-message";
    messageEl.textContent = message;
    card.appendChild(messageEl);
  }

  const hint = document.createElement("p");
  hint.className = "achievement-hint";
  hint.textContent = "Touchez pour continuer";
  card.appendChild(hint);

  overlay.appendChild(card);

  function close() {
    overlay.remove();
  }
  overlay.addEventListener("click", close, { once: true });

  container.appendChild(overlay);
  return { close };
}
