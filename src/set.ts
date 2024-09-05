export function addUnion(src: Set<string>, added: Set<string>): void {
    for (const x of added) {
        src.add(x);
    }
}

export function isSubsetOf(lhs: Set<any>, rhs: Set<any>): boolean {
    for (const x of lhs) {
        if (!rhs.has(x)) {
            return false;
        }
    }
    return true;
}

export function isProperSubsetOf(lhs: Set<any>, rhs: Set<any>): boolean {
    return isSubsetOf(lhs, rhs) && lhs.size < rhs.size;
}

export function isDisjoint(lhs: Set<any>, rhs: Set<any>): boolean {
    for (const x of lhs) {
        if (rhs.has(x)) {
            return false;
        }
    }
    return true;
}

export function isSetEqual(lhs: Set<any>, rhs: Set<any>): boolean {
    return isSubsetOf(lhs, rhs) && lhs.size == rhs.size;
}