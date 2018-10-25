export function createId() {
  return Math.random().toString(16).substring(2, 14);
}

export function rollDice(sides, quantity) {
  let sum = 0;
  for (let i = 0; i < quantity; i++) {
    sum += Math.ceil(Math.random() * sides);
  }
  return sum;
}
