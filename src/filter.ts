
import { Oracle, FilterCategory } from "./oracle.js"

export class GlobalFilter {
  private bitset: number;
  private oracle: Oracle

  public constructor(bs: number, orcl: Oracle,) {
    this.bitset = bs;
    this.oracle = orcl;
  }

  public matches(cat: FilterCategory): boolean {
    return (this.bitset & (1 << (+cat))) != 0;
  }

  public shouldProcess(relation: Array<string>): boolean {
    for (let i = 0; i < 2; ++i) {
      if (!this.matches(this.oracle[relation[i]].filter_category)) {
        return false;
      }
    }
    return true;
  }

};