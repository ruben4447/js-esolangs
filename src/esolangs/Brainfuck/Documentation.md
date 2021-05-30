# Brainfuck
Wiki Link: https://esolangs.org/wiki/Brainfuck

## Memory
Brainfuck operates with a single memory reel. There is a pointer which may point to a single cell, which stores a number.

In my implementation, the pointer may wrap around the reel

## Commands
*N.B.* All other characters are ignored by the interpreter.

# `>`
Moves the pointer to the right

# `<`
Moves the pointer to the left

# `+`
Increments data in cell at pointer

# `-`
Decrements data in cell at pointer

# `.`
Outputs the character in the cell at the pointer as an ASCII character. (e.g. 65 -> `A`)

# `,`
Requests **one** character of input (like C++ `getch()`)

# `[`
Jump past the matching `]` if the cell at the pointer `== 0`

# `]`
Jump back to the matching `[` if the cell at the pointer `!= 0`