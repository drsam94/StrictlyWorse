// Author: Sam Donow, 2024

// After months of working on this project having no clue how to harmonize the d3 import
// syntax above which I didn't want to touch, the json importing syntax, and a typescript
// import syntax, it turns out that the secret is that you have to lie about filenames in 
// the import.
// Despite the fact these are imports from typescript files with the ".ts" extension, the
// import statement needs to be based on the compiled name of the file, and the relative path
// from the compiled form of this file to the compiled form of the imported
import { CARD_HEIGHT, imbueHoverImage } from './hover.js';
import { autocomplete } from './autocomplete.js';
import { Direction, DirStats, Card, CardCategory, opDir } from './card.js';
import { SearchMatcher } from './search.js';
import { oracleData } from './oracle.js';
import { TableMaker, makeElement, getExemplar } from './table_maker.js';
import { Timer } from './timer.js';
import { getImageURL } from './image_url.js';
import { makeChart } from './chart.js';
import { makeDateHistogram, DateHistogramEntry } from './histogram.js';
import { Page, changeLocation } from './navigate.js';
import { initializeTotalSets, getMaximalCards, getTotalSet, getTotalChildSet } from './card_maps.js';
import { Stats } from './stats.js'
import { makeTree, processData } from './dag.js'
// import { makeCategoryChart } from './pie.js'

function extractDates<T>(collection: Iterable<T>, extract: (arg0: T) => string, useMappedDate: boolean = false): Array<DateHistogramEntry> {

  const oracle = oracleData.all_cards;

  const ret: Array<DateHistogramEntry> = [];
  for (const preName of collection) {
    const name = extract(preName);
    const data = oracle[name];
    if (data === undefined) {
      continue;
    }
    const ra = useMappedDate ? Stats.getMapDateStr(name) : data["released_at"];
    if (ra !== undefined) {
      ret.push(new DateHistogramEntry(ra, name));
    }
  }
  return ret;
}

