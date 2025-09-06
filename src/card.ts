export enum Direction {
  Worse, // Cards worse than this card, indicating this card is good
  Better, // Cards better than this card, indicating this card is bad
  None, // Used for cards unafiliated with ordering
};

export function opDir(d: Direction) {
  switch (d) {
    case Direction.Worse:
      return Direction.Better;
    case Direction.Better:
      return Direction.Worse;
    case Direction.None:
      return Direction.None;
  }
}
export class DirStats {
  public cards: Array<Card> = [];
  public degree: number = 0;
  public total: number = 0;
};

export class Card {
  public name: string;
  private worseStats: DirStats = new DirStats();
  private betterStats: DirStats = new DirStats();

  constructor(nm: string) {
    this.name = nm;
  }

  public static isPlaceholderName(name: string, allowMorph: boolean = true): boolean {
    const phWords = ["MORPH", " Instant ", " Cycling", " DAMAGE ", " STATS ", " DESTROY ", " DRAW "];
    for (const word of phWords) {
      if (name.indexOf(word) > (allowMorph ? 0 : -1)) {
        return true;
      }
    }
    return (name.indexOf('/') > 0 && name.indexOf('//') < 0);
  }

  public isPlaceholder(): boolean {
    return Card.isPlaceholderName(this.name);
  }
  public stats(dir: Direction): DirStats {
    return dir == Direction.Worse ? this.worseStats : this.betterStats;
  }
};

export enum CardCategory {
  Worst,
  Best,
  Mapped,
  Unmapped,
  Unknown
};