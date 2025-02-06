import { Card, Direction, DirStats, CardCategory } from './card.js'
import { oracleData, oracleDataUnmapped } from './oracle.js'
import { getOracleData, getTotalChildSet } from './card_maps.js';
export class Stats {
  private readonly dag: Record<string, Card>;
  private static singleton: Stats | null;
  public constructor(dag: Record<string, Card>) {
    this.dag = dag;
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