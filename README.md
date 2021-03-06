# js-esolangs
An interactive environment to execute a variety of esolangs

## Available esolangs
Interpreters for each esolang can be found in `src/esolangs/<lang>/Interpreter.js`

Implemented languages:
- [Brainfuck](https://esolangs.org/wiki/Brainfuck)
- [Element](https://esolangs.org/wiki/Element)
- [Length](https://esolangs.org/wiki/Length)
- [Befunge](https://esolangs.org/wiki/Befunge)
- [`///` aka Slashes](https://esolangs.org/wiki////)
- [Beatnik](https://esolangs.org/wiki/Beatnik)
- [Airplane Food](https://esolangs.org/wiki/Airline_food)
- [FALSE](https://esolangs.org/wiki/FALSE)
- [Underload](https://esolangs.org/wiki/Underload)
- [Fish](https://esolangs.org/wiki/Fish)

For information on each language, view `src/esolangs/<lang>/Documentation.md`

## Overview
This webpage is split into several parts:

### Config
This fieldset contains language selection and other universal options.

It also shows the current status of the interpreter - this is important (e.g. interpreter may be waiting for input)

Buttons:
- **Restart** : restarts the interpreter from scratch (kills the current `Worker` and creates a new one)
- **Clear Console** : clear console at bottom of page
- **Edit Console** : change dimensions of console

### Dynamic
This section's contents vary language to language. It may show stacks, hash tables, memory tapes etc... This is designed to help understand what the language is doing.

### User Control
This section allows the user to control the interpreter. They may enter code, and choose from buttons bellow the input (these vary language to language). Some common buttons include:
- **Reset** : Resets the interpreter (instruction pointers are initialised, stacks are dumped etc...)
- **Interpret** : Interpret the code
- **Step** : Step through the code
- **Text to Code** : prompt for text, then show this text written in the selected esolang

### Console
This is where text is printed from the application and acts as STDOUT for the esolang. It also acts as the STDIN, with two input modes:
- `Input` : an arbitrary string may be inputted. Press enter to submit. A cursor will appear in the console when an input is prompted.
- `Getch` : a single character may be inputted.