# `///` (Slashes)
Slashes is a program based on string replacement

The program is fed an input string. Program execution stops when the program string is empty.

Syntax: `pattern/replacement/string`
- `pattern` : pattern to be replaced
- `replacement` : the replacement
- `string` : target string

e.g. `/Goodbye/Hello/Goodbye World` -> `Hello World`

Everything before the first unescapes `/` is printed

e.g. `Hello/foo/ world!/foo` prints `Hello world!`

e.g. `/Goodbye/Hello//World/Universe/Goodbye World` prints `Hello Universe`

## Dynamic Content
*This is about my application and how it relates to the language*

Unlike many other esoteric languages, `///` has no concept of *storage* like a stack or hash table. The dynamic content section of the webpage contains the following fields:
- `pat`: *pattern* - The pattern which is being hunted for.
- `rep` : *replacement* - What the pattern is being replaced by.

If both variables are empty, the interpreter is scanning the program and extracting the `/pattern/replacement/` strings. If they are populated, the interpreter is in the substitution state (finding/replacing `pattern` with `replacement`)