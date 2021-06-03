/**
 * Return end index of a comment
 * - Comments cannot be nested, so the first "}" will exit the comment
 * @param {string} string string to scan. Assumes that the comment has already been opened.
 * @param {number} index index to start scanning at. Defaults to 0.
 * @return {number} End index of comment (index of '}'). Return -1 if comment has not ended.
 */
export function scanComment(string, index = 0) {
  while (true) {
    if (index >= string.length) return -1; // Reached end of input without closing brace
    if (string[index] === '}') break;
    index++;
  }
  return index;
}

/**
 * Create bracket map for input string - map all "[" to "]" and vica versa
 * @param {string} string
 * @returns {{ [pos: number]: number }}
*/
export function constructBracketMap(string) {
  const map = {}, openPositions = [];
  let inComment = false;

  for (let i = 0; i < string.length; i++) {
    if (string[i] === '{') {
      inComment = true;
    } else if (string[i] === '}') {
      inComment = false;
    } else if (!inComment && string[i] === '[') {
      openPositions.push(i);
    } else if (!inComment && string[i] === ']') {
      let openPosition = openPositions.pop();
      if (openPosition === undefined) throw new Error(`Unexpected token ']' in position ${i}`);
      map[openPosition] = i;
      map[i] = openPosition;
    }
  }
  for (let pos of openPositions) map[pos] = -1;
  return map;
}