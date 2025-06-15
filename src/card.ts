export enum Direction {
  Worse, // Cards worse than this card, indicating this card is good
  Better, // Cards better than this card, indicating this card is bad
  None, // Used for cards unafiliated with ordering
};

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

  public static isPlaceholderName(name: string): boolean {
    return (name.indexOf('/') > 0 && name.indexOf('//') < 0) ||
      name == "MORPH" || name.indexOf(" Instant ") > 0 ||
      name.indexOf(" Cycling") > 0;
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