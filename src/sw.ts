// Author: Sam Donow, 2024


// @ts-ignore
import * as rawData from '../res/data.js';
// @ts-ignore
import * as philosophy from '../res/philosophy.js';
// @ts-ignore
import * as help from '../res/help.js';
// After months of working on this project having no clue how to harmonize the d3 import
// syntax above which I didn't want to touch, the json importing syntax, and a typescript
// import syntax, it turns out that the secret is that you have to lie about filenames in 
// the import.
// Despite the fact these are imports from typescript files with the ".ts" extension, the
// import statement needs to be based on the compiled name of the file, and the relative path
// from the compiled form of this file to the compiled form of the imported
import { CARD_HEIGHT, imbueHoverImage } from './hover.js';
import { autocomplete } from './autocomplete.js';
import { Direction, DirStats, Card, CardCategory } from './card.js';
import { addUnion } from './set.js';
import { SearchMatcher } from './search.js';
import { oracleData, oracleDataUnmapped } from './oracle.js';
import { TableMaker } from './table_maker.js';
import { Timer } from './timer.js';
import { getImageURL } from './image_url.js';
import { makeChart } from './chart.js';
import { makeDateHistogram, DateHistogramEntry } from './histogram.js';
import { displayCharts, renderChecker, renderSearch, renderTable } from './navigate.js';
import { initializeTotalSets, getMaximalCards, getTotalSet } from './card_maps.js';

function initNode(dag: Record<string, Card>, key: string): Card {
  if (!(key in dag)) {
    dag[key] = new Card(key);
  }
  return dag[key];
}

function processData(dag: Record<string, Card>, inData: Array<Array<string>>) {
  for (const elem of inData) {
    const worse = elem[0];
    const better = elem[1];
    const worseNode = initNode(dag, worse);
    const betterNode = initNode(dag, better);
    if (elem.length === 3) {
      if (elem[2] === '=') {
        dag[better] = worseNode;
        continue;
      }
    }
    worseNode.stats(Direction.Better).cards.push(betterNode);
    const betterCards = betterNode.stats(Direction.Worse).cards;
    betterCards.push(worseNode);
  }
}


const worseSet: Record<string, Set<string>> = {};
const betterSet: Record<string, Set<string>> = {};
function getTotalChildSet(dir: Direction) {
  return dir == Direction.Worse ? worseSet : betterSet;
}


function computeStats(dag: Record<string, Card>): void {
  function computeStatsRecursive(card: Card, dir: Direction) {
    const set = getTotalChildSet(dir);
    if (set[card.name] === undefined) {
      set[card.name] = new Set();
      const ws = set[card.name];
      let maxDegree = 0;
      for (const worse of card.stats(dir).cards) {
        computeStatsRecursive(worse, dir);
        ws.add(worse.name);
        addUnion(ws, set[worse.name]);
        let childDegree = worse.stats(dir).degree + (worse.isPlaceholder() ? 0 : 1);
        maxDegree = Math.max(maxDegree, childDegree);
      }
      const stats = card.stats(dir);
      stats.degree = maxDegree;
      for (const c of ws) {
        stats.total += dag[c].isPlaceholder() ? 0 : 1;
      }
    }
  }
  for (const card of Object.values(dag)) {
    computeStatsRecursive(card, Direction.Worse);
    computeStatsRecursive(card, Direction.Better);
  }
}
// { name: rootNode.name, "children": [], value: rootNode.stats(dir).total, depth: rootNode.stats(dir).degree };
class TreeNode {
  public readonly name: string;
  public children: Array<TreeNode>;
  public readonly value: number;
  public readonly depth: number;

  public constructor(sourceNode: Card, dir: Direction) {
    this.name = sourceNode.name;
    this.children = [];
    const stats = sourceNode.stats(dir)
    this.value = stats.total;
    this.depth = stats.degree
  }
};

