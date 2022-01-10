export function randomIntFromInterval(min = 1, max = 10) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}
