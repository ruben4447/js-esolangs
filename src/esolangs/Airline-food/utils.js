/**
 * Return object mapping "So..." to "Moving on..." and vica versa
 * - Don't throw any errors in this function. Just set the appropriate indexes to -1 and let error handling occur in the `async step` function :)
 * @param {string} code 
 * @returns {{ [pos: number]: number }} 
 */
export function constructBlockMap(code) {
  const sos = []; // number[] - indexes of every "So..." word (in order of encounter)
  const map = {}; // { [pos: number]: number } - map "So..." to corresponding "Moving On..." label
  let movingOnIndex = -1; // Came across "Moving" word

  for (let i = 0; i < code.length; i++) {
    while (code[i].match(/\s/)) i++;
    const obj = skipWord(code, i), word = obj.word;

    if (word === 'So...') {
      sos.push(i);
    } else if (word === 'Moving') {
      movingOnIndex = i;
    } else if (movingOnIndex !== -1) {
      if (word === 'on...') {
        if (sos.length === 0) {
          map[movingOnIndex] = -1; // Invalid "Moving on..." statement
        } else {
          let so = sos.pop(); // Get corresponding "So..."
          map[so] = movingOnIndex;
          map[movingOnIndex] = so;
        }
        movingOnIndex = -1;
      } else {
        movingOnIndex = -1;
      }
    }

    i = obj.index;
  }
  // Add unmatches "So..."s as -1
  for (let so in sos) if (sos.hasOwnProperty(so)) map[so] = -1;
  return map;
}

export function skipWord(string, index) {
  let word = '';
  for (; index < string.length; index++) {
    if (string[index].match(/\s/)) break;
    word += string[index];
  }
  return { index: index, word };
}