# Element
Wiki Link: https://esolangs.org/wiki/Element

## Memory
There are two stacks:
- **Main Stack** - where arithmetic, I/O and hash manipulation occurs
- **Control Stack** - where logical operations occur (for/while loops)

There is also an object (or hash table) for storing variables.

## Commands
*N.B.* Strings which represent numbers are treated as such.

### Text
These are parsed and pushed onto the stack. The text parsing breaks if another command is recognised, but this may be ignored by preceding the command character with a backslash `\`

Text is recognised if the character matches any non-control character, or a backslash

Text is interpreted as a number when needed.

Whitespace may be used to seperate strings/numbers e.g. `Hello World` pushes `Hello` and `World` to the stack, whereas `Hello\ World` pushes `Hello World` to the stack (as the whitespace is escaped).

### Input: `_`
Prompt user for input (type and press enter; input box will appear in console). This will be pushed to the top of the stack.

### Print: `` ` ``
Pop last item in `main` stack and print to console

### Variable Assignment: `;`
This undergoes variable assignment, and requires the stack to be at least of length 2

Two values are popped from the `main` stack. The first is treated as a variable name, and is assigned the value of the second. The variable (first item) is then assigned to the `variable` hash table.

### Variable Retrieval: `~`
Pop value off stack, treat as variable name and retrieve assigned value from hash table. If the variable does not exist, two things may happen depending on the `autovivification` setting:
- `true` : define the variable as an ampty string `''` (no error)
- `false` : throw an error

### Zero Test: `?`
Pops value from `main` stack

Push `0` to `control` stack if value `== 0` or `== '0'` or `== ''`, else push `1`

### Compare: `<`, `=`, `>`
Pops two values of `main` stack: `a` and `b`. Pushes result to `control` stack.
- If `<` : `1` if `a > b`, else `0`
- If `>` : `1` if `a < b`, else `0`
- If `=` : `1` if `a == b`, else `0`

### Transfer: `'`, `"`
Transfers one value from one stack to another
- `'` : `main` to `control`
- `"` : `control` to `main`

### Logical: `&`, `|`
Pops two values of `control` stack: `a` and `b`. Pushes result to `control` stack.
- If `&` : `1` if `a AND b`, else `0`
- If `|` : `1` if `a OR b`, else `0`

### Not: `!`
Pops value from `control` stack

Push `1` to `control` stack if value `== 0` or `== '0'` or `== ''`, else push `0` (so behaves like logical NOT)

### Discard: `#`
Pops value from `main` stack

### Maths: `+`, `*`, `/`, `%`, `^`
Pops two values from `main`: `a` and `b`. Pushed result to `main` stack.
- If `+` : `a + b`
- If `*` : `a * b`
- If `/` : `b / a`
- If `%` : `b % a`
- If `^` : `b ** a` (`pow(b, a)`)

### Negate: `-`
Pops value from `main` stack, negates it (`* -1`) and push onto `main` stack

### Move: `@`
Pops two items from the `main` stack: `a` and `b`.

Moves the `x`th thing to the `y`th position in the `main` stack.

e.g. Program `e l e m e n t 1 3@`: (swap item `1` [`n`] to position `3` [after `e`, before `m`])
- `main` stack before swap: `e, l, e, m, e, n, t`
- `main` stack after swap: `e, l, e, n, m, e, t`

### Length: `$`
Pop item from `main` stack and push its length to the `main` stack

### Repeat: `:`
Pop two values from `main`: `a` and `b`

Push `b` `a` times onto the `main` stack

e.g. `99 5:` would push `99` 5 times onto the `main` stack

### Concatenation: `.`
Pop two values from the `main` stack, concatenate them and push to `main` stack

e.g. `Hello World.` -> `HelloWorld`

### Character Conversion: `,`
Pop value from `main` stack. Push the value as a character (`chr(x)` or `String.fromCharCode(x)`), then push its ASCII value (`ord(x)` of `x.charCodeAt(0)`)

### Remove First: `(`
Pops value from `main` stack. Remove first character then push it to `main` stack then push first character.

### Remove First: `)`
Pops value from `main` stack. Remove last character then push it to `main` stack then push last character.

## Loops
"stack" represents `control` stack

### For Loop: `[...]`
View top item of stack (do not pop). Run code inside `[]` that many times.

### While Loop: `{...}`
Every time `{` is encountered, view top item of stack. If item `> 0`, run code inside `{}` and jump back to `{`. Else, jump to `}`