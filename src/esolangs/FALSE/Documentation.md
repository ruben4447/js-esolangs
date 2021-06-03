# FALSE
Documentation: http://strlen.com/files/lang/false/false.txt

Test Interpreter: http://morphett.info/false/false.html

## Memory
FALSE has access to a stack, which stores integers and lambdas.

## Literals
- `<int>` - Push integer to the stack
- `'<char>` - Push character code of `<char>` to the stack

## Comments
Anything surrounded by `{}` is a comment. Comments cannot be nested.

## Arithmetic
- `+` : pop values `a` and `b`. Push `b + a`.
- `-` : pop values `a` and `b`. Push `b - a`.
- `*` : pop values `a` and `b`. Push `b * a`.
- `/` : pop values `a` and `b`. Push `b / a`.
- `_` : negate top value on stack (`* -1`)

## Logical Operations
- `&` : pop values `a` and `b`. Push `b && a` (logical AND).
- `|` : pop values `a` and `b`. Push `b || a` (logical OR).
- `~` : pop value `a`. Push `!a` (logical NOT).
- `>` : pop values `a` and `b`. Push `b > a`.
- `=` : pop values `a` and `b`. Push `b == a`.

## Stack Operations
- `$` : duplicate top item on stack
- `%` : pop topmost item from stack
- `\` : swap items on stack (`[ a b c ]` -> `[ a c b ]`)
- `@` : rotate third stack item to top (`[ a b c ] -> [ b c a ]`)
- `ø` : pop value `a`. Copy item in position `a` in the stack to the top (*N.B.* position is from the end). e.g. `1 2 3 4 5 1ø.` -> `4`

## I/O
- `^` : retrieve single character input from STDIN (`getch()`). Push ACII char code, or `-1` if `EOF` (to simulate `EOF`, press `esc` when pronmpted for GETCH)
- `,` : pop value `a` from stack. Output `a` as a character (e.g. `65` -> `A`)
- `.` : pop value `a` from stack. Output `a` as a number
- `"<string>"` : write contents of string directly to STDOUT
- `ß` : flush STDIN/STDOUT (*does nothing in this implementation*)

## Variables
In the original implementation, only `[a-z]` were supported. I my implementation, variable names can be `[A-Za-z]` and of any length.

- `:` : pops two values, `varName` and `a`. Set variable `varName` to `a`.
- `;` : pops variable name from the stack, and push the variables contents to the stack.

## Lambda and Flow Control
Anything surrounded by `[...]` is a **lambda**. Lambdas are functions.

Whenever a lambda is encountered, it is pushed to the stack.

- `!` : pops a lambda `fn` from the stack and executes it.
- `?` : pops a lambda `fn` and a boolean `b` from the stack. If `b` is `true`, `fn` will be executed.
  - This acts an if statement i.e. `if b then fn()`
  - An if-else may be constructed by `<cond>$[<true>]?~[<false>]` e.g. `1 1=$[":)"]?~[":("]?`
- `#` : while loop. Push `body` and `cond` lamdas from stack. Loop:
  1) Evaluate `cond`
  2) Pop a boolean
  3) If boolean is `true`, run `body` and go to 1).
  
  SYNTAX: `[<condition>][<loop-body>]#`
  e.g. `5a:[a;0>a;0=|][a;.a;0>[" "]?a;1-a:]#`