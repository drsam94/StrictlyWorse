// Fuck fuck fuck fuck fuck
// So apparently these sorts of imports CANNOT be combine with typescript imports
// e.g /// reference style
// So options are to put additional code in the same file or write it untyped
// wtf is this fucking piece of shit system
// At first the assumption was to put the json in json files -- already had to convert to json anyway
// so probably long term should go completely to ts files and renew the reference style
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as rawData from '../res/data.js';
import * as oracleData from '../res/filtered-oracle.js';
import * as philosophy from '../res/philosophy.js';
import * as sq from '../res/unmatched-search.js';

/****    file hover.ts */

const CARD_HEIGHT = "476";
const CARD_WIDTH = "342";
function showImage(elem: HTMLElement, imgSrc: string) {
  const popImage = new Image();
  popImage.src = imgSrc;
  popImage.style.position = "absolute";
  popImage.style.zIndex = "1";
  popImage.style.width = CARD_WIDTH;
  popImage.style.height = CARD_HEIGHT;
  const sourceLoc = elem.getBoundingClientRect();

  if (sourceLoc.left > window.innerWidth / 2) {
    // pop up image to the left
    popImage.style.left = "" + (sourceLoc.left + (-CARD_WIDTH));
  }
  const bottomEdge = window.innerHeight + window.scrollY;
  if (sourceLoc.top + +CARD_HEIGHT > window.innerHeight) {
    popImage.style.top = "" + (bottomEdge + (-CARD_HEIGHT));
  }
  elem.appendChild(popImage);
}
function hideImage(elem: HTMLElement) {
  if (!elem.lastChild) {return;}
  elem.removeChild(elem.lastChild);
}

function imbueHoverImage(elem: HTMLElement, imgSrc: string) {
  elem.onmouseover = () => { showImage(elem, imgSrc); }
  elem.onmouseout = () => { hideImage(elem); };
}

/*****   end file */


/*****   file autocomplete.ts */
function autocomplete(inp: HTMLInputElement, arr: string[], commaSeparated?: boolean) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  let currentFocus: number = -1;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    let val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists(null);
    if (!val) { return false; }
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    let a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    a.style.position = "absolute";
    a.style.border = "1px solid #d4d4d4";
    a.style.zIndex = "99";
    a.style.top = "100%";
    a.style.left = "0";
    a.style.right = "0";

    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode!.appendChild(a);
    /*for each item in the array...*/
    for (const elem of arr) {
      /*check if the item starts with the same letters as the text field value:*/
      const baseIndex = commaSeparated ? val.lastIndexOf(',') + 1 : 0;
      const modifiedVal = val.substring(baseIndex).trim();
      let prefix = elem.substring(0, modifiedVal.length);
      if (prefix.toUpperCase() == modifiedVal.toUpperCase()) {
        /*create a DIV element for each matching element:*/
        let b = document.createElement("div");
        /*make the matching letters bold:*/
        b.innerHTML += "<strong>" + prefix + "</strong>";
        b.innerHTML += elem.substring(modifiedVal.length);
        /*insert a input field that will hold the current array item's value:*/
        b.innerHTML += "<input type='hidden' value='" + elem + "'>";
        /*execute a function when someone clicks on the item value (DIV element):*/
        b.addEventListener("click", function () {
          /*insert the value for the autocomplete text field:*/
          let keptBase = "";
          if (commaSeparated) {
            const commaI = inp.value.lastIndexOf(',');
            keptBase = commaI == -1 ? "" : inp.value.substring(0, commaI + 1).trim() + " ";
          }
          inp.value = keptBase + this.getElementsByTagName("input")[0].value;
          /*close the list of autocompleted values,
          (or any other open lists of autocompleted values:*/
          closeAllLists(null);
        });
        b.style.padding = "10px";
        b.style.cursor = "pointer";
        b.style.backgroundColor = "#fff";
        b.style.borderBottom = "1px solid #d8d4d4";
        a.appendChild(b);
      }
    }
    return true;
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    let fullList = document.getElementById(this.id + "autocomplete-list");
    if (!fullList) {
      return;
    }
    let x = fullList.getElementsByTagName("div");
    if (e.key == "ArrowDown") {
      /*If the arrow DOWN key is pressed,
      increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.key == "ArrowUp") {
      /*If the arrow UP key is pressed,
      decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.key == "Enter") {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x: HTMLCollectionOf<HTMLDivElement>) {
    /*a function to classify an item as "active":*/
    if (!x) return;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = x.length - 1;
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(x: HTMLCollectionOf<HTMLDivElement>) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (let i = 0; i < x.length; ++i) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllLists(elmnt: EventTarget | null) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    let x = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < x.length; ++i) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode!.removeChild(x[i]);
      }
    }
  }

  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}
