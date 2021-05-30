export function textToLength(text) {
    let lines = [], topValue = 0;
    lines.push("1234567890123456789012345", ""); // PUSH 0 ON TO THE STACK
    for (let i = 0; i < text.length; i++) {
        let charCode = text[i].charCodeAt(0);

        let delta = charCode - topValue;
        if (delta !== 0) {
            lines.push("1234567890123456789012345", "A".repeat(Math.abs(delta))); // Push delta to stack
            lines.push(delta < 0 ? "12345678901" : "1234567890"); // Subtract or add?
        }
        lines.push("123456789012", "1234567890123456"); // Duplicate then print
        topValue = charCode;
    }
    lines.push("12345678901234567890123"); // Pop top value

    return lines.join('\n');
}