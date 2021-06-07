import { regexNumber } from "../../utils.js";

export class Char {
    constructor(value) {
        this.value = value;
    }

    isNumber() { return regexNumber.test(this.value); }
    isDot() { return false; }
    isTilde() { return false; }
    isOperator() { return false; }
    isCurlyBracket() { return false; }
    isSquareBracket() { return false; }
    isWarp() { return false; }
    isLibWarp() { return false; }
    isSingletonLibWarp() { return false; }
    isSingletonLibReturnWarp() { return false; }
}

export class DotChar extends Char {
    constructor(value) { super(value); }
    isDot() { return true; }
}

export class OperatorChar extends Char {
    constructor(value) { super(value); }
    isOperator() { return true; }

    /** Apply operation to two values */
    apply(x, y) {
        let fn = operatorMap[this.value];
        if (typeof fn !== 'function') throw new Error(`Operator "${this.value}" : cannot apply`);
        return fn(x, y);
    }
}

export class CurlyBracketChar extends OperatorChar {
    constructor(value) { super(value); }
    isCurlyBracket() { return true; }
}

export class SquareBracketChar extends OperatorChar {
    constructor(value) { super(value); }
    isSquareBracket() { return true; }
}

export class TildeChar extends Char {
    constructor(value) {
        super(value);
        this.inverted = false;
    }
    isTilde() { return true; }
}

export class WarpChar extends Char {
    constructor(value) {
        super(value);
        this.tpid = null; // Teleporter ID
        this.dstLoc = null; // Destination location if a dot warps through this
    }
    isWarp() { return true; }
}

export class LibWarpChar extends WarpChar {
    constructor(value) { super(value); }
    isLibWarp() { return true; }
}

export class LibInnerWarpChar extends LibWarpChar {
    constructor(value) { super(value); }
}

export class LibOuterWarpChar extends LibWarpChar {
    constructor(value) { super(value); }
}

export class SingletonLibWarpChar extends LibWarpChar {
    constructor(value) { super(value); }
    isSingletonLibWarp() { return true; }
}

export class SingletonLibInnerWarpChar extends SingletonLibWarpChar {
    constructor(value) { super(value); }
}

export class SingletonLibOuterWarpChar extends SingletonLibWarpChar {
    constructor(value) { super(value); }
}