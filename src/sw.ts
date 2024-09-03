// Author: Sam Donow, 2024
// NB: Some really annoying stuff with typescript
// So apparently these sorts of imports CANNOT be combine with typescript imports
// e.g /// reference style
// So options are to put additional code in the same file or write it untyped
// wtf is this fucking piece of shit system
// At first the assumption was to put the json in json files -- already had to convert to json anyway
// so probably long term should go completely to ts files and renew the reference style
interface Oracle {
  all_cards: Record<string, any>;
}

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as rawData from '../res/data.js';
import * as _oracleData from '../res/filtered-oracle.js';
import * as _oracleDataUnmapped from '../res/filtered-oracle-unmatched.js'
import * as philosophy from '../res/philosophy.js';
import * as help from '../res/help.js';

const oracleData: Oracle = _oracleData;
const oracleDataUnmapped: Oracle = _oracleDataUnmapped;
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
  if (!elem.lastChild) { return; }
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
        b.innerHTML += "<input type='hidden' value=\"" + elem + "\">";
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
          // TODO: non-generic autocomplete code here
          displayCharts(inp.value);
        });
        b.style.padding = "10px";
        b.style.cursor = "pointer";
        b.style.backgroundColor = "#fff";
        b.style.borderBottom = "1px solid #d8d4d4";
        b.style.textAlign = "left";
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
  None, // Used for cards unafiliated with ordering
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

/** file Special.ts */
// NB: feature I didn't implement, idea of specialness would be to document certain
// edges as special
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
/** end file */

/** file Set.ts */
function addUnion(src: Set<string>, added: Set<string>): void {
  for (const x of added) {
    src.add(x);
  }
}

function isSubsetOf(lhs: Set<any>, rhs: Set<any>): boolean {
  for (const x of lhs) {
    if (!rhs.has(x)) {
      return false;
    }
  }
  return true;
}

function isProperSubsetOf(lhs: Set<any>, rhs: Set<any>): boolean {
  return isSubsetOf(lhs, rhs) && lhs.size < rhs.size;
}

function isDisjoint(lhs: Set<any>, rhs: Set<any>): boolean {
  for (const x of lhs) {
    if (rhs.has(x)) {
      return false;
    }
  }
  return true;
}

