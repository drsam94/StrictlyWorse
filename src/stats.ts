import { Card, Direction, DirStats } from './card.js'
import { oracleData, oracleDataUnmapped } from './oracle.js'

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
        ret.push(card)
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
};