/*****    end file */

/*****   file Card.ts */
enum Direction {
  Worse, // Cards worse than this card, indicating this card is good
  Better, // Cards better than this card, indicating this card is bad
};

class DirStats {
  public cards: Array<Card> = [];
  public degree: number = 0;
  public total: number = 0;
};

class Card {
  public name: string;
  private worseStats: DirStats = new DirStats();
  private betterStats: DirStats = new DirStats();


  constructor(nm: string) {
    this.name = nm;
  }

  public isPlaceholder(): boolean {
    return (this.name.indexOf('/') > 0 && this.name.indexOf('//') < 0) || this.name == "MORPH";
  }

  public stats(dir: Direction): DirStats {
    return dir == Direction.Worse ? this.worseStats : this.betterStats;
  }
};
/****** end file */

const specialSet: Set<string> = new Set();

function concatSpecial(name1: string, name2: string): string {
  return name1 + "__" + name2;
}
function isSpecial(name1: string, name2: string): boolean {
  return specialSet.has(concatSpecial(name1, name2));
}
function addSpecialPair(name1: string, name2: string): void {
  specialSet.add(concatSpecial(name1, name2));
}
function getPointerIfSpecial(name1: string, name2: string, dir: Direction): string {
  if (dir === Direction.Worse) {
    const temp = name1;
    name1 = name2;
    name2 = temp;
  }
  if (isSpecial(name1, name2)) {
    return name1;
  }
  return "";
}

function initNode(dag: any, key: string): Card {
  if (!(key in dag)) {
    dag[key] = new Card(key);
  }
  return dag[key];
}

function deep_equal(arr1: Array<Card>, arr2: Array<Card>) {
  if (arr1.length != arr2.length) {
    return false;
  }
  const sani1 = [];
  const sani2 = [];
  for (let i = 0; i < arr1.length; ++i) {
    sani1.push(arr1[i].name);
    sani2.push(arr2[i].name);
  }
  sani1.sort();
  sani2.sort();
  for (let i = 0; i < arr1.length; ++i) {
    if (sani1[i] != sani2[i]) {
      return false;
    }
  }
  return true;
}

function processData(dag: Record<string, Card>, inData: any) {
  const top_level = [];
  for (const elem of inData) {
    // console.log(elem);
    const worse = elem[0];
    const better = elem[1];
    const worseNode = initNode(dag, worse);
    const betterNode = initNode(dag, better);
    if (elem.length === 3) {
      if (elem[2] === '=') {
        dag[better] = worseNode;
        continue;
      } else if (elem[2] === '!') {
        addSpecialPair(elem[0], elem[1]);
      }
    }
    worseNode.stats(Direction.Better).cards.push(betterNode);
    const betterCards = betterNode.stats(Direction.Worse).cards;
    betterCards.push(worseNode);
    if (betterCards.length == 0) {
      top_level.push(betterNode);
    }
  }

  // Prune top level
  for (let i = top_level.length - 1; i >= 0; --i) {
    if (top_level[i].stats(Direction.Better).cards.length > 0) {
      top_level.splice(i, 1);
    }
  }

  const to_remove = [];
  for (let i = 0; i < top_level.length; ++i) {
    for (let j = i + 1; j < top_level.length; ++j) {
      if ((deep_equal(top_level[i].stats(Direction.Worse).cards, top_level[j].stats(Direction.Worse).cards) &&
        deep_equal(top_level[i].stats(Direction.Better).cards, top_level[j].stats(Direction.Better).cards))) {
        to_remove.push(j);
      }
    }
  }

  to_remove.sort((a, b) => b - a);
  let last = 0;

  for (let i = 0; i < to_remove.length; ++i) {
    if (to_remove[i] != last) {
      top_level.splice(to_remove[i], 1);
      last = to_remove[i];
    }
  }


  // Optional filter(s)

  // remove 1:1 mappers
  for (let i = top_level.length - 1; i >= 0; --i) {

    const worse = top_level[i].stats(Direction.Worse).cards;
    if (worse.length == 1 && worse[0].stats(Direction.Worse).cards.length == 0) {
      top_level.splice(i, 1);
    }
  }
  //

  const data = { "name": "root", "children": [], value: 1, depth: 1, specialPointer: "" };
  recurAddChildren(data, top_level, Direction.Worse);

  return data;
}


