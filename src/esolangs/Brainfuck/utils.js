export function textToBrainfuck(text) {
    let brainfuck = '';
    let cellValue = 0;
    for (let i = 0; i < text.length; i++) {
        let charCode = text[i].charCodeAt(0);

        let delta = charCode - cellValue;
        if (delta !== 0) brainfuck += (delta < 0 ? '-' : '+').repeat(Math.abs(delta)); // Increase cell
        brainfuck += '.'; // Output char
        cellValue = charCode;
    }
    // Decrease cellValue back to zero
    brainfuck += '-'.repeat(cellValue);

    return brainfuck;
}