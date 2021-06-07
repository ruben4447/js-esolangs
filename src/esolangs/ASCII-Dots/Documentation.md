# ASCII Dots
An esoteric programming language influenced by ASCII art.

Using code at https://github.com/aaronjanse/asciidots as a reference (this is the official interpreter).

## Dots
Defined by `.` or `•`. Must be surrounded by a path character.

Dots move around the 2D plane and carry a single, numeric value. They may interact in different ways which constitute the program's body.

### Comment
- ``` `` comment... ``` : anything after double-backticks will be ignored until EOL
- `` ` comment... ` `` : anything between single backticks will be replaced with spaces

### Death
Dots die if...
1. They encounter the `&` command
2. They encounter whitespace ` `
3. They go out of bounds of the map

### States
Each dot is in a state. This influences what each character does - multiple character sequences may build up to a final result.

For a full description on the state model, see `States.md`