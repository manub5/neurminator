export const GRID_SIZE = 9;

export function randomSequence(length, { maxLength = 12 } = {}) {
  const n = Math.min(length, maxLength);
  const seq = [];
  for (let i = 0; i < n; i++) {
    let cell;
    do {
      cell = Math.floor(Math.random() * GRID_SIZE);
    } while (seq.length > 0 && cell === seq[seq.length - 1]);
    seq.push(cell);
  }
  return seq;
}

export function mount(container) {
  const grid = document.createElement("div");
  grid.className = "span-grid";

  const cells = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "span-cell";
    cell.dataset.index = String(i);
    grid.appendChild(cell);
    cells.push(cell);
  }

  container.appendChild(grid);

  return {
    element: grid,
    cells,
    setActive(index) {
      cells[index].classList.add("is-active");
    },
    clear() {
      for (const cell of cells) cell.classList.remove("is-active", "is-highlight");
    },
    highlight(index) {
      cells[index].classList.add("is-highlight");
    },
    cellIndexFromEvent(event) {
      const target = event.target.closest(".span-cell");
      if (!target) return -1;
      return Number(target.dataset.index);
    },
  };
}