function recurAddChildren(rootNode: TreeNode, childList: Array<Card>, dir: Direction) {
  for (const child of childList) {
    const obj = new TreeNode(child, dir);
    let newRoot = obj;
    if (!child.isPlaceholder()) {
      let childAlreadyExists = false;
      for (const chi of rootNode.children) {
        if (chi.name === child.name) {
          childAlreadyExists = true;
          break;
        }
      }
      if (!childAlreadyExists) {
        rootNode.children.push(obj);
      }
    } else {
      newRoot = rootNode;
    }
    recurAddChildren(newRoot, child.stats(dir).cards, dir);
  }
}

function recurCleanTree(rootNode: TreeNode, dir: Direction) {
  // This cleans the tree to remove instances of
  //
  //    B
  //   /
  // A
  //   \
  //    C - B
  //
  // Because B is transitively related to A, we should not also claim it is directly a child of A.
  // We generally keep the input data clean of these cases, but they can arise due to the collapsing
  // of
  const allDeeper = new Set<string>();
  const totalSet = getTotalChildSet(dir);
  for (const child of rootNode.children) {
    addUnion(allDeeper, totalSet[child.name])
  }
  const filteredChildren = [];
  for (const child of rootNode.children) {
    if (!allDeeper.has(child.name)) {
      filteredChildren.push(child);
    }
    recurCleanTree(child, dir);
  }
  rootNode.children = filteredChildren;
}
function makeTree(rootNode: Card, dir: Direction) {
  const data = new TreeNode(rootNode, dir);
  recurAddChildren(data, rootNode.stats(dir).cards, dir);

  recurCleanTree(data, dir);

  return data;
}

function extractDates<T>(collection: Iterable<T>, extract?: (arg0: T) => string): Array<DateHistogramEntry> {
  const doExtract = extract ?? ((x: T) => x as string);

  const oracle = oracleData.all_cards;

  const ret: Array<DateHistogramEntry> = [];
  for (const preName of collection) {
    const name = doExtract(preName as T);
    const data = oracle[name];
    if (data === undefined) {
      continue;
    }
    const ra = data["released_at"];
    if (ra !== undefined) {
      ret.push(new DateHistogramEntry(ra, name));
    }
  }
  return ret;
}

function doDisplayCharts(outdiv: HTMLElement, dag: Record<string, Card>, name: string, fontSize = 14): void {
  outdiv.replaceChildren("");

  const card = dag[name];
  if (!card) {
    const text = document.createElement("p");
    text.textContent = name + " Not Found";
    outdiv.appendChild(text);
    return;
  }
  let renderedFont = false;
  for (const dir of [Direction.Better, Direction.Worse]) {

    if (card.stats(dir).cards.length > 0) {
      const tree = makeTree(card, dir);
      const chart = makeChart(tree, card.name, true, fontSize, oracleData);
      const label = document.createElement("p");
      let nameStr = "[[" + name + "]]";
      if (card.name !== name) {
        nameStr += " (Equivalent to [[" + card.name + "]])";
      }
      const textContent = nameStr + " is <strong>" + (dir == Direction.Better ? "worse" : "better") + "</strong> than...";
      const dateData = extractDates(getTotalChildSet(dir)[card.name]);
      const dateChart = makeDateHistogram(dateData);
      displayTextWithCardLinks(label, textContent);
      if (!renderedFont) {
        const fontLabel = document.createElement("p");
        fontLabel.style.display = "inline-block";
        fontLabel.style.margin = "4px";
        const fontInput = document.createElement("input");
        fontLabel.innerHTML = "Font Size: "
        fontInput.value = "" + fontSize;
        fontInput.style.display = "inline-block";
        fontInput.style.width = "40px";
        fontInput.onkeydown = (event: KeyboardEvent) => {
          if (event.key != "Enter") {
            return;
          }
          doDisplayCharts(outdiv, dag, name, +fontInput.value);
        };
        renderedFont = true;
        outdiv.appendChild(fontLabel);
        outdiv.appendChild(fontInput);
      }
      outdiv.appendChild(label);
      outdiv.appendChild(chart);
      if (dateData.length > 1) {
        outdiv.appendChild(dateChart);
      }
    }
  }
}

