# Airline Food
Airline Food has access to a stack where values are stored. The stack pointer points to a position in the stack.

There is a hash table, which maps variable names to positions in the stack.

## Overview
### Variable Assignment
There are two methods for variable assignment:
- `You ever notice [x]?` : Creates a variable named `x`, initialises it to `1` and pushes it to the stack
- `What's the deal with [x]?` : Creates a variable named `x`, initialises it to `1` and pushes it to the stack and sets `stack pointer` to look at `x`

*N.B.* `[x]` may be `airline food`, in which case the variable will be anonymous (no name)

### Move Stack Pointer
- `Um,` - decrements stack pointer (if possible)
- `Yeah,` - increments stack pointer (if possible)
- `Let's talk about [x].` - Move stack pointer to look at variable `x`

### Arithmetic
- **Addition**: `It's kinda like [x].` : Adds the value of `x` to the variable at the stack pointer.
- **Subtraction**: `Not like [x].` : Subtracts the value of `x` from the variable at the stack pointer.
- **Multiplication**: `Just like [x].` : Multiples the variable at the stack pointer by `x`.

### Input
The `Right?` instruction recieves input from STDIN, converts to a number and sets the variable pointed to by stack pointer to it.

e.g. `What's the deal with pigs? Right?` Creates a variable `pigs`, sets the SP to it, prompt for user input and stores it in `pigs`.

### Output
The `See?` command outputs the contents of the variable pointed to by SP to STDOUT.

Output value as an ASCII character if value is in the range `0 <= x < 0xFFFF` of the option `outputNumbers` is enabled.

### Flow Control
These act as `while` statements. They are wrapped in `So...` and `Move on...` commands.
- `So...` : If the value at SP `== 0`, jump to corresponding `Move on...`
- `Move on...` : If the value at SP `!= 0`, jump to corresponding `So...`