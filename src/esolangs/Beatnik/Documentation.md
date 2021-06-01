# Beatnik
Anything other than letters are removed. Each word is translated into its Scrabble score then executed.

## Commands
Any number which is not a command is a no-op and is ignored.

# Push: `5`
Push the next word's value onto the stack (and skip)

e.g. `Sand`

# Pop: `6`
Pop top value from stack

e.g. `Hen`

# Add: `7`
Pop two values `a` and `b`. Push `b + a`.

e.g. `Maise`, `Orange`

# Input: `8`
Get a character from STDIN and push its ascii value to the stack

e.g. `Came`, `Come`

# Print: `9`
Pop a number and output its ascii character

e.g. `King`, `Antidote`, `Study`

# Subtract: `10`
Pop two values `a` and `b`. Push `b - a`.

e.g. `homie`, `shame`, `religious`

# Swap: `11`
Swap top values on the stack.

e.g. `High`, `Captain`, `Standards`

# Duplicate: `12`
Pop a value and push it twice.

e.g. `Traphole`, `Broken`, `Ninja`

# Forward Skip if Zero: `13`
Pop a value `a`. Skip forward `n` words (determined by following value) if `a == 0`.

e.g. `Joy`

# Forward Skip if not Zero: `14`
Pop a value `a`. Skip forward `n` words (determined by following value) if `a != 0`.

e.g. `Plethora`, `Chetah`, `Choke`

# Backward Skip if Zero: `15`
Pop a value `a`. Skip backwards `n` words (determined by following value) if `a == 0`. Else, interpret argument as an instruction and continue execution.

e.g. `Husky`, `Shufty`

# Backward Skip if not Zero: `16`
Pop a value `a`. Skip backwards `n` words (determined by following value) if `a != 0`. Else, interpret argument as an instruction and continue execution.

e.g. `Jupiter`, `Daylight`

# Halt: `17`
Stop program execution.

e.g. `Daylights`