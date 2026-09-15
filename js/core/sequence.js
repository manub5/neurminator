export const GRID_SIZE = 9;

export function randomSequence(length, { maxLength = 12, size = GRID_SIZE, rng = Math.random } = {}) {
  const n = Math.min(length, maxLength);
  const seq = [];
  for (let i = 0; i < n; i++) {
    const last = seq.length > 0 ? seq[seq.length - 1] : -1;
    let cell = Math.floor(rng() * size);
    if (size > 1 && cell === last) {
      let attempts = 0;
      while (cell === last && attempts < 20) {
        cell = Math.floor(rng() * size);
        attempts += 1;
      }
      if (cell === last) cell = (last + 1) % size;
    }
    seq.push(cell);
  }
  return seq;
}

export function isSequenceCorrect(sequence, answer) {
  return answer.length === sequence.length && answer.every((v, i) => v === sequence[i]);
}
