export function randomNumber(min: number, max: number = min) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
