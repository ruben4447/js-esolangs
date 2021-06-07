# ASCII Dots
ASCII Dots has dots which move around a 2D grid

Each dot may be in a certain state which dictates how it executes

## Parsing
First, each character is parsed to an instance of `Char` class

## Travel State
**Default**
When dot is moving

### Next
- ` ` : die
- `&` and not operation : die
- `~` : `TildeState`
- `#` : `ValueState`
- `@` : `IdState`
- `$` : `PrintState`
- `[]{}` and moving vertically : die
- `[` : `SquareState`
- `{` : `CurlyState`
- `-` and horizontal : die
- `|` and vertical : die
- `:` and `=0` : die
- `;` and `=1` : die
Else, `TravelState`

## Run
- `\` : change movement `(x,y)` -> `(y,x)`
- `/` : change movement `(x,y)` -> `(-y,-x)`
- `(` : `RIGHT`
- `)` : `LEFT`
- `>` and vertical : `RIGHT`
- `<` and vertical : `LEFT`
- `^` and horizontal : `UP`
- `v` and horizontal : `DOWN`
- `*` : copy new dot moving in all directions other than original

Move dot at end

## Value State
Manipulate `dot.value` property

### Next
- `a` : `ValueState`
- `?` : `ValueState`
- `[0-9]` : `ValueState`
Else, `TravelState`

### Run
- `[0-9]` : add to dot's value.
    - First digit: `value=digit`
    - Else, `value=value*10 + digit`
- `a` : enable ASCII mode
- `?` : get user input. If ASCII mode is...
    - `true` : set value to ASCII code of char, or `-1` if `EOF`
    - `false` : set value to `num(input)`

Move dot at end

## ID State
Manipulate `dot.id` property

### Next
- `a` : `IdState`
- `?` : `IdState`
- `[0-9]` : `IdState`
- `{}[]` :
    - Moving vertically : die
    - Else, `IdState`
- `[` : `SquareState`
- `{` : `CurlyState`
- `~` : `TildeState`
- `:` :
    - `id=0` : die
    - Else, `TravelState`
- `;` :
    - `id=1` : die
    - Else, `TravelState`

Else, determine next state as if we were in `TravelState`

### Run
- `[0-9]` : add to dot's id.
    - First digit: `id=digit`
    - Else, `id=id*10 + digit`
- `a` : enable ASCII mode
- `?` : get user input. If ASCII mode is...
    - `true` : set id to ASCII code of char, or `-1` if `EOF`
    - `false` : set id to `num(input)`

Move dot at end

## Print State
Prints stuff to STDOUT. Default: prints to STDOUT then a newline, unless disabled.

### Next
- If we are pending an exit, determine next state as if we were `TravelState`
- `$_a#@` : `PrintState`
- ` ` : die
- `"` : `PrintStringState` with quote `"`
- `'` : `PrintStringState` with quote `'`

Else, determine next state as if we were `TravelState`

### Run
- `_` : disable print-default-newline
- `a` : enable ASCII mode
- `#` : add dot's value to stuff to print (if ASCII is enabled, add the ascii char. If newline is not disabled, add newline to end of data) and mark state as pending exit
- `@` : do same as `#` but with the dot's ID

Move dot at end

## PrintStringState
*Extends `PrintState`*

### Next
If pending exit, detemine state as if we were `TravelState`
Else, return `this`

### Run
If `char == this.quote`, print stuff (with newline if not disabled) and mark state as pending exit

Else, append character to stuff to print

Move dot at end

**NOT COMPLETE**