export function scrabble(string) {
  let total = 0;
  for (let letter of string) {
    letter = letter.toUpperCase();
    for (let score in scores) {
      if (scores.hasOwnProperty(score) && scores[score].includes(letter)) {
        total += +score;
      }
    }
  }
  return total;
}

export const scores = {
  1: "AEILNORSTU",
  2: "DG",
  3: "BCMP",
  4: "FHVWY",
  5: "K",
  8: "JX",
  10: "QZ",
};