function displayTextWithCardLinks(elem: HTMLElement, text: string, setHashTo?: string) {
  if (setHashTo) {
    window.location.hash = "page-" + setHashTo;
    return;
  }
  const timer = new Timer();
  const re = /\[\[([^\[\]]*)\]\]/g;
  text = text.replace(re, "<a class='cardlink'>$1</a>");
  elem.replaceChildren("");
  elem.innerHTML = text;
  for (const obj of elem.getElementsByClassName("cardlink")) {
    const o = obj as HTMLElement;
    imbueHoverImage(o, getImageURL(o.textContent || "", oracleData));
  }
  timer.checkpoint("Display Text");
}

const tableMakers: Record<Direction, TableMaker | undefined> = [undefined, undefined, undefined];
const doRenderTable = (outdiv: HTMLElement, dag: Record<string, Card>, dir: Direction) => {
  initializeTotalSets(dag);

  const timer = new Timer();
  if (tableMakers[dir] === undefined) {
    tableMakers[dir] = new TableMaker(getMaximalCards(dir), dir);
  }

  tableMakers[dir]?.renderTable(outdiv);
  timer.checkpoint("Render Table");
}

let globalSuppressOnHashChange = false;

function doRenderCheck(outdiv: HTMLElement, dag: Record<string, Card>) {
  initializeTotalSets(dag);
  outdiv.replaceChildren("");
  const label = document.createElement("p");
  label.textContent = "Enter card names, one per line";
  const textInput = document.createElement("textarea");
  textInput.rows = 25;
  textInput.cols = 80;
  textInput.style.display = "inline-block";
  textInput.style.width = "100%";
  outdiv.appendChild(label);

  outdiv.appendChild(textInput);

  const button = document.createElement("button");
  button.type = "button";
  button.style.border = "2px solid black";
  button.style.textAlign = "center";
  button.style.cursor = "pointer";
  button.style.display = "inline-block";
  button.innerText = "Generate Table";
  outdiv.appendChild(button);
  const errordiv = document.createElement("div");
  const tablediv = document.createElement("div");
  outdiv.appendChild(errordiv);
  outdiv.appendChild(tablediv);
  button.onclick = () => {
    displayCheck(textInput.value, errordiv, tablediv, dag)
  }
}

function displayCheck(inputText: string, errordiv: HTMLDivElement, tablediv: HTMLDivElement, dag: Record<string, Card>) {
    const lines = inputText.split('\n');
    const matchedCards: Array<Card> = [];
    const errorCards: Array<string> = [];
    for (let line of lines) {
      const trimmed = line.trim();
      if (trimmed.indexOf('#') >= 0) {
        continue;
      }
      if (trimmed.length == 0) {
        continue;
      }
      if (trimmed in dag) {
        matchedCards.push(dag[trimmed]);
      } else {
        errorCards.push(trimmed);
      }
    }
    const tableMaker = new TableMaker(matchedCards, Direction.None);
    
    tableMaker.renderTable(tablediv);
}

function doRenderSearch(outdiv: HTMLElement, dag: Record<string, Card>, query: string) {
  outdiv.replaceChildren("");
  // captured in multiple closures below
  let poolIndex = CardCategory.Unmapped;
  const addRadio = (i: CardCategory) => {
    const rad = document.createElement("input");
    rad.type = "radio";
    rad.name = "search";
    rad.onchange = () => {
      poolIndex = i;
    }
    rad.checked = (i == poolIndex);
    return rad;
  };
  for (let cat of [CardCategory.Best, CardCategory.Worst, CardCategory.Mapped, CardCategory.Unmapped]) {
    const rootNode = document.createElement("div");
    rootNode.style.display = "inline-block";
    const childNode = document.createElement("p");
    childNode.innerText = CardCategory[cat] + " Cards";
    rootNode.appendChild(childNode);
    outdiv.appendChild(rootNode);
    outdiv.appendChild(addRadio(cat))
  }
  const inputElem = document.createElement("input");

  inputElem.type = "text";
  inputElem.placeholder = "Enter a Scryfall search query...";
  inputElem.style.border = "1px solid transparent";
  inputElem.style.backgroundColor = "#f1f1f1";
  inputElem.style.padding = "10px";
  inputElem.style.fontSize = "16px";
  inputElem.style.width = "100%";
  outdiv.appendChild(inputElem);
  const tableDiv = document.createElement("div");
  outdiv.appendChild(tableDiv);
  inputElem.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key != "Enter") {
      return;
    }
    globalSuppressOnHashChange = true;
    window.location.hash = "search-" + inputElem.value;
    displaySearch(tableDiv, dag, inputElem.value, poolIndex);
  });
  if (query != "") {
    inputElem.value = query;
    displaySearch(tableDiv, dag, query, poolIndex);
  }
}