function computeStats(dag: Record<string, Card>): void {
  const worseSet: Record<string, Set<string>> = {};
  const betterSet: Record<string, Set<string>> = {};
  const getSet = (dir: Direction) => dir == Direction.Worse ? worseSet : betterSet;
  function computeStatsRecursive(card: Card, dir: Direction) {
    const set = getSet(dir);
    if (set[card.name] === undefined) {
      set[card.name] = new Set();
      const ws = set[card.name];
      let maxDegree = 0;
      for (const worse of card.stats(dir).cards) {
        computeStatsRecursive(worse, dir);
        ws.add(worse.name);
        // union
        for (const x of set[worse.name]) {
          ws.add(x);
        }
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
    // console.log(card);
  }
}
function recurAddChildren(rootNode: any, childList: Array<Card>, dir: Direction) {
  for (const child of childList) {
    const obj = {
      name: child.name,
      children: [],
      value: child.stats(dir).total,
      depth: child.stats(dir).degree,
      special: getPointerIfSpecial(rootNode.name, child.name, dir)
    };
    rootNode.children.push(obj);
    // console.log(obj)
    recurAddChildren(obj, child.stats(dir).cards, dir);
  }
}

function makeTree(rootNode: Card, dir: Direction) {
  const data = { name: rootNode.name, "children": [], value: rootNode.stats(dir).total, depth: rootNode.stats(dir).degree };

  recurAddChildren(data, rootNode.stats(dir).cards, dir);
  return data;
}

function getImageURL(name?: string) {
  const card = oracleData.all_cards[name];
  if (card === undefined) {
    return "";
  }
  const faces = card["card_faces"];
  const face = card["image_uris"] === undefined ? faces[0] : card;
  return face["image_uris"]["normal"];
}

function rectContains(rect: DOMRect, pt: MouseEvent): boolean {
  console.log(rect, pt);
  return (pt.clientX > rect.left && pt.clientY < rect.right &&
      pt.clientY > rect.top && pt.clientY < rect.bottom);
}
function makeChart(data: any, rootName: string, startExpanded?: boolean) {
  data["name"] = rootName;
  // Specify the charts’ dimensions. The height is variable, depending on the layout.
  const width = 1300;
  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 10;
  const marginLeft = 200;
  const fontHeight = 12;
  // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
  // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
  // “bottom”, in the data domain. The width of a column is based on the tree’s height.
  const root = d3.hierarchy(data);
  const dx = 12;
  const dy = (width - marginRight - marginLeft) / (1 + root.height);

  // Define the tree layout and the shape for links.
  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3.linkHorizontal().x((d: any) => d.y).y((d: any) => d.x);

  // Create the SVG container, a layer for the links and a layer for the nodes.
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", dx)
    .attr("viewBox", [-marginLeft, -marginTop, width, dx])
    .attr("style", "max-width: 100%; height: auto; font: " + fontHeight + "px sans-serif; user-select: none;");

  const gLink = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg.append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  function update(event: any, source: any) {
    const duration = event?.altKey ? 2500 : 250; // hold the alt key to slow down the transition
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    let left = root;
    let right = root;
    root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + marginTop + marginBottom;

    const transition = svg.transition()
      .duration(duration)
      .attr("height", height)
      .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
      .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

    // Update the nodes…
    const node = gNode.selectAll("g")
      .data(nodes, (d: any) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
      .attr("transform", (d: any) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", (event: any, d: any) => {
        d.children = d.children ? null : d._children;
        update(event, d);
      });

    nodeEnter.append("circle")
      .attr("r", 2.5)
      .attr("fill", (d: any) => d.data.value > 5 ? "#900" : d._children ? "#555" : "#999")
      .attr("stroke-width", 10);

    const getLabel = (data: any) => {
      if (data.value <= 1) { return data.name; }
      else { return data.name + " " + data.value + "(" + data.depth + ")"; }
    };
    const hoverDiv = d3.select("body").append("div")
      .attr("class", "hoverImage-chart")
      .style("opacity", 0);


    nodeEnter.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => d._children ? -6 : 6)
      .attr("text-anchor", (d: any) => d._children ? "end" : "start")
      .text((d: any) => getLabel(d.data))
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("fill", (d: any) => d.data.special ? "#900" : "#555")
      .attr("paint-order", "stroke")
      .on("mouseover", (event: MouseEvent, d: any) => {
        const imgURL = getImageURL(d.data.name);
        if (imgURL === "") {
          return;
        }
        const bottomEdge = window.innerHeight + window.scrollY;
        let top = event.clientY + window.scrollY - 15;
        if (event.clientY + +CARD_HEIGHT > window.innerHeight) {
          top =  (bottomEdge + (-CARD_HEIGHT));
        }
        hoverDiv
          .style("position", "absolute")
          .style("left", (event.clientX + 10) + "px")
          .style("top", top + "px");

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const distanceWithinText = event.clientX - rect.left;
        hoverDiv.transition()
          .style("opacity", 1)
        hoverDiv.append("img")
          .attr("src", imgURL)
          .style("width", CARD_WIDTH)
          .style("height", CARD_HEIGHT)
          .style("position", "absolute")
          .style("left", (event.clientX > window.innerWidth / 2 ? (-CARD_WIDTH) - distanceWithinText - 15 : "0") + "px")
          .style("top", (fontHeight * 2 ) + "px")
          .style("zIndex", "1");
      })
      .on("mouseout", (event: MouseEvent) => {
        hoverDiv.transition()
          .style("opacity", 0);
        hoverDiv.html("");
      });


    // Transition nodes to their new position.
    node.merge(nodeEnter).transition(transition)
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    node.exit().transition(transition).remove()
      .attr("transform", (d: any) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path")
      .data(links, (d: any) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().append("path")
      .attr("d", (d: any) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition)
      .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition(transition).remove()
      .attr("d", (d: any) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Do the first update to the initial configuration of the tree — where a number of nodes
  // are open (arbitrarily selected as the root, plus nodes with 7 letters).
  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d: any, i: any) => {
    d.id = i;
    d._children = d.children;
    if (!startExpanded) {
      d.children = null;
    }
  });

  update(null, root);

  return svg;
}



const maximalCards: Record<Direction, Array<Card>> = [[], []];
function initializeMaximalCards(dag: Record<string, Card>, toInit: Array<Card>, dir: Direction) {
  if (toInit.length == 0) {
    for (const [cardName, card] of Object.entries(dag)) {
      if (card.name !== cardName) {
        // Skip alias nodes
        continue;
      }
      const stats = card.stats(dir);
      const ostats = card.stats(dir == Direction.Better ? Direction.Worse : Direction.Better);
      if (dir === Direction.Better && ostats.degree === 1 && ostats.total === 1) {
        // skip 1-1 better cards
        continue;
      }
      if (stats.cards.length == 0 && !card.isPlaceholder()) {
        toInit.push(card);
      }
    }
    console.log(toInit.length);
  }
}

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
}


const getPTString = (oracle: any): string => {
  if (oracle.power === undefined) {
    return "";
  }
  return oracle.power + " / " + oracle.toughness;
};

const costCache: Record<string, HTMLElement> = {};
function renderCost(cost: string): HTMLElement {
  if (costCache[cost] !== undefined) {
    return costCache[cost].cloneNode(true) as HTMLElement;
  }
  const rootNode = document.createElement("div");
  rootNode.style.display = "inline-block";
  // Grab all the pieces in {}
  const re = /\{([^{}]*)\}([^{}]*)/g;
  for (const match of cost.matchAll(re)) {
    // naming convention to avoid / in filenames
    const sym = match[1].replace('/', '_');
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

class TableElem {
  public name: string;
  public colors: Array<string>;
  public cost: HTMLElement;
  public cmc: number;
  public type: string;
  public pt: string;
  public degree: number;
  public totalWorse: number;

  constructor(card: Card, oracle: any, dir: Direction) {
    const oDir = dir == Direction.Better ? Direction.Worse : Direction.Better;
    this.name = card.name;
    this.colors = oracle.colors;
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
    this.degree = card.stats(oDir).degree;
    this.totalWorse = card.stats(oDir).total;
  }
}

class FlagsState {
  private flags: Array<string> = []
  private flagValues: Array<boolean> = []
  private onChangeCB: (p:HTMLElement) => void;
  private parent: HTMLElement | null;
  constructor (flagNames: Array<string>, ocb: (p:HTMLElement) => void = (x) => {}) {
    this.flags = [...flagNames];
    this.flagValues = new Array(flagNames.length);
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
      flagsDiv.appendChild(renderCost(this.flags[i]))
      cbDiv.appendChild(checkbox);
      flagsDiv.appendChild(cbDiv);
    }
    return flagsDiv;
  }

  public getFlagValues(): Array<boolean> {
    return this.flagValues;
  }
}

class TableMaker {
  private column: TableColumn = TableColumn.Cost;
  private increasing: boolean = true;
  private swData: Array<TableElem>;
  private dag: Record<string, Card>;
  private dir: Direction;
  private flags: FlagsState;

  constructor(cards: Array<Card>, oData: any, dg: Record<string, Card>, dir: Direction) {
    this.swData = [];
    for (const card of cards) {
      const oracle = oData.all_cards[card.name];
      if (!oracle) {
        continue;
      }

      this.swData.push(new TableElem(card, oracle, dir));
    }
    this.dag = dg;
    this.dir = dir;
    this.flags = new FlagsState(["{W}", "{U}", "{B}", "{R}", "{G}"], (p: HTMLElement) => {this.renderTable(p);});
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
    this.makeClickSort(makeElement("th", hdrRow, "Degree"), parent, TableColumn.Degree);
    this.makeClickSort(makeElement("th", hdrRow, "Total " + (this.dir == Direction.Worse ? "Worse" : "Better")), parent, TableColumn.TotalWorse);

    // Making a template row and cloning it substantially speeds up DOM creation here
    // (something like 5-10x)
    const numColumns = 6;
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
      imbueHoverImage(nameRow, getImageURL(card.name));
      nameRow.onclick = () => {
        displayCharts(parent, this.dag, card.name);
      }
      children[1].appendChild(card.cost);
      children[2].textContent = card.type;
      children[3].textContent = card.pt;
      children[4].textContent = card.degree + "";
      children[5].textContent = card.totalWorse + "";

      table.appendChild(elemRow);
    }
    parent.appendChild(flagsDiv);
    parent.appendChild(table);
  }

  private passesFilter(card: TableElem): boolean {
    const includeColors = this.flags.getFlagValues();
    for (let i = 0; i < includeColors.length; ++i) {
      const color = "WUBRG".charAt(i);
      if (!includeColors[i] && card.colors && card.colors.includes(color)) {
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
      return (a.cmc - b.cmc) * (this.increasing ? 1 : -1);
    };
    const compare = ((column: TableColumn) => {
      switch (column) {
        case TableColumn.Cost:
          return costCompare;
        case TableColumn.Degree:
          return (a: TableElem, b: TableElem) => {
            return (a.degree - b.degree) * (this.increasing ? 1 : -1);
          }
        case TableColumn.TotalWorse:
          return (a: TableElem, b: TableElem) => {
            return (a.totalWorse - b.totalWorse) * (this.increasing ? 1 : -1);
          }
        default:
          return costCompare;
      }
    })(this.column);

    this.swData.sort(compare);
  }
}

function displayCharts(outdiv: HTMLElement, dag: Record<string, Card>, name: string): void {
  outdiv.replaceChildren("");
  window.location.hash = "card-" + name;

  const card = dag[name];
  if (!card) {
    const text = document.createElement("p");
    text.textContent = name + " Not Found";
    outdiv.appendChild(text);
    return;
  }

  for (const dir of [Direction.Better, Direction.Worse]) {

    if (card.stats(dir).cards.length > 0) {
      const tree = makeTree(card, dir);
      const chart = makeChart(tree, card.name, true);
      const label = document.createElement("p");
      let nameStr = "[[" + name + "]]";
      if (card.name !== name) {
        nameStr += " (Equivalent to [[" + card.name + "]])";
      }
      const textContent = nameStr + " is " + (dir == Direction.Better ? "worse" : "better") + " than...";
      outdiv.appendChild(label);
      displayTextWithCardLinks(label, textContent);
      outdiv.appendChild(chart.node());
    }
  }
}

function displayTextWithCardLinks(elem: HTMLElement, text: string, setHash?: boolean) {
  const timer = new Timer();
  const re = /\[\[([^\[\]]*)\]\]/g;
  text = text.replace(re, "<a class='cardlink'>$1</a>");
  elem.replaceChildren("");
  elem.innerHTML = text;
  for (const obj of document.getElementsByClassName("cardlink")) {
    const o = obj as HTMLElement;
    imbueHoverImage(o, getImageURL(o.textContent || ""));
  }
  timer.checkpoint("Display Text");
  if (setHash) {
    window.location.hash = "page-philosophy";
  }
}

class Timer {
  private currentMs: number;

  constructor() {
    this.currentMs = performance.now();
  }

  public reset(): void {
    this.currentMs = performance.now();
  }
  public checkpoint(desc: string): void {
    const now = performance.now();
    const delta = now - this.currentMs;
    console.log(desc + ": " + delta + "ms");
    this.currentMs = now;
  }
};

const tableMakers: Record<Direction, TableMaker | undefined> = [undefined, undefined];
const renderTable = (outdiv: HTMLElement, dag: Record<string, Card>, dir: Direction) => {
  initializeMaximalCards(dag, maximalCards[dir], dir);

  const timer = new Timer();
  if (tableMakers[dir] === undefined) {
    tableMakers[dir] = new TableMaker(maximalCards[dir], oracleData, dag, dir);
  }

  tableMakers[dir]?.renderTable(outdiv);
  timer.checkpoint("Render Table");
  window.location.hash = "table-" + Direction[dir];
};

function initializePageFromHash(outdiv: HTMLElement, dag: Record<string, Card>) {
  const hash = window.location.hash;
  const loc = hash.indexOf('-');
  const key = hash.substring(1, loc);
  const val = decodeURI(hash.substring(loc + 1));
  if (key === "card") {
    displayCharts(outdiv, dag, val);
  } else if (key === "table") {
    renderTable(outdiv, dag, Direction[val as keyof typeof Direction])
  } else if (key === "page") {
    displayTextWithCardLinks(outdiv, philosophy.pageSource, true);
  }
}

function main(): void {
  const timer = new Timer();
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

  const dag: Record<string, Card> = {};
  processData(dag, rawData.all_relations);

  timer.checkpoint("Initial Data Ingest");
  computeStats(dag);
  timer.checkpoint("Stats Computation");

  const wrapperDiv = document.createElement("div");
  wrapperDiv.style.position = "relative";
  wrapperDiv.style.display = "inline-block";
  wrapperDiv.style.width = "300px";
  const inputElem = document.createElement("input");


  inputElem.type = "text";
  inputElem.placeholder = "Search for Card...";
  inputElem.style.border = "1px solid transparent";
  inputElem.style.backgroundColor = "#f1f1f1";
  inputElem.style.padding = "10px";
  inputElem.style.fontSize = "16px";
  inputElem.style.width = "100%";
  wrapperDiv.appendChild(inputElem);

  const makeButton = (color: string, text: string): HTMLElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.style.display = "block";
    button.style.border = "2px solid black";
    button.style.textAlign = "center";
    button.style.cursor = "pointer";
    button.style.backgroundColor = color;
    button.innerText = text;
    return button;
  };

  const button = makeButton("#4CAF50", "Generate Table of SW Cards");

  const button15 = makeButton("#4CF0AF", "Generate Table of Best Cards")

  const button2 = makeButton("#AF504C", "Read about the process");

  const button3 = makeButton("#ABCDEF", "<TEST> Search Query Output");

  const div = document.createElement("div");

  div.appendChild(wrapperDiv);
  div.appendChild(button);
  div.appendChild(button15);
  div.appendChild(button2);
  div.appendChild(button3);

  const outdiv = document.createElement("div");
  div.appendChild(outdiv);
  document.body.appendChild(div);

  // A div at the bottom that ensures the height of the page is enough to accomodate card mouseovers
  const trailerDiv = document.createElement("div");
  trailerDiv.style.height = CARD_HEIGHT;

  document.body.appendChild(trailerDiv);
  timer.checkpoint("Button Init");
  autocomplete(inputElem, Object.keys(dag));
  timer.checkpoint("Autocomplete Computation");
  inputElem.addEventListener("keydown", (event: any) => {
    if (event.key != "Enter") {
      return;
    }
    displayCharts(outdiv, dag, inputElem.value);
  });

  button.onclick = () => renderTable(outdiv, dag, Direction.Worse);
  button15.onclick = () => renderTable(outdiv, dag, Direction.Better);
  button2.onclick = () => displayTextWithCardLinks(outdiv, philosophy.pageSource, true);
  button3.onclick = () => displayTextWithCardLinks(outdiv, sq.pageSource, true);
  initializePageFromHash(outdiv, dag);
}

main();