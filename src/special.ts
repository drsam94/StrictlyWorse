import { Direction } from './card.js'
// NB: feature I didn't fully implement, idea of specialness would be to document certain
// edges as special
const specialSet: Set<string> = new Set();

function concatSpecial(name1: string, name2: string): string {
  return name1 + "__" + name2;
}
function isSpecial(name1: string, name2: string): boolean {
  return specialSet.has(concatSpecial(name1, name2));
}
function addSpecialPair(name1: string, name2: string): void {
  specialSet.add(concatSpecial(name1, name2));
}
function getPointerIfSpecial(name1: string, name2: string, dir: Direction): string {
  if (dir === Direction.Worse) {
    const temp = name1;
    name1 = name2;
    name2 = temp;
  }
  if (isSpecial(name1, name2)) {
    return name1;
  }
  return "";
}