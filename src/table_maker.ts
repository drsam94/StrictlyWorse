import { TableElem, renderCost } from './table_elem.js';
import { Card, CardCategory, Direction } from './card.js'
import { getOracleData, getCategory, getOracle } from './card_maps.js';
import { getImageURL } from './image_url.js'
import { imbueHoverImage } from './hover.js';
import { displayCharts } from './navigate.js';

function makeElement(type: string, parent?: Node, text?: string): HTMLElement {
  const elem = document.createElement(type);
  elem.className = "mytable";
  if (text) {
    elem.textContent = text;
  }
  if (parent) {
    parent.appendChild(elem);
  }
  return elem;
};

enum TableColumn {
  Name,
  Cost,
  Degree,
  TotalWorse,
  Category,
}

class FlagsState {
  private flags: Array<string> = []
  private flagValues: Array<boolean> = []
  private onChangeCB: (p: HTMLElement) => void;
  private parent: HTMLElement | null;
  private colors = ["{W}", "{U}", "{B}", "{R}", "{G}", "{C}"];
  private types = ["Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Land"];

  constructor(ocb: (p: HTMLElement) => void = (x) => { }) {
    this.flags = [...this.colors, ...this.types];
    this.flagValues = new Array(this.flags.length);
    this.flagValues.fill(true);
    this.onChangeCB = ocb;
    this.parent = null;
  }

  public render(parent: HTMLElement): HTMLElement {
    this.parent = parent;

    const flagsDiv = makeElement("div", parent);
    // For now this is specific to labels that are many symbols
    for (let i = 0; i < this.flags.length; ++i) {
      const cbDiv = document.createElement("div");
      cbDiv.style.display = "inline-block";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const capturedI = i;
      checkbox.onchange = () => {
        this.flagValues[capturedI] = checkbox.checked;
        if (this.parent) this.onChangeCB(this.parent);
      };
      checkbox.checked = this.flagValues[i];
      const textLabel = (text: string) => {
        const rootNode = document.createElement("div");
        rootNode.style.display = "inline-block";
        const childNode = document.createElement("p");
        childNode.innerText = text;
        rootNode.appendChild(childNode);
        return rootNode;
      };
      const labelMaker = i < 6 ? renderCost : textLabel;

      flagsDiv.appendChild(labelMaker(this.flags[i]));
      cbDiv.appendChild(checkbox);
      flagsDiv.appendChild(cbDiv);
      if (i == 5) {
        flagsDiv.appendChild(document.createElement("br"));
      }
    }
    return flagsDiv;
  }

  public getColorFlags(): Array<boolean> {
    return this.flagValues.slice(0, 6);
  }
  public getTypeFlags(): Record<string, boolean> {
    const ret: Record<string, boolean> = {};
    for (let i = 0; i < this.flags.length; ++i) {
      ret[this.flags[i]] = this.flagValues[i];
    }
    return ret;
  }
}

export class TableMaker {
  private column: TableColumn = TableColumn.Cost;
  private increasing: boolean = true;
  private swData: Array<TableElem>;
  private dir: Direction;
  private flags: FlagsState;

  constructor(cards: Array<Card>, dir: Direction) {
    this.swData = [];
    for (const card of cards) {
      const [orcle, category] = getOracleData(card.name);
      if (!orcle) {
        continue;
      }

      this.swData.push(new TableElem(card, orcle, category, dir));
    }
    this.dir = dir;
    this.flags = new FlagsState((p: HTMLElement) => { this.renderTable(p); });
  }