function doDisplayConnectedComponents(outdiv: HTMLElement, data: string) {
  outdiv.replaceChildren("");

  const table = document.createElement("table");
  table.className = "mytable";
  let headerWritten = false;
  for (let line of data.split("\n")) {
    if (line.length <= 1) {
      continue;
    }
    const row = document.createElement("tr");
    row.className = "mytable";
    let i = 0;
    for (let element of line.split(",")) {
      const field = document.createElement("td");
      field.className = "mytable";
      if (!headerWritten) {
        field.textContent = element;
        row.appendChild(field);
        continue;
      }
      if (i == 0) {
        // exemplar
        const innerDiv = document.createElement("div");
        if (element != "Total") {
          const textContent = `[[${element}]]`;
          displayTextWithCardLinks(innerDiv, textContent);
          const captureElement = element;
          innerDiv.onclick = () => {
            changeLocation(Page.card, captureElement);
          }
        } else {
          innerDiv.textContent = "Total";
        }
        field.appendChild(innerDiv);
      } else if (i == 1) {
        field.textContent = element;
      } else if (i == 2 && element.length > 1) {
        // len 1 because of newline
        field.innerHTML = `<a href="${element}">Chart</a>`;
      }
      i += 1;
      row.appendChild(field);
    }
    table.appendChild(row);
    headerWritten = true;
  }
  outdiv.appendChild(table);
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
      const dateData = extractDates(getTotalChildSet(dir)[card.name], (x: string) => x);
      const dateChart = makeDateHistogram(dateData, oracleData.all_cards[card.name].released_at);
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

function doRenderPath(outdiv: HTMLElement, dag: Record<string, Card>, names: string[]) {
  initializeTotalSets(dag);
  outdiv.replaceChildren("");
  const label = document.createElement("p");
  label.textContent = "Choose Two Cards";
  let card1Input: HTMLInputElement | null = null;
  let card2Input: HTMLInputElement | null = null;

  const outputdiv = document.createElement("div");
  const lastvs = ["", ""];
  const cb = (_?: string) => {
    if (card1Input == null || card2Input == null) {
      return;
    }
    if (card1Input.value == "" || card2Input.value == "") {
      return;
    }
    if (card1Input.value == lastvs[0] && card2Input.value == lastvs[1]) {
      return;
    }
    globalSuppressOnHashChange = true;
    window.location.hash = `path-${card1Input.value}&${card2Input.value}`;
    lastvs[0] = card1Input.value;
    lastvs[1] = card2Input.value;
    displayPath(dag, card1Input.value, card2Input.value, outputdiv);
  };
  const [card1Div, c1Input] = makeSearchBar(dag, cb);
  const [card2Div, c2Input] = makeSearchBar(dag, cb);
  card1Input = c1Input;
  card2Input = c2Input;
  const textInput = document.createElement("textarea");
  textInput.rows = 25;
  textInput.cols = 80;
  textInput.style.display = "inline-block";
  textInput.style.width = "100%";
  outdiv.appendChild(label);

  outdiv.appendChild(card1Div);
  outdiv.appendChild(card2Div);

  outdiv.appendChild(outputdiv);
  if (names.length === 2) {
    card1Input.value = names[0];
    card2Input.value = names[1];
    cb();
  }
}

function displayPath(dag: Record<string, Card>, name1: string, name2: string, outdiv: HTMLElement) {
  outdiv.replaceChildren("");

  type PathStep = [Direction, string];
  type Path = Array<PathStep>
  type PathMap = Map<string, Path>;
  const maps: Array<PathMap> = [];
  maps.push(new Map<string, Path>());
  maps.push(new Map<string, Path>());
  const leaves: Array<Array<Path>> = [];
  leaves.push([[[Direction.None, name1]]]);
  leaves.push([[[Direction.None, name2]]]);

  const timer = new Timer();
  let mergePath: [Path, Path] | null = null;
  while (true) {
    let onePathStuck = false;
    for (let i = 0; i < maps.length; ++i) {
      let didSomething = false;
      for (const leaf of leaves[i]) {
        const back = leaf[leaf.length - 1];
        const name = back[1];
        if (!maps[i].has(name)) {
          maps[i].set(name, leaf);
          if (!didSomething) {
            console.log(i, leaf, name);
          }
          didSomething = true;
        }
      }
      if (!didSomething) {
        onePathStuck = true;
      }
    }
    if (onePathStuck) {
      break;
    }
    // Check if any of our paths have intersected
    for (const key of maps[0].keys()) {
      if (maps[1].has(key)) {
        mergePath = [maps[0].get(key)!, maps[1].get(key)!];
        break;
      }
    }
    if (mergePath !== null) {
      break;
    }
    // Grow our paths from both sides
    for (let i = 0; i < leaves.length; ++i) {
      const newLeaves: Array<Path> = [];
      for (const leaf of leaves[i]) {
        const back = leaf[leaf.length - 1];
        const name = back[1];
        for (const dir of [Direction.Better, Direction.Worse]) {
          for (const nextCard of dag[name].stats(dir).cards) {
            // copy here, so the references in the map stay to unmutated
            // lists
            const nextLeaf = [...leaf];
            nextLeaf.push([dir, nextCard.name]);
            newLeaves.push(nextLeaf);
          }
        }
      }
      leaves[i] = newLeaves;
    }
  }

  timer.checkpoint("Compute Path");
  if (mergePath === null) {
    outdiv.innerText = "No Path Exists Between these cards";
    return;
  }
  console.log(mergePath);
  let strContent = "";
  let lastDir: Direction = Direction.None;
  const combinedPath: Path = [];
  for (let i = 0; i < 2; ++i) {
    for (let j = 0; j < mergePath[i].length; ++j) {
      const index = i == 0 ? j : mergePath[i].length - j - 1;
      const [dir, name] = mergePath[i][index];
      if (i === 1 && j === 0) {
        // don't repeat the central element
        lastDir = dir;
        continue;
      }

      const elemDir: Direction = i === 0 ? dir : opDir(lastDir);
      lastDir = dir;
      combinedPath.push([elemDir, name]);
    }
  }
  for (let i = 0; i < combinedPath.length; ++i) {
    const [dir, name] = combinedPath[i];
    if (Card.isPlaceholderName(name, false)) {
      if (dir === lastDir) {
        // If the direction is the same on both sides,
        // just skip the placeholder
        combinedPath.splice(i, 1);
        --i;
        continue;
      }
      // Otherwise, add a replacement element for the placeholder
      // If A > B and B < C, then we just need to pick an element
      // B' s.t B > B', and we are guaranteed B' < C. The opposite 
      // holds for <. So we just need to 'continue in the original 
      // direction'
      const exemplar = getExemplar(name, dir);
      combinedPath[i] = [dir, exemplar!];
    }
    lastDir = dir;
  }

  for (let i = 0; i < combinedPath.length; ++i) {
    const [dir, name] = combinedPath[i];
    if (dir == Direction.Better) {
      strContent += "is worse than ";
    } else if (dir == Direction.Worse) {
      strContent += "is better than ";
    }
    strContent += `[[${name}]] </br>`;
  }

  displayTextWithCardLinks(outdiv, strContent);
}

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
  if (errorCards.length == 0) {
    return;
  }
  const label = document.createElement("p");
  label.textContent = "The following cards were not found or are Unmapped: ";
  const ul = document.createElement("ul");
  for (const name of errorCards) {
    const li = document.createElement("li");
    li.textContent = name;
    ul.appendChild(li);
  }
  errordiv.appendChild(label);
  errordiv.appendChild(ul);
}

