# ASCII Dots
An esoteric programming language influenced by ASCII art.

Using code at https://github.com/aaronjanse/asciidots as a reference (this is the official interpreter).

## Dots
Defined by `.` or `•`. Must be surrounded by a path character.

Dots move around the 2D plane and carry a single, numeric value. They may interact in different ways which constitute the program's body.

### Death
Dots die if...
1. They encounter the `&` command
2. They encounter whitespace ` `
3. They go out of bounds of the map

## Paths
A dot may travel along a vertical path `|` or a horizontal path `-`.

### Mirrors
These reflect the dot depending on what direction it encounters the mirror at.
- `/` - `(x,y)` -> `(-y, -x)`
- `\` - `(x,y)` -> `(y, x)`
- `>` - If moving vertically, sets the dot's direction to `RIGHT`
- `<` - If moving vertically, sets the dot's direction to `LEFT`
- `^` - If moving horizontally, sets the dot's direction to `UP`
- `v` - If moving horizontally, sets the dot's direction to `DOWN`
- `(` - Set direction to `RIGHT`
- `)` - Set direction to `LEFT`
- `*` - Create copies of the dot travelling in all directions apart from original

### Special
- `+` - Crossing paths (dots do not interact at all)