function isSetEqual(lhs: Set<any>, rhs: Set<any>): boolean {
  return isSubsetOf(lhs, rhs) && lhs.size == rhs.size;
}
/** end file */

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
function recurAddChildren(rootNode: any, childList: Array<Card>, dir: Direction) {
  for (const child of childList) {
    const obj = {
      name: child.name,
      children: [],
      value: child.stats(dir).total,
      depth: child.stats(dir).degree,
      special: getPointerIfSpecial(rootNode.name, child.name, dir)
    };
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

function recurCleanTree(rootNode: any, dir: Direction) {
  // This cleans the tree to remove instances of
  //
  //    B
  //   /
  // A
  //   \
  //    C - B
  //
  // Because B is transitively related to A, we should not also claim it is directly a chidl of A.
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
  delete rootNode.children;
  rootNode.children = filteredChildren;
}
function makeTree(rootNode: Card, dir: Direction) {
  const data = { name: rootNode.name, "children": [], value: rootNode.stats(dir).total, depth: rootNode.stats(dir).degree };

  recurAddChildren(data, rootNode.stats(dir).cards, dir);

  recurCleanTree(data, dir);

  return data;
}

function getImageURL(name: string, oracle: Oracle) {
  const card = oracle.all_cards[name];
  if (card === undefined) {
    return "";
  }
  const faces = card["card_faces"];
  const face = card["image_uris"] === undefined ? faces[0] : card;
  return face["image_uris"]["normal"];
}


function makeChart(data: any, rootName: string, startExpanded: boolean, fontSize: number): Node {
  data["name"] = rootName;
  // Specify the charts’ dimensions. The height is variable, depending on the layout.
  const width = 1300;
  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 10;
  const marginLeft = 200;
  const fontHeight = fontSize;
  // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
  // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
  // “bottom”, in the data domain. The width of a column is based on the tree’s height.
  const root = d3.hierarchy(data);
  const dx = fontHeight + 2;
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
        const imgURL = getImageURL(d.data.name, oracleData);
        if (imgURL === "") {
          return;
        }
        const bottomEdge = window.innerHeight + window.scrollY;
        let top = event.clientY + window.scrollY - 15;
        if (event.clientY + +CARD_HEIGHT > window.innerHeight) {
          top = (bottomEdge + (-CARD_HEIGHT));
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
          .style("top", (fontHeight * 2) + "px")
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
  return svg.node();
}

function makeDateHistogram(indata: Array<DateHistogramEntry>): Node {
  const width = 800;
  const height = 200;
  const margin = { top: 20, right: 50, bottom: 30, left: 50 };

  // Parse dates
  const parseDate = d3.timeParse("%Y-%m-%d");
  indata.sort((a, b) => parseDate(a.date) - parseDate(b.date));

  const alldates = ["1993-01-01", "2025-01-01"].map(d => parseDate(d));
  // Setup scales
  const x = d3.scaleTime()
    .domain(d3.extent(alldates))
    .range([margin.left, width - margin.right]).nice(15);

  // Create histogram bins
  const histogram = (d3.histogram()
    .value((d: any) => parseDate(d.date))
    .domain(x.domain())
    .thresholds(x.ticks(15)))(indata);


  const y = d3.scaleLinear()
    .domain([0, d3.max(histogram, (d: any) => d.length)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Create SVG and append axes and bars
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);
  // Append y axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5));

    const hoverDiv = d3.select("body").append("div")
    .attr("class", "hoverImage-chart")
    .style("opacity", 0);
  // Append bars
  svg.selectAll("rect")
    .data(histogram)
    .enter()
    .append("rect")
    .attr("x", (d: any) => { const ret = x(d.x0) + 1; return ret; })
    .attr("width", (d: any) => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("y", (d: any) => { return y(d.length); })
    .attr("height", (d: any) => y(0) - y(d.length))
    .attr("fill", "steelblue")
    .attr("stroke", "black") // Add a black border around the bars
    .attr("stroke-width", 1) // Adjust border width as needed
      .on("mouseover", (event: MouseEvent, d: any) => {
        const bottomEdge = window.innerHeight + window.scrollY;
        let top = event.clientY + window.scrollY - 15;
        if (event.clientY + +CARD_HEIGHT > window.innerHeight) {
          top = (bottomEdge + (-CARD_HEIGHT));
        }
        hoverDiv
          .style("position", "absolute")
          .style("left", (event.clientX + 10) + "px")
          .style("top", top + "px")
          .style("text-align", "left")
          .style("border", "2px solid blue")
          .style("background", "#FFFFFF");

        hoverDiv.transition()
          .style("opacity", 1)
        let cardList = '<ul style="margin-left: -10px; margin-right: 10px">';
        for (let i = 0; i < d.length; ++i) {
          cardList += `<li> ${d[i].card} </li>`;
        }
        cardList += "</ul>";
        hoverDiv.html(cardList)
          .style("zIndex", "1");
      })
      .on("mouseout", (event: MouseEvent) => {
        hoverDiv.html("");
        hoverDiv.transition()
          .style("opacity", 0);
      });

  // Append x axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m")));



  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Release Order");
  return svg.node();
}

const maximalCards: Record<Direction, Array<Card>> = [[], [], []];
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

class TableElem {
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

class TableMaker {
  private column: TableColumn = TableColumn.Cost;
  private increasing: boolean = true;
  private swData: Array<TableElem>;
  private dir: Direction;
  private flags: FlagsState;
  private unmapped: boolean;
  private oracle: any;

  constructor(cards: Array<Card>, oData: any, dir: Direction) {
    this.swData = [];
    this.oracle = oData;
    for (const card of cards) {
      const orcle = this.oracle.all_cards[card.name];
      if (!orcle) {
        continue;
      }

      this.swData.push(new TableElem(card, orcle, dir));
    }
    this.dir = dir;
    this.flags = new FlagsState((p: HTMLElement) => { this.renderTable(p); });
    this.unmapped = oData != oracleData;
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
    }

    // Making a template row and cloning it substantially speeds up DOM creation here
    // (something like 5-10x)
    const numColumns = 6 - 2 * +(this.dir == Direction.None);
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
      imbueHoverImage(nameRow, getImageURL(card.name, this.oracle));
      if (!this.unmapped) {
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
class DateHistogramEntry {
  public date: string;
  public card: string;

  constructor(d: string, c: string) {
    this.date = d;
    this.card = c;
  }
};

function extractDates(card: Card, dir: Direction): Array<DateHistogramEntry> {
  const oracle = oracleData.all_cards;
  const collection = getTotalChildSet(dir)[card.name];

  const ret: Array<DateHistogramEntry> = [];
  for (const name of collection) {
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

function displayCharts(name: string): void {
  window.location.hash = "card-" + name;
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
      const chart = makeChart(tree, card.name, true, fontSize);
      const label = document.createElement("p");
      let nameStr = "[[" + name + "]]";
      if (card.name !== name) {
        nameStr += " (Equivalent to [[" + card.name + "]])";
      }
      const textContent = nameStr + " is <strong>" + (dir == Direction.Better ? "worse" : "better") + "</strong> than...";
      const dateData = extractDates(card, dir);
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
        fontInput.addEventListener("keydown", (event: any) => {
          if (event.key != "Enter") {
            return;
          }
          doDisplayCharts(outdiv, dag, name, +fontInput.value);
        });
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
  for (const obj of document.getElementsByClassName("cardlink")) {
    const o = obj as HTMLElement;
    imbueHoverImage(o, getImageURL(o.textContent || "", oracleData));
  }
  timer.checkpoint("Display Text");
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

const tableMakers: Record<Direction, TableMaker | undefined> = [undefined, undefined, undefined];
const doRenderTable = (outdiv: HTMLElement, dag: Record<string, Card>, dir: Direction) => {
  initializeMaximalCards(dag, maximalCards[dir], dir);

  const timer = new Timer();
  if (tableMakers[dir] === undefined) {
    tableMakers[dir] = new TableMaker(maximalCards[dir], oracleData, dir);
  }

  tableMakers[dir]?.renderTable(outdiv);
  timer.checkpoint("Render Table");
}

function renderTable(dir: Direction) {
  window.location.hash = "table-" + Direction[dir];
};

let globalSuppressOnHashChange = false;
function renderSearch(query: string) {
  window.location.hash = "search-" + query;
}

function doRenderSearch(outdiv: HTMLElement, dag: Record<string, Card>, query: string) {
  outdiv.replaceChildren("");
  // captured in multiple closures below
  let poolIndex = 3;
  const addRadio = (i: number) => {
    const rad = document.createElement("input");
    rad.type = "radio";
    rad.name = "search";
    rad.onchange = () => {
      poolIndex = i;
    }
    rad.checked = (i == poolIndex);
    return rad;
  };
  const labels = ["Best Cards", "Worst Cards", "Mapped Cards", "Unmapped Cards"];
  for (let i = 0; i < 4; ++i) {
    const rootNode = document.createElement("div");
    rootNode.style.display = "inline-block";
    const childNode = document.createElement("p");
    childNode.innerText = labels[i];
    rootNode.appendChild(childNode);
    outdiv.appendChild(rootNode);
    outdiv.appendChild(addRadio(i))
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
  inputElem.addEventListener("keydown", (event: any) => {
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

const total_sets: Array<Array<Card>> = new Array(4);
function initializeTotalSets(dag: Record<string, Card>) {
  for (const dir of [Direction.Better, Direction.Worse]) {
    initializeMaximalCards(dag, maximalCards[dir], dir);
  }

  total_sets[0] = maximalCards[Direction.Better];
  total_sets[1] = maximalCards[Direction.Worse];
  total_sets[2] = Object.values(dag);

  const unmappedOracle = Object.keys(oracleDataUnmapped.all_cards);
  const unmappedCards = new Array<Card>(unmappedOracle.length);
  for (let i = 0; i < unmappedCards.length; ++i) {
    unmappedCards[i] = new Card(unmappedOracle[i]);
  }
  total_sets[3] = unmappedCards;
}

/** file Search.ts */
enum SearchKey {
  CMC,
  Color,
  Type,
  Power,
  Toughness,
  Error
};

enum SearchOperator {
  LT,
  LE,
  GT,
  GE,
  EQ,
  EX,
  Error,
};
type SearchValue = number | Set<string>
class SearchComponent {

  private key: SearchKey;
  private operator: SearchOperator;
  private value: SearchValue;
  private negated: boolean;
  private static readonly re = /(-?)([^!:<>=]*)([!:<>=]*)"?(.*)"?/g;

  constructor(part: string) {
    const matches = [...part.matchAll(SearchComponent.re)][0];
    const neg: boolean = matches[1] == "-";
    this.key = SearchComponent.getSearchKey(matches[2] ?? "");
    const op = SearchComponent.getOperator(matches[3] ?? "");
    this.value = SearchComponent.extractValueFromComponent(matches[4] ?? "", this.key);
    const consol = SearchComponent.consolidateNegation(op, neg);
    this.operator = consol[0];
    this.negated = consol[1];
  }

  public matches(card: TableElem) {
    const cv = SearchComponent.extractValueFromCard(card, this.key);

    const baseMatch = SearchComponent.compareValues(cv, this.value, this.key, this.operator);
    return baseMatch != this.negated;
  }

  private static readonly numberFuncs: Partial<Record<SearchOperator, (x: number, y: number) => boolean>> = {
    [SearchOperator.EQ]: (x, y) => (x == y),
    [SearchOperator.LE]: (x, y) => (x <= y),
    [SearchOperator.LT]: (x, y) => (x < y),
    [SearchOperator.EX]: (x, y) => (x == y)
  }
  private static readonly setFuncs: Partial<Record<SearchOperator, (x: Set<string>, y: Set<string>) => boolean>> = {
    [SearchOperator.EQ]: (x, y) => (isSetEqual(x, y)),
    [SearchOperator.LT]: (x, y) => (isProperSubsetOf(x, y)),
    [SearchOperator.LE]: (x, y) => (isSubsetOf(x, y)),
    [SearchOperator.EX]: (x, y) => (isSetEqual(x, y))
  }
  private static compareValues(lhs: SearchValue, rhs: SearchValue, key: SearchKey, op: SearchOperator): boolean {
    type Funcs = Record<SearchOperator, (x: SearchValue, y: SearchValue) => boolean>;
    let funcs = SearchComponent.numberFuncs as Funcs;
    switch (key) {
      case SearchKey.Color:
      case SearchKey.Type:
        funcs = SearchComponent.setFuncs as Funcs;
    }
    return funcs[op](lhs, rhs);
  }

  private static decomposeTypeLine(line: string): Array<string> {
    const parts = line.split(" ");
    const ret: Array<string> = [];
    for (const part of parts) {
      if (part.length == 0) {
        // em dash
        continue
      }
      ret.push(part.toLowerCase());
    }
    return ret;
  }
  private static parseColorValue(value: string): Set<string> {
    const uc = value.toUpperCase();
    if (uc == "C") {
      return new Set();
    }
    // Special case of "M" not supported here
    return new Set(value.toUpperCase().split(""));
  }
  private static extractValueFromComponent(value: string, key: SearchKey): SearchValue {
    switch (key) {
      case SearchKey.CMC:
      case SearchKey.Power:
      case SearchKey.Toughness:
        return +value;
      case SearchKey.Color:
        return SearchComponent.parseColorValue(value);
      case SearchKey.Type:
        return new Set([value.toLowerCase()]);
    }
    return 0;
  }
  private static extractValueFromCard(card: TableElem, key: SearchKey): SearchValue {
    switch (key) {
      case SearchKey.CMC:
        return card.cmc;
      case SearchKey.Color:
        return new Set(card.colors);
      case SearchKey.Type:
        return new Set(SearchComponent.decomposeTypeLine(card.type));
      case SearchKey.Power:
        return card.pow;
      case SearchKey.Toughness:
        return card.tou;
    }
    return 0;
  }

  private static getOperator(key: string): SearchOperator {
    if ([":", "="].indexOf(key) != -1) {
      return SearchOperator.EQ;
    } else if ([">=", "=>"].indexOf(key) != -1) {
      return SearchOperator.GE;
    } else if (["<=", "=<"].indexOf(key) != -1) {
      return SearchOperator.LE;
    } else if (key == "<") {
      return SearchOperator.LT;
    } else if (key == ">") {
      return SearchOperator.GT;
    } else if (key == "!") {
      return SearchOperator.EX;
    } else {
      return SearchOperator.Error;
    }
  }

  private static consolidateNegation(op: SearchOperator, neg: boolean): [SearchOperator, boolean] {
    if (op == SearchOperator.GT) {
      return [SearchOperator.LE, !neg];
    } else if (op == SearchOperator.GE) {
      return [SearchOperator.LT, !neg];
    } else {
      return [op, neg];
    }
  }
  private static getSearchKey(key: string): SearchKey {
    if (["c", "color", "colour"].indexOf(key) != -1) {
      return SearchKey.Color
    }
    if (["cmc", "mv", "manavalue"].indexOf(key) != -1) {
      return SearchKey.CMC;
    }
    if (["t", "type"].indexOf(key) != -1) {
      return SearchKey.Type;
    }
    if (["p", "pow", "power"].indexOf(key) != -1) {
      return SearchKey.Power;
    }
    if (["tou", "toughness"].indexOf(key) != -1) {
      return SearchKey.Toughness;
    }
    return SearchKey.Error;
  }
};

class SearchMatcher {
  private oracle: Record<string, any>;
  private components: Array<SearchComponent>;
  constructor(query: string, oData: Oracle) {
    this.oracle = oData.all_cards;

    const parts = query.match(/\S+|"[^"]+"/g) ?? [];
    this.components = [];
    for (const part of parts) {
      if (!part) {
        continue;
      }
      this.components.push(new SearchComponent(part));
    }
  }

  public match(card: Card): boolean {
    const elem = new TableElem(card, this.oracle[card.name], Direction.None);
    for (const component of this.components) {
      if (!component.matches(elem)) {
        return false;
      }
    }
    return true;
  }
};
/** end file */
function displaySearch(outdiv: HTMLElement, dag: Record<string, Card>, searchQuery: string, poolIndex: number) {
  initializeTotalSets(dag);

  const searchResults: Array<Card> = [];
  const oracle = poolIndex < 3 ? oracleData : oracleDataUnmapped;
  const matcher = new SearchMatcher(searchQuery, oracle);
  const set = total_sets[poolIndex];
  for (const card of set) {
    if (matcher.match(card)) {
      searchResults.push(card);
    }
  }

  const tableMaker = new TableMaker(searchResults, oracle, [Direction.Better, Direction.Worse][poolIndex] ?? Direction.None);

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
  const numRelations = rawData.all_relations.length;
  const countMapped = Object.keys(oracleData.all_cards).length;
  const countTotal = countMapped + Object.keys(oracleDataUnmapped.all_cards).length;
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
    const pageSource: string = val == "philosophy" ? philosophy.pageSource : help.pageSource;
    displayTextWithCardLinks(outdiv, pageSource , "");
  } else if (key === "search") {
    searchBar.style.visibility = "hidden";
    doRenderSearch(outdiv, dag, val);
  } else {
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
  const makeButton = (color: string, text: string): HTMLElement => {
    const button = document.createElement("button");
    button.type = "button";
    button.style.border = "2px solid black";
    button.style.textAlign = "center";
    button.style.cursor = "pointer";
    button.style.display = "inline-block";
    button.style.backgroundColor = color;
    button.innerText = text;
    return button;
  };

  const homeButton = makeButton("#ABCDEF", "Home");
  const philButton = makeButton("#ABCDEF", "Philosophy");
  const searchButton = makeButton("#ABCDEF", "Adv. Search");
  const worstButton = makeButton("#ABCDEF", "All Worst Cards");
  const bestButton = makeButton("#ABCDEF", "All Best Cards")

  headerDiv.appendChild(homeButton);
  headerDiv.appendChild(philButton);
  headerDiv.appendChild(searchButton);
  headerDiv.appendChild(worstButton);
  headerDiv.appendChild(bestButton);

  homeButton.onclick = () => { window.location.hash = "home"; };
  worstButton.onclick = () => renderTable(Direction.Worse);
  bestButton.onclick = () => renderTable(Direction.Better);
  philButton.onclick = () => displayTextWithCardLinks(outdiv, philosophy.pageSource, "philosophy");
  searchButton.onclick = () => renderSearch("");
}

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
  autocomplete(inputElem, Object.keys(dag), false);
  inputElem.addEventListener("keydown", (event: any) => {
    if (event.key != "Enter") {
      return;
    }
    displayCharts(inputElem.value);
  });

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