function doRenderSearch(outdiv: HTMLElement, dag: Record<string, Card>, query: string) {
  outdiv.replaceChildren("");
  // captured in multiple closures below
  let poolIndex = CardCategory.Unmapped;
  const inputElem = document.createElement("input");
  if (query.startsWith("category=") && query.indexOf("&") > -1) {
    const [catPart, otherPart] = query.split("&", 2);
    let category = catPart.split("=", 2)[1];
    poolIndex = CardCategory[category as keyof typeof CardCategory];
    query = otherPart;
  }
  const submitSearch = () => {
    globalSuppressOnHashChange = true;
    window.location.hash = `search-category=${CardCategory[poolIndex]}&${inputElem.value}`;
    displaySearch(tableDiv, dag, inputElem.value, poolIndex);
  };
  const addRadio = (i: CardCategory) => {
    const rad = document.createElement("input");
    rad.type = "radio";
    rad.name = "search";
    rad.onchange = () => {
      poolIndex = i;
      submitSearch();
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
    submitSearch();
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

  const tableMaker = new TableMaker(searchResults, poolIndex == CardCategory.Best ? Direction.Better : poolIndex == CardCategory.Worst ? Direction.Worse : Direction.None);

  tableMaker.renderTable(outdiv);
}

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

function renderTotalHistograms(outdiv: HTMLDivElement) {
  const h2 = document.createElement("h2");

  enum ChartCategory {
    ReleaseDate,
    MappedDate
  };
  const chartDiv = document.createElement("div");
  const doChart = (desc: string, cardSet: Iterable<Card>, category: ChartCategory) => {
    const label = document.createElement("p");
    label.textContent = desc;
    const dateData = extractDates(cardSet, (card: Card) => card.name, category == ChartCategory.MappedDate);
    const dateChart = makeDateHistogram(dateData);

    chartDiv.appendChild(label);
    chartDiv.appendChild(dateChart);
  };
  const doCharts = (category: ChartCategory) => {
    h2.textContent = `${category === ChartCategory.ReleaseDate ? "Release" : "Mapped"} Date Histograms`;
    chartDiv.replaceChildren("");
    doChart("All Mapped Cards", getTotalSet(CardCategory.Mapped), category);
    doChart("All Worst Cards", getMaximalCards(Direction.Worse), category);
    doChart("All Best Cards", getMaximalCards(Direction.Better), category);
  };

  outdiv.appendChild(h2);

  let activeCategory = ChartCategory.ReleaseDate;
  const addRadio = (i: ChartCategory) => {
    const radioDiv = document.createElement("div");
    const label = document.createElement("p");
    label.textContent = ChartCategory[i];
    label.style.display = "inline-block";
    const rad = document.createElement("input");
    rad.type = "radio";
    rad.name = "histogram";
    rad.onchange = () => {
      activeCategory = i;
      doCharts(activeCategory);
    }
    rad.checked = activeCategory === i;
    radioDiv.appendChild(rad);
    radioDiv.appendChild(label);
    return radioDiv;
  };
  outdiv.appendChild(addRadio(ChartCategory.ReleaseDate));
  outdiv.appendChild(addRadio(ChartCategory.MappedDate));
  outdiv.appendChild(chartDiv);
  doCharts(activeCategory);
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

  initializeTotalSets(dag);
  renderTotalHistograms(outdiv);

  const h23 = document.createElement("h2");
  h23.textContent = "Categories By Set";
  outdiv.appendChild(h23);

  const setStats = stats.getSetInfo();
  console.log(setStats);

  const table = makeElement("table", outdiv);
  const hdrRow = makeElement("tr", table);
  const columns = ["Set", "Icon", "Worst", "Best", "Mapped", "Unmapped"]

  for (let column of columns) {
    makeElement("th", hdrRow, column);
  }

  const templateRow = makeElement("tr");
  for (let i = 0; i < columns.length; ++i) {
    makeElement("td", templateRow);
  }

  for (const set of setStats.chronologicalSets) {
    const row = templateRow.cloneNode(true) as HTMLElement;
    row.children[0].textContent = set;

    const _captSet = set;
    (row.children[0] as HTMLElement).onclick = () => {
      changeLocation(Page.search, "set=" + _captSet)
    };

    const img = document.createElement("img");
    img.src = "res/ico/" + set + ".svg";
    img.style.width = "25";
    img.style.height = "25";
    img.style.position = "float";
    row.children[1].append(img);
    for (const category of [CardCategory.Worst, CardCategory.Best, CardCategory.Mapped, CardCategory.Unmapped]) {
      row.children[2 + category].textContent = "" + setStats.counts[set][category];
    }

    table.appendChild(row);
  }
  outdiv.appendChild(table);

}

function initializePageFromHash(state: GlobalState) {
  if (globalSuppressOnHashChange) {
    globalSuppressOnHashChange = false;
    return;
  }
  const hash = window.location.hash;
  const loc = hash.indexOf('-');
  const key = hash.substring(1, loc);
  const val = decodeURI(hash.substring(loc + 1));
  if (key === "card") {
    state.searchBar.style.visibility = "visible";
    doDisplayCharts(state.outdiv, state.dag, val);
  } else if (key === "table") {
    state.searchBar.style.visibility = "hidden";
    doRenderTable(state.outdiv, state.dag, Direction[val as keyof typeof Direction])
  } else if (key == "path") {
    state.searchBar.style.visibility = "hidden";
    doRenderPath(state.outdiv, state.dag, val.split('&'));
  } else if (key === "page") {
    state.searchBar.style.visibility = "hidden";
    if (val == "stats") {
      doRenderStats(state.outdiv, state.dag);
    } else if (val === "checker") {
      doRenderCheck(state.outdiv, state.dag);
    } else if (val === "components") {
      const xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
        doDisplayConnectedComponents(state.outdiv, xhttp.responseText);
      }
      xhttp.open("GET", "res/graphs.csv", true);
      xhttp.send();
    } else {
      const xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = () => {
        displayTextWithCardLinks(state.outdiv, xhttp.responseText, "");
      }
      xhttp.open("GET", `res/${val}.html`, true);
      xhttp.send();
    }
  } else if (key === "search") {
    state.searchBar.style.visibility = "hidden";
    doRenderSearch(state.outdiv, state.dag, val);
  } else { // if (key === "home") but also want this as the default
    state.searchBar.style.visibility = "hidden";
    doRenderHome(state.outdiv, state.dag);
  }
}

function styleSetup(): void {
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

  makeButton("#ABCDEF", "Home", () => { changeLocation(Page.home); });
  makeButton("#ABCDEF", "Philosophy", () => { changeLocation(Page.philosophy); });
  makeButton("#ABCDEF", "Adv. Search", () => { changeLocation(Page.search, ""); });
  makeButton("#ABCDEF", "All Worst Cards", () => { changeLocation(Page.table, Direction.Worse); });
  makeButton("#ABCDEF", "All Best Cards", () => { changeLocation(Page.table, Direction.Better); })
  makeButton("#ABCDEF", "Stats", () => { changeLocation(Page.stats); });
  makeButton("#ABCDEF", "Check Cards", () => { changeLocation(Page.checker); });
  makeButton("#ABCDEF", "Paths", () => { changeLocation(Page.path); });
  makeButton("#ABCDEF", "Graph Components", () => { changeLocation(Page.components); });
}
interface PseudoKeyboardEvent {
  key: string
};

function makeSearchBar(dag: Record<string, Card>, installCB?: (x: string) => void): [HTMLDivElement, HTMLInputElement] {
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
    if (!installCB) {
      changeLocation(Page.card, inputElem.value);
    } else {
      installCB(inputElem.value);
    }
  };
  autocomplete(inputElem, Object.keys(dag), cb);
  inputElem.addEventListener("keydown", cb);

  wrapperDiv.appendChild(inputElem);
  return [wrapperDiv, inputElem];
}

