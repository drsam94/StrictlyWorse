import { Card, Direction } from './card.js'

export const getPTString = (oracle: any): string => {
  if (oracle.power === undefined) {
    return "";
  }
  return oracle.power + " / " + oracle.toughness;
};

const costCache: Record<string, HTMLElement> = {};
export function renderCost(cost: string): HTMLElement {
  if (costCache[cost] !== undefined) {
    return costCache[cost].cloneNode(true) as HTMLElement;
  }
  const rootNode = document.createElement("div");
  rootNode.style.display = "inline-block";
  // Grab all the pieces in {}
  const re = /\{([^{}]*)\}([^{}]*)/g;
  for (const match of cost.matchAll(re)) {
    // naming convention to avoid / in filenames
    const sym = match[1].replace(/\//g, '_');
    const img = document.createElement("img");
    img.src = "res/" + sym + ".svg";
    img.style.width = "15";
    img.style.height = "15";
    img.style.position = "float";
    rootNode.appendChild(img);
    if (match[2]) {
      const p = document.createElement("span");
      p.textContent = match[2];
      p.style.position = "float";
      rootNode.appendChild(p);
    }
  }
  return rootNode;
}
export class TableElem {
  public name: string;
  public colors: Array<string>;
  public cost: HTMLElement;
  public cmc: number;
  public type: string;
  public pt: string;
  public pow: number;
  public tou: number;
  public degree: number;
  public totalWorse: number;

  constructor(card: Card, oracle: any, dir: Direction) {
    const oDir = dir == Direction.Better ? Direction.Worse : Direction.Better;
    this.name = card.name;
    this.colors = oracle.colors ?? [];
    let cost = "";
    if (oracle.mana_cost) {
      cost = oracle.mana_cost;
    } else if (oracle.card_faces) {
      cost = oracle.card_faces[0].mana_cost;
      if (oracle.card_faces[1].mana_cost) {
        cost += "//" + oracle.card_faces[1].mana_cost;
      }
    }
    this.cost = renderCost(cost);
    this.cmc = oracle.cmc;
    this.type = oracle.type_line;
    const emDash = '—';
    const enDash = '-';
    this.type = this.type.replace(emDash, enDash);
    if (this.type.length > 20) {
      this.type = this.type.substring(0, 20) + ". . . ";
    }
    this.pt = getPTString(oracle);
    this.pow = +oracle.power || 0;
    this.tou = oracle.toughness || 0;
    this.degree = card.stats(oDir).degree;
    this.totalWorse = card.stats(oDir).total;
  }
}