function displaySearch(outdiv: HTMLElement, dag: Record<string, Card>, searchQuery: string, poolIndex: CardCategory) {
  initializeTotalSets(dag);

  const searchResults: Array<Card> = [];
  const matcher = new SearchMatcher(searchQuery, poolIndex);
  const set = getTotalSet(poolIndex);
  for (const card of set) {
    if (matcher.match(card)) {
      searchResults.push(card);
    }
  }

  const tableMaker = new TableMaker(searchResults, poolIndex == CardCategory.Best ? Direction.Better : poolIndex == CardCategory.Worst ? Direction.Worse :  Direction.None);

  tableMaker.renderTable(outdiv);
}

class Stats {
  private readonly dag: Record<string, Card>;
  private static singleton: Stats | null;
  public constructor(dag: Record<string, Card>) {
    this.dag = dag;
  }
  public static get(dag: Record<string, Card>): Stats {
    if (Stats.singleton == null) {
      Stats.singleton = new Stats(dag);
    }
    return Stats.singleton;
  }
  public getRelationsCount(): number {
    return rawData.all_relations.length;
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

function doRenderHome(outdiv: HTMLDivElement, dag: Record<string, Card>) {
  outdiv.replaceChildren("");
  const containerDiv = document.createElement("div");
  outdiv.appendChild(containerDiv);
  containerDiv.style.display = "flex";
  containerDiv.style.textAlign = "center";
  containerDiv.style.justifyContent = "center";
  containerDiv.style.flexDirection = "column";
  const [bigSearchBarDiv, bigSearchBar] = makeSearchBar(dag);
  bigSearchBar.style.fontSize = "18px";

  const headerDiv = document.createElement("div");
  const h1 = document.createElement("h1");
  h1.textContent = "Strictly Worse MTG";
  headerDiv.appendChild(h1);
  const subhead = document.createElement("p");
  const stats = Stats.get(dag);
  const numRelations = stats.getRelationsCount();
  const countMapped = stats.getMappedCount();
  const countTotal = stats.getTotalCount();
  subhead.textContent = `Discover ${numRelations} relations between ${countMapped} cards out of Magic's ${countTotal}`;
  headerDiv.appendChild(subhead);
  const footerDiv = document.createElement("div");
  const footerDivContents = document.createElement("p");
  const a1 = document.createElement("a");
  a1.href = "https://github.com/drsam94/StrictlyWorse/";
  a1.textContent = "GitHub";
  const a2 = document.createElement("span");
  a2.textContent = "Philosophy";
  a2.style.marginLeft = "30px";
  a2.style.marginRight = "30px";
  a2.style.cursor = "pointer";
  a2.style.color = "blue";
  a2.style.textDecoration = "underline";
  a2.onclick = () => window.location.hash = "page-philosophy";
  const a3 = document.createElement("span");
  a3.textContent = "Help";
  a3.onclick = () => window.location.hash = "page-help";
  a3.style.cursor = "pointer";
  a3.style.color = "blue";
  a3.style.textDecoration = "underline";
  footerDivContents.appendChild(a1);
  footerDivContents.appendChild(a2);
  footerDivContents.appendChild(a3);
  footerDiv.appendChild(footerDivContents);
  headerDiv.style.display = "inline-block";
  bigSearchBarDiv.style.position = "inline-block";
  bigSearchBarDiv.style.width = "100%";
  bigSearchBar.style.width = "80%";
  footerDiv.style.display = "inline-block";
  footerDiv.style.width = "100%";
  containerDiv.appendChild(headerDiv);
  containerDiv.appendChild(bigSearchBarDiv);
  containerDiv.appendChild(footerDiv);
}

function doRenderStats(outdiv: HTMLDivElement, dag: Record<string, Card>) {
  outdiv.replaceChildren("");
  const stats = Stats.get(dag);

  const h1 = document.createElement("h1");
  h1.textContent = "Stats";
  outdiv.appendChild(h1);
  const initStatsDiv = document.createElement("div");
  const initText = document.createElement("p");
  initText.textContent = "Here are some interesting overall statistics from our data:";
  const thisList = document.createElement("ul");
  const addLi = (content: string): void => {
    const li = document.createElement("li");
    const innerDiv = document.createElement("div");
    li.appendChild(innerDiv);
    displayTextWithCardLinks(innerDiv, content);
    thisList.appendChild(li);
  };
  const expandCardNames = (cards: Array<Card>): string => {
    let ret = "";
    for (let i = 0; i < cards.length; ++i) {
      ret += `[[${cards[i].name}]]`;
      if (i != cards.length - 1) {
        ret += ", ";
      }
    }
    return ret;
  };
  addLi(`${stats.getMappedCount()} / ${stats.getTotalCount()} cards mapped with ${stats.getRelationsCount()} relations`);
  for (const dir of [Direction.Worse, Direction.Better]) {
    for (const key of ["degree", "total"]) {
      const [xCards, xVal] = stats.getExtremeBy(dir, key as keyof DirStats);
      addLi(`Most extreme by ${key} of cards ${Direction[dir]}: ${expandCardNames(xCards)} (${xVal})`);
    }
  }

  initStatsDiv.appendChild(initText);
  initStatsDiv.appendChild(thisList);

  outdiv.appendChild(initStatsDiv);

  const h2 = document.createElement("h2");
  h2.textContent = "Release Date Histograms";
  outdiv.appendChild(h2);

  const doChart = (desc: string, cardSet: Iterable<Card>) => {
    const label = document.createElement("p");
    label.textContent = desc;
    const dateData = extractDates(cardSet, (card: Card) => card.name);
    const dateChart = makeDateHistogram(dateData);

    outdiv.appendChild(label);
    outdiv.appendChild(dateChart);
  }
  initializeTotalSets(dag);
  doChart("All Mapped Cards", Object.values(dag));
  doChart("All Worst Cards", getMaximalCards(Direction.Worse));
  doChart("All Best Cards", getMaximalCards(Direction.Better));
}

function initializePageFromHash(outdiv: HTMLDivElement, searchBar: HTMLDivElement, dag: Record<string, Card>) {
  if (globalSuppressOnHashChange) {
    globalSuppressOnHashChange = false;
    return;
  }
  const hash = window.location.hash;
  const loc = hash.indexOf('-');
  const key = hash.substring(1, loc);
  const val = decodeURI(hash.substring(loc + 1));
  if (key === "card") {
    searchBar.style.visibility = "visible";
    doDisplayCharts(outdiv, dag, val);
  } else if (key === "table") {
    searchBar.style.visibility = "hidden";
    doRenderTable(outdiv, dag, Direction[val as keyof typeof Direction])
  } else if (key === "page") {
    searchBar.style.visibility = "hidden";
    if (val == "stats") {
      doRenderStats(outdiv, dag);
    } else if (val === "checker") {
      doRenderCheck(outdiv, dag);
    } else {
      const pageSource: string = val == "philosophy" ? philosophy.pageSource : help.pageSource;
      displayTextWithCardLinks(outdiv, pageSource, "");
    }
  } else if (key === "search") {
    searchBar.style.visibility = "hidden";
    doRenderSearch(outdiv, dag, val);
  } else { // if (key === "home") but also want this as the default
    searchBar.style.visibility = "hidden";
    doRenderHome(outdiv, dag);
  }
}

function globalSetup(): void {
  const style = document.createElement("style");
  let cssText = ".mytable { border: 1px solid black; }";
  const cssStyleNode = document.createTextNode(cssText);
  style.appendChild(cssStyleNode);
  document.head.appendChild(style);
  let cssText2 = ".autocomplete-items div:hover { background-color: #e9e9e9; }";
  cssText2 += "\n.autocomplete-active { background-color: DodgerBlue !important; color: #ffffff; }";
  cssText2 += "\n* { box-sizing: border-box; }";
  const cssStyleNode2 = document.createTextNode(cssText2);
  style.appendChild(cssStyleNode2);
}

function makeHeaderButtons(headerDiv: HTMLDivElement, outdiv: HTMLDivElement): void {
  const makeButton = (color: string, text: string, action: () => void): void => {
    const button = document.createElement("button");
    button.type = "button";
    button.style.border = "2px solid black";
    button.style.textAlign = "center";
    button.style.cursor = "pointer";
    button.style.display = "inline-block";
    button.style.backgroundColor = color;
    button.innerText = text;
    headerDiv.appendChild(button);
    button.onclick = action;
  };

  makeButton("#ABCDEF", "Home", () => { window.location.hash = "home"; });
  makeButton("#ABCDEF", "Philosophy", () => { displayTextWithCardLinks(outdiv, philosophy.pageSource, "philosophy"); });
  makeButton("#ABCDEF", "Adv. Search", () => { renderSearch(""); });
  makeButton("#ABCDEF", "All Worst Cards", () => { renderTable(Direction.Worse); });
  makeButton("#ABCDEF", "All Best Cards", () => { renderTable(Direction.Better); })
  makeButton("#ABCDEF", "Stats", () => { window.location.hash = "page-stats"; });
  makeButton("#ABCDEF", "Check Cards", () => { renderChecker(); });
  // TODO Check List page
}
interface PseudoKeyboardEvent {
  key: string
};

function makeSearchBar(dag: Record<string, Card>): [HTMLDivElement, HTMLInputElement] {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.style.position = "relative";
  wrapperDiv.style.display = "inline-block";
  wrapperDiv.style.width = "300px";
  wrapperDiv.style.padding = "5px";
  const inputElem = document.createElement("input");

  inputElem.type = "text";
  inputElem.placeholder = "Search for a card to show its relations...";
  inputElem.style.border = "1px solid transparent";
  inputElem.style.backgroundColor = "#f1f1f1";
  inputElem.style.padding = "10px";
  inputElem.style.fontSize = "16px";
  inputElem.style.width = "100%";
  const cb = (event: PseudoKeyboardEvent) => {
    if (event.key != "Enter") {
      return;
    }
    displayCharts(inputElem.value);
  };
  autocomplete(inputElem, Object.keys(dag), cb);
  inputElem.addEventListener("keydown", cb);

  wrapperDiv.appendChild(inputElem);
  return [wrapperDiv, inputElem];
}

function main(): void {
  globalSetup();

  const dag: Record<string, Card> = {};
  processData(dag, rawData.all_relations);
  computeStats(dag);

  const searchBar = makeSearchBar(dag)[0];

  const outdiv = document.createElement("div");
  const headerDiv = document.createElement("div");

  makeHeaderButtons(headerDiv, outdiv);

  document.body.appendChild(headerDiv);
  const div = document.createElement("div");

  div.appendChild(searchBar);

  div.appendChild(outdiv);
  document.body.appendChild(div);

  // A div at the bottom that ensures the height of the page is enough to accomodate card mouseovers
  const trailerDiv = document.createElement("div");
  trailerDiv.style.height = CARD_HEIGHT;

  document.body.appendChild(trailerDiv);

  initializePageFromHash(outdiv, searchBar, dag);
  window.onpopstate = (evt) => {
    initializePageFromHash(outdiv, searchBar, dag);
  }
}

main();