class GlobalState {
  public readonly outdiv: HTMLDivElement;
  public searchBar: HTMLElement;
  public dag: Record<string, Card>;
  public all_relations: Array<Array<string>>;

  constructor(odiv: HTMLDivElement, sb: HTMLElement, relations: Array<Array<string>>) {
    this.outdiv = odiv;
    this.searchBar = sb;
    this.dag = {};
    this.all_relations = relations;
  }
};
function main(): void {
  styleSetup();

  const outdiv = document.createElement("div");
  const headerDiv = document.createElement("div");

  makeHeaderButtons(headerDiv, outdiv);

  document.body.appendChild(headerDiv);
  const div = document.createElement("div");
  const searchBarElem = document.createElement("div");

  div.appendChild(searchBarElem);
  document.body.appendChild(div);
  document.body.appendChild(outdiv);

  // A div at the bottom that ensures the height of the page is enough to accomodate card mouseovers
  const trailerDiv = document.createElement("div");
  trailerDiv.style.height = CARD_HEIGHT;

  document.body.appendChild(trailerDiv);

  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      mainOnLoad(new GlobalState(outdiv, searchBarElem, JSON.parse(xhttp.responseText)));
    }
  }
  xhttp.open("GET", "res/data.json", true);
  xhttp.send();
}

function mainOnLoad(state: GlobalState): void {
  state.dag = processData(state.all_relations);
  Stats.relationsCount = state.all_relations.length;

  const searchBar = makeSearchBar(state.dag)[0];

  state.searchBar.replaceWith(searchBar);
  state.searchBar = searchBar;

  initializePageFromHash(state);
  window.onpopstate = (evt) => {
    initializePageFromHash(state);
  }
}

main();