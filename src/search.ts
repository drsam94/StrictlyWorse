import { Card, Direction } from './card.js'
import { isSetEqual, isSubsetOf, isProperSubsetOf } from './set.js'
import { Oracle } from './oracle.js'
import { TableElem } from './table_elem.js'

enum SearchKey {
  CMC,
  Color,
  Type,
  Power,
  Toughness,
  Date,
  Error
};

enum SearchOperator {
  LT,
  LE,
  GT,
  GE,
  EQ,
  EX,
  Error,
};
type SearchValue = number | Set<string>
class SearchComponent {

  private key: SearchKey;
  private operator: SearchOperator;
  private value: SearchValue;
  private negated: boolean;
  private static readonly re = /(-?)([^!:<>=]*)([!:<>=]*)"?(.*)"?/g;

  constructor(part: string) {
    const matches = [...part.matchAll(SearchComponent.re)][0];
    const neg: boolean = matches[1] == "-";
    this.key = SearchComponent.getSearchKey(matches[2] ?? "");
    const op = SearchComponent.getOperator(matches[3] ?? "");
    this.value = SearchComponent.extractValueFromComponent(matches[4] ?? "", this.key);
    const consol = SearchComponent.consolidateNegation(op, neg);
    this.operator = consol[0];
    this.negated = consol[1];
  }

  public matches(card: TableElem) {
    const cv = SearchComponent.extractValueFromCard(card, this.key);

    const baseMatch = SearchComponent.compareValues(cv, this.value, this.key, this.operator);
    return baseMatch != this.negated;
  }

  private static readonly numberFuncs: Partial<Record<SearchOperator, (x: number, y: number) => boolean>> = {
    [SearchOperator.EQ]: (x, y) => (x == y),
    [SearchOperator.LE]: (x, y) => (x <= y),
    [SearchOperator.LT]: (x, y) => (x < y),
    [SearchOperator.EX]: (x, y) => (x == y)
  }
  private static readonly setFuncs: Partial<Record<SearchOperator, (x: Set<string>, y: Set<string>) => boolean>> = {
    [SearchOperator.EQ]: (x, y) => (isSetEqual(x, y)),
    [SearchOperator.LT]: (x, y) => (isProperSubsetOf(x, y)),
    [SearchOperator.LE]: (x, y) => (isSubsetOf(x, y)),
    [SearchOperator.EX]: (x, y) => (isSetEqual(x, y))
  }
  private static compareValues(lhs: SearchValue, rhs: SearchValue, key: SearchKey, op: SearchOperator): boolean {
    type Funcs = Record<SearchOperator, (x: SearchValue, y: SearchValue) => boolean>;
    let funcs = SearchComponent.numberFuncs as Funcs;
    switch (key) {
      case SearchKey.Color:
      case SearchKey.Type:
        funcs = SearchComponent.setFuncs as Funcs;
    }
    return funcs[op](lhs, rhs);
  }

  private static decomposeTypeLine(line: string): Array<string> {
    const parts = line.split(" ");
    const ret: Array<string> = [];
    for (const part of parts) {
      if (part.length == 0) {
        // em dash
        continue
      }
      ret.push(part.toLowerCase());
    }
    return ret;
  }
  private static parseColorValue(value: string): Set<string> {
    const uc = value.toUpperCase();
    if (uc == "C") {
      return new Set();
    }
    // Special case of "M" not supported here
    return new Set(value.toUpperCase().split(""));
  }
  /// Interpret a date YYYY[-MM[-DD]] as a integral months since 0 AD
  /// and a fractional component for date
  private static parseTimeValue(value: string): number {
    const splits = value.split("-");
    let ret = +splits[0] * 12;
    if (splits.length > 1) {
      ret += +splits[1] - 1;
    }
    if (splits.length > 2) {
      ret += .01 * +splits[2];
    }
    return ret;
  }
  private static extractValueFromComponent(value: string, key: SearchKey): SearchValue {
    switch (key) {
      case SearchKey.CMC:
      case SearchKey.Power:
      case SearchKey.Toughness:
        return +value;
      case SearchKey.Date:
        return SearchComponent.parseTimeValue(value);
      case SearchKey.Color:
        return SearchComponent.parseColorValue(value);
      case SearchKey.Type:
        return new Set([value.toLowerCase()]);
    }
    return 0;
  }
  private static extractValueFromCard(card: TableElem, key: SearchKey): SearchValue {
    switch (key) {
      case SearchKey.CMC:
        return card.cmc;
      case SearchKey.Color:
        return new Set(card.colors);
      case SearchKey.Type:
        return new Set(SearchComponent.decomposeTypeLine(card.type));
      case SearchKey.Power:
        return card.pow;
      case SearchKey.Toughness:
        return card.tou;
      case SearchKey.Date:
        return SearchComponent.parseTimeValue(card.release);
    }
    return 0;
  }

  private static getOperator(key: string): SearchOperator {
    if ([":", "="].indexOf(key) != -1) {
      return SearchOperator.EQ;
    } else if ([">=", "=>"].indexOf(key) != -1) {
      return SearchOperator.GE;
    } else if (["<=", "=<"].indexOf(key) != -1) {
      return SearchOperator.LE;
    } else if (key == "<") {
      return SearchOperator.LT;
    } else if (key == ">") {
      return SearchOperator.GT;
    } else if (key == "!") {
      return SearchOperator.EX;
    } else {
      return SearchOperator.Error;
    }
  }

  private static consolidateNegation(op: SearchOperator, neg: boolean): [SearchOperator, boolean] {
    if (op == SearchOperator.GT) {
      return [SearchOperator.LE, !neg];
    } else if (op == SearchOperator.GE) {
      return [SearchOperator.LT, !neg];
    } else {
      return [op, neg];
    }
  }
  private static getSearchKey(key: string): SearchKey {
    if (["c", "color", "colour"].indexOf(key) != -1) {
      return SearchKey.Color
    }
    if (["cmc", "mv", "manavalue"].indexOf(key) != -1) {
      return SearchKey.CMC;
    }
    if (["t", "type"].indexOf(key) != -1) {
      return SearchKey.Type;
    }
    if (["p", "pow", "power"].indexOf(key) != -1) {
      return SearchKey.Power;
    }
    if (["tou", "toughness"].indexOf(key) != -1) {
      return SearchKey.Toughness;
    }
    if (["date", "year"].indexOf(key) != -1) {
      return SearchKey.Date;
    }
    return SearchKey.Error;
  }
};

export class SearchMatcher {
  private oracle: Record<string, any>;
  private components: Array<SearchComponent>;
  constructor(query: string, oData: Oracle) {
    this.oracle = oData.all_cards;

    const parts = query.match(/\S+|"[^"]+"/g) ?? [];
    this.components = [];
    for (const part of parts) {
      if (!part) {
        continue;
      }
      this.components.push(new SearchComponent(part));
    }
  }

  public match(card: Card): boolean {
    const elem = new TableElem(card, this.oracle[card.name], Direction.None);
    for (const component of this.components) {
      if (!component.matches(elem)) {
        return false;
      }
    }
    return true;
  }
};