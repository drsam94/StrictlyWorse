import { Card, Direction, DirStats, CardCategory } from './card.js'
import { oracleData, oracleDataUnmapped } from './oracle.js'
import { getCategory, getOracleData, getTotalChildSet, initializeTotalSets } from './card_maps.js';

export class SetInfo {
  public counts: Record<string, Record<CardCategory, number>>;
  public chronologicalSets: Array<string>;
  constructor(dag: Record<string, Card>) {
    initializeTotalSets(dag);
    this.counts = {};
    const releases: Record<string, number> = {};
    const allCards: Record<string, Array<string>> = {}
    for (const oracle of [oracleData, oracleDataUnmapped]) {
      for (const name of Object.keys(oracle.all_cards)) {
        const category = getCategory(name);
        const oData = oracle.all_cards[name];
        if (!oData) {
          continue;
        }
        const set = oData.set;
        if (!(set in this.counts)) {
          this.counts[set] = {
            [CardCategory.Mapped]: 0,
            [CardCategory.Unmapped]: 0,
            [CardCategory.Best]: 0,
            [CardCategory.Worst]: 0,
            [CardCategory.Unknown]: 0,
          };
        }
        if (!(set in allCards)) {
          allCards[set] = [];
        }
        allCards[set].push(name)
        releases[set] = Stats.parseTimeValue(oData.released_at);
        this.counts[set][category] += 1;
      }
    }
    this.chronologicalSets = Object.keys(this.counts);
    this.chronologicalSets.sort((a: string, b: string): number => {
      return releases[a] - releases[b];
    });
    console.log(allCards);
  }
};

export class Stats {
  private readonly dag: Record<string, Card>;
  private readonly setInfo: SetInfo;
  private static singleton: Stats | null;
  public constructor(dag: Record<string, Card>) {
    this.dag = dag;
    this.setInfo = new SetInfo(dag);
  }
  public static relationsCount: number = 0;
  public static get(dag: Record<string, Card>): Stats {
    if (Stats.singleton == null) {
      Stats.singleton = new Stats(dag);
    }
    return Stats.singleton;
  }
  public getRelationsCount(): number {
    return Stats.relationsCount;
  }
  public getMappedCount(): number {
    return Object.keys(oracleData.all_cards).length;
  }
  public getTotalCount(): number {
    return this.getMappedCount() + Object.keys(oracleDataUnmapped.all_cards).length;
  }

  public getExtremeBy(dir: Direction, key: keyof DirStats): [Array<Card>, number] {
    let maxDegree = 0;
    let ret: Array<Card> = [];
    for (const card of Object.values(this.dag)) {
      const thisDegree = card.stats(dir)[key] as number;
      if (thisDegree > maxDegree) {
        ret = [];
      }
      if (thisDegree >= maxDegree) {
        maxDegree = thisDegree;
        if (!card.isPlaceholder()) {
          ret.push(card);
        }
      }
    }
    return [ret, maxDegree];
  }

  public getExtremeByDegree(dir: Direction): [Array<Card>, number] {
    return this.getExtremeBy(dir, "degree");
  }
  public getExtremeByTotal(dir: Direction): [Array<Card>, number] {
    return this.getExtremeBy(dir, "total");
  }
  public getSetInfo(): SetInfo {
    return this.setInfo;
  }

  /// Interpret a date YYYY[-MM[-DD]] as a integral months since 0 AD
  /// and a fractional component for date
  public static parseTimeValue(value: string): number {
    if (value.indexOf("-") == -1) {
      // Support YYYYMMDD
      if (value.length >= 6) {
        value = value.substring(0, 4) + "-" + value.substring(4);
      }
      if (value.length >= 9) {
        value = value.substring(0, 7) + "-" + value.substring(7);
      }
    }
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

  private static mapDateMap: Record<string, string> = {};
  public static getMapDateStr(name: string): string {
    if (name in Stats.mapDateMap) {
      return Stats.mapDateMap[name];
    }
    let ret = "0000-00-00";
    let retNum = 99999999;
    const [oracleSelf, category] = getOracleData(name);
    if (category == CardCategory.Unmapped || !oracleSelf) {
      Stats.mapDateMap[name] = ret;
      return ret;
    }
    for (let dir of [Direction.Better, Direction.Worse]) {
      for (const mappedCard of getTotalChildSet(dir)[name]) {
        const oData = getOracleData(mappedCard)[0];
        if (oData === undefined) {
          continue;
        }
        const release = Stats.parseTimeValue(oData.released_at);
        if (release < retNum) {
          ret = oData.released_at;
          retNum = release
        }
      }
    }
    // Map date is the first mapping card being released, but
    // we need to max that with the card itself's release
    const base = oracleSelf.released_at;
    const baseNum = Stats.parseTimeValue(base);

    if (baseNum > retNum) {
      ret = base;
    }
    Stats.mapDateMap[name] = ret;
    return ret;
  }
  public static getMapDate(name: string): number {
    return Stats.parseTimeValue(Stats.getMapDateStr(name));
  }
};