import { Card, Direction, CardCategory } from './card.js'
import { isSetEqual, isSubsetOf, isProperSubsetOf } from './set.js'
import { getOracleData } from './card_maps.js'
import { TableElem } from './table_elem.js'
import { OracleItem } from './oracle.js'
import { Stats } from './stats.js'

enum SearchKey {
  CMC,
  Color,
  Type,
  Power,
  Toughness,
  ReleaseDate,
  MapDate,
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
    [SearchOperator.EQ]: isSetEqual,
    [SearchOperator.LT]: isProperSubsetOf,
    [SearchOperator.LE]: isSubsetOf,
    [SearchOperator.EX]: isSetEqual,
  }
  private static readonly typeFuncs: Partial<Record<SearchOperator, (x: Set<string>, y: Set<string>) => boolean>> = {
    [SearchOperator.EQ]: (x, y) => isSubsetOf(y, x),
    [SearchOperator.LT]: isProperSubsetOf,
    [SearchOperator.LE]: isSubsetOf,
    [SearchOperator.EX]: isSetEqual,
  }
  private static compareValues(lhs: SearchValue, rhs: SearchValue, key: SearchKey, op: SearchOperator): boolean {
    type Funcs = Record<SearchOperator, (x: SearchValue, y: SearchValue) => boolean>;
    let funcs = SearchComponent.numberFuncs as Funcs;
    switch (key) {
      case SearchKey.Color:
        funcs = SearchComponent.setFuncs as Funcs;
      case SearchKey.Type:
        funcs = SearchComponent.typeFuncs as Funcs;
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

  private static extractValueFromComponent(value: string, key: SearchKey): SearchValue {
    switch (key) {
      case SearchKey.CMC:
      case SearchKey.Power:
      case SearchKey.Toughness:
        return +value;
      case SearchKey.ReleaseDate:
      case SearchKey.MapDate:
        return Stats.parseTimeValue(value);
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
      case SearchKey.ReleaseDate:
        return Stats.parseTimeValue(card.release);
      case SearchKey.MapDate:
        return Stats.getMapDate(card.name);
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
    if (["date", "year", "release", "rel"].indexOf(key) != -1) {
      return SearchKey.ReleaseDate;
    }
    if (["mapped", "mapdate", "added"].indexOf(key) != -1) {
      return SearchKey.MapDate;
    }
    return SearchKey.Error;
  }
};

export class SearchMatcher {
  private category: CardCategory;
  private components: Array<SearchComponent>;
  constructor(query: string, category: CardCategory) {
    this.category = category;

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
    if (card.isPlaceholder()) {
      return false;
    }
    const elem = new TableElem(card, getOracleData(card.name)[0] as OracleItem, this.category, Direction.None);
    for (const component of this.components) {
      if (!component.matches(elem)) {
        return false;
      }
    }
    return true;
  }
};