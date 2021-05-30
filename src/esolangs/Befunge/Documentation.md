# Befunge
Befunge is a 2 dimensional language, with control flow moving around this 2D plane as directed by a movement vector.

Starting position is `(0,0)` with movement `(1,0)` (`rtl` / `>`)

Other sources:
- https://catseye.tc/view/Befunge-93/doc/Befunge-93.markdown

## Memory
Befunge has access to a single stack

## Literals
Strings are enclosed by `"`. When in a string, any character's ASCII value is pushed to the stack.

If a digit is encountered (`[0-9]`) then this is pushed to the stack as a number.

## Wrapping
If a boundary is encountered, the current position is wrapped around to the corresponding edge.

The number of times this may be done consecutively may be established in the options popup. A value `< 1` will effectively disable this feature.

## Commands

### Whitespace: ` `
No-operation

### Halt: `@`
Stop program

### Add: `+`
Pop two values `a` and `b` and push `b + a`

### Subtract: `-`
Pop two values `a` and `b` and push `b - a`

### Multiply: `-`
Pop two values `a` and `b` and push `b * a`

### Divide: `/`
Pop two values `a` and `b` and push `b / a`

### Modulus: `%`
Pop two values `a` and `b` and push `b % a`

### Not: `!`
Pop a value `a`. Push `1` if `a == 0`, else push `0`

### Greater Than: `` ` ``
Pop two values `a` and `b`. Push `1` if `b > a`, else push `0`

### Change Position: `<`, `>`, `^`, `v`
Change position `left`, `right`, `up`, `down` respectively

### Change Position Random: `?`
Change direction to a random choice of `<`, `>`, `^`, `v`

### Horizontal If: `_`
Pop value `a` from stack. If `a == 0`, set direction to `>`, else `<`

### Vertical If: `|`
Pop value `a` from stack. If `a == 0`, set direction to `v`, else `^`

### Duplicate: `:`
Push the top value of the stack

### Swap: `/`
Swap top two values on the stack - `[ a b c ]` -> `[ a c b ]`

### Pop: `$`
Pop value from the stack

### Print as Number: `.`
Pop value `a` from stack and output as a number

### Print as ASCII: `,`
Pop value `a` from stack and output as an ASCII character

### Jump: `#`
Jump over next instruction (in direction of movement vector)

### Input Number: `&`
Fetches number from STDIN and pushes to the stack

### Input Character: `~`
Fetches single character from STDIN and pushes its ASCII code to the stack

### Get: `g`
Pops values `y` and `x` from the stack, and push character at position `(x,y)` in the source code to the stack.

### Put: `p`
Pops values `y`, `x` and `val` from the stack. Place the character with ASCII code `val` at position `(x,y)` in the source code.