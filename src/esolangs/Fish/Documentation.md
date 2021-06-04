# `><>` aka Fish

## Memory
Fish has one base stack.

New stacks may be created. Each stack has one associated register.

The official interprer has the `-v` options which allows pre-fed input to the stack. This can be achieved via the `Push to Stack` button.

## Literals
- `[0-9a-f]` : push decimal number to stack
- `"..."` or `'...'` : push every character in the string as a character code to the stack

## Movement
The movement vector is added to the current position vector in the 2D grid every tick.

There are four instructions to change the movement vector definatley: `<`, `>`, `^`, `v` which correspond to `left`, `right`, `up`, `down` respectively. The `x` command chooses a random direction.

`Mirrors` bounds the movement vector depending on the direction that it is currently moving.
- `/` : `(x, y)` -> `(-y, -x)`
- `\` : `(x, y)` -> `(y, x)`
- `|` : `(x, y)` -> `(-x, y)`
- `_` : `(x, y)` -> `(x, -y)`
- `#` : `(x, y)` -> `(-x, -y)`

## Commands

### Halt - `;`
Stops execution.

### Portal - `.`
Pop values `y`, `x`. Move to `(x, y)`.

### Trampolining
- `!` - unconditional. Skip next instruction.
- `?` - conditional. Skip next instruction only if the popped value from the stack `== 0`

### Maths
Pops two values `a` and `b`. Pushes result of `b <op> a`.
- `+` : Addition
- `-` : Subtraction
- `*` : Multiplication
- `,` : Division
- `%` : Modulus

*N.B.* Division by zero throws an error

### Comparison
Pops two values `a` and `b`. Pushes result of `b <op> a`.
- `=` : Equality `b == a`
- `(` : Greater than `b > a`
- `)` : Less than `b < a`

### Stack Manipulation
- `:` : Duplicates top value of the stack
- `~` : Pop value from the stack
- `$` : Swap top two values on the stack - `[ a b c ]` -> `[ a c b ]`
- `@` : Swap top three items on the stack - `[ a b c d ]` -> `[ a d b c ]` 
- `}` : Rotate right - `[ 1 2 3 4 ]` -> `[ 4 1 2 3 ]`
- `{` : Rotate left - `[ 1 2 3 4 ]` -> `[ 2 3 4 1 ]`
- `r` : Reverses the stack - `[ 1 2 3 4 ]` -> `[ 4 3 2 1 ]`
- `l` : Push size of stack to the stack
- `[` : Create new stack, and populate with the popped value of `n` items - `[ [ 1 2 3 4 5 2 ] ]` -> `[ [ 1 2 3 ] [ 4 5 ] ]`
- `]` : Remove current stack, moving items into topmost stack. If this is the last stack, instead push an empty stack - `[ [ 1 2 3 ] [ 4 5 ] ]` -> `[ 1 2 3 4 5 ]`

### I/O
- `o` : Pop value of stack and output as character
- `n` : Pop value and output as a number
- `i` : Get single character from STDIN. Push its ASCII code to the stack (`EOF` = `-1`)

### Register - `&`
Each stack in the stack has an associated register.

If the register is empty, pop the stack and set the register equal to this value.

If the register is not empty, push the register's contents to the stack and empty the register.
