# Underload

## Memory
A single stack

## Commands

### Swap: `~`
Swaps the top two values on the stack

### Duplicate: `:`
Duplicated the top item on the stack

### Pop: `!`
Pop top value from the stack

### Concatenate: `*`
Pops two values, `a` and `b`. Pushes `ab` to the stack (concetenation) e.g. `Hello` and `World` would become `HelloWorld`

### Push: `()`
Push everything between matching `(...)` to the stack

### Enclose: `a`
Enclose top element in stack with `()`

### Insert: `^`
Pop item `a` from the stack and insert into the source code **after** the `^`.

### Print: `S`
Pop item from the stack and print it to STDOUT