  private makeClickSort(elem: HTMLElement, parent: HTMLElement, column: TableColumn) {
    elem.onclick = () => {
      if (column === this.column) {
        this.increasing = !this.increasing;
      } else {
        this.increasing = true;
        this.column = column;
      }
      this.renderTable(parent);
    }
  }
  public renderTable(parent: HTMLElement) {
    this.cardSort();
    parent.replaceChildren("");
    const flagsDiv = this.flags.render(parent);
    const table = makeElement("table", parent);
    const hdrRow = makeElement("tr", table);
    this.makeClickSort(makeElement("th", hdrRow, "Card"), parent, TableColumn.Name);
    this.makeClickSort(makeElement("th", hdrRow, "Cost"), parent, TableColumn.Cost);
    makeElement("th", hdrRow, "Type");
    makeElement("th", hdrRow, "P / T");
    if (this.dir != Direction.None) {
      this.makeClickSort(makeElement("th", hdrRow, "Degree"), parent, TableColumn.Degree);
      this.makeClickSort(makeElement("th", hdrRow, "Total " + (this.dir == Direction.Worse ? "Worse" : "Better")), parent, TableColumn.TotalWorse);
    } else {
      this.makeClickSort(makeElement("th", hdrRow, "Category"), parent, TableColumn.Category);
    }

    // Making a template row and cloning it substantially speeds up DOM creation here
    // (something like 5-10x)
    const numColumns = 6 - +(this.dir == Direction.None);
    const templateRow = makeElement("tr");
    for (let i = 0; i < numColumns; ++i) {
      makeElement("td", templateRow);
    }
    for (const card of this.swData) {
      if (!this.passesFilter(card)) {
        continue;
      }
      const elemRow = templateRow.cloneNode(true) as HTMLElement;
      const children = elemRow.children;
      const nameRow = children[0] as HTMLElement;
      nameRow.textContent = card.name;

      const category = getCategory(card.name);
      imbueHoverImage(nameRow, getImageURL(card.name, getOracle(category)));
      if (category != CardCategory.Unmapped) {
        nameRow.onclick = () => {
          displayCharts(card.name);
        }
      }
      children[1].appendChild(card.cost);
      children[2].textContent = card.type;
      children[3].textContent = card.pt;
      if (this.dir != Direction.None) {
        children[4].textContent = card.degree + "";
        children[5].textContent = card.totalWorse + "";
      } else {
        children[4].textContent = CardCategory[category];
        elemRow.style.backgroundColor = {
          [CardCategory.Best]: "#2A9D8F",
          [CardCategory.Worst]: "#E76F51",
          [CardCategory.Mapped]: "#F4A261",
          [CardCategory.Unmapped]: "#E9C46A",
          [CardCategory.Unknown]: "#2646F3",
        }[category];
      }
      table.appendChild(elemRow);
    }
    parent.appendChild(flagsDiv);
    parent.appendChild(table);
  }

  private passesFilter(card: TableElem): boolean {
    return this.passesColorFilter(card) && this.passesTypeFilter(card);
  }
  private passesColorFilter(card: TableElem): boolean {
    const colors = card.colors ?? [];
    const includeColors = this.flags.getColorFlags();
    if (colors.length == 0) {
      // colorless
      return includeColors[5];
    }
    for (const color of colors) {
      const idx = "WUBRG".indexOf(color);
      if (!includeColors[idx]) {
        return false;
      }
    }
    return true;
  }
  private passesTypeFilter(card: TableElem): boolean {
    const words = card.type.split(" ");
    const flags = this.flags.getTypeFlags();
    for (const word of words) {
      const val = flags[word];
      if (val === undefined || val === true) {
        continue;
      } else {
        return false;
      }
    }
    return true;
  }

  private cardSort() {
    const costCompare = (a: TableElem, b: TableElem) => {
      // TODO: use faces
      const colors = (c: TableElem) => c.colors ? c.colors.length : 2;
      const colorCountDiff = colors(a) - colors(b);
      if (colorCountDiff != 0) {
        return colorCountDiff;
      }
      const colorToNum = (color: string) => { return "WUBRG".indexOf(color); };
      if (a.colors && b.colors && a.colors.length == 1) {
        const colorDiff = colorToNum(a.colors[0]) - colorToNum(b.colors[0]);
        if (colorDiff != 0) {
          return colorDiff;
        }
      }
      return a.cmc - b.cmc
    };
    const compare = ((column: TableColumn) => {
      switch (column) {
        case TableColumn.Cost:
          return costCompare;
        case TableColumn.Degree:
          return (a: TableElem, b: TableElem) => {
            return a.degree - b.degree;
          }
        case TableColumn.TotalWorse:
          return (a: TableElem, b: TableElem) => {
            return a.totalWorse - b.totalWorse
          }
        case TableColumn.Category:
          return (a: TableElem, b: TableElem) => {
            return +(a.category - b.category);
          }
        default:
          return costCompare;
      }
    })(this.column);

    this.swData.sort((a: TableElem, b: TableElem) => { return compare(a, b) * (this.increasing ? 1 : -1) });
  }
}