import { TableElem, renderCost } from './table_elem.js';
import { Card, CardCategory, Direction } from './card.js'
import { getOracleData, getCategory, getOracle, getTotalChildSet } from './card_maps.js';
import { getImageURL } from './image_url.js'
import { imbueHoverImage } from './hover.js';
import { changeLocation, Page } from './navigate.js'

export function makeElement(type: string, parent?: Node, text?: string): HTMLElement {
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
  Type,
  Exemplar,
  Stats
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

export function getExemplar(name: string, dir: Direction): string | undefined {
  let exemplarPH: undefined | string = undefined;
  for (const candidate of getTotalChildSet(dir)[name].keys()) {
    if (!Card.isPlaceholderName(candidate, false)) {
      return candidate
    }
    exemplarPH = candidate;
  }
  if (exemplarPH !== undefined) {
    return getExemplar(exemplarPH, dir);
  }
  return undefined
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

  private getColumnList(): Array<TableColumn> {
    const ret: Array<TableColumn> = [TableColumn.Name, TableColumn.Cost, TableColumn.Type, TableColumn.Stats]
    if (this.dir != Direction.None) {
      ret.push(TableColumn.Degree);
      ret.push(TableColumn.TotalWorse);
    } else {
      ret.push(TableColumn.Category);
      ret.push(TableColumn.Exemplar);
    }
    return ret;
  }

  private fillColumn(column: TableColumn, cell: HTMLElement, parent: HTMLElement, card: TableElem) {
    const category = getCategory(card.name);
    function doCardColumn(name: string) {
      cell.textContent = name;

      imbueHoverImage(cell, getImageURL(name, getOracle(category)));
      if (category != CardCategory.Unmapped) {
        cell.onclick = () => {
          changeLocation(Page.card, name);
        }
      }
    }
    switch (column) {
      case TableColumn.Name:
        doCardColumn(card.name)
        break;
      case TableColumn.Cost:
        cell.appendChild(card.cost);
        break;
      case TableColumn.Type:
        cell.textContent = card.type;
        break;
      case TableColumn.Stats:
        cell.textContent = card.pt;
        break;
      case TableColumn.Degree:
        cell.textContent = card.degree + "";
        break;
      case TableColumn.TotalWorse:
        cell.textContent = card.totalWorse + "";
        break;
      case TableColumn.Category:
        cell.textContent = CardCategory[category];
        parent.style.backgroundColor = {
          [CardCategory.Best]: "#2A9D8F",
          [CardCategory.Worst]: "#E76F51",
          [CardCategory.Mapped]: "#F4A261",
          [CardCategory.Unmapped]: "#E9C46A",
          [CardCategory.Unknown]: "#2646F3",
        }[category];
        break;
      case TableColumn.Exemplar:
        if (category == CardCategory.Unmapped) {
          cell.textContent = "";
        } else {
          const dir = category == CardCategory.Best ? Direction.Worse : Direction.Better;
          const exemplar = getExemplar(card.name, dir);
          if (exemplar !== undefined) {
            doCardColumn(exemplar);
          }
        }
        break;
    }
  }

  public renderTable(parent: HTMLElement) {
    this.cardSort();
    parent.replaceChildren("");
    const flagsDiv = this.flags.render(parent);
    const table = makeElement("table", parent);
    const hdrRow = makeElement("tr", table);
    const columns = this.getColumnList();
    for (let column of columns) {
      const label = column == TableColumn.TotalWorse && this.dir == Direction.Better ? "TotalBetter" : TableColumn[column];
      this.makeClickSort(makeElement("th", hdrRow, label), parent, column);
    }
    // Making a template row and cloning it substantially speeds up DOM creation here
    // (something like 5-10x)
    const templateRow = makeElement("tr");
    for (let i = 0; i < columns.length; ++i) {
      makeElement("td", templateRow);
    }
    for (const card of this.swData) {
      if (!this.passesFilter(card)) {
        continue;
      }
      const elemRow = templateRow.cloneNode(true) as HTMLElement;
      let i = 0;
      for (const column of columns) {
        this.fillColumn(column, elemRow.children[i] as HTMLElement, elemRow, card);
        ++i;
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