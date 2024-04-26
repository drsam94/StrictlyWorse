import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as rawData from '../res/data.js';
import * as oracleData from '../res/filtered-oracle.js';
import * as philosophy from '../res/philosophy.js';
const CARD_HEIGHT = "476";
const CARD_WIDTH = "342";
function showImage(elem, imgSrc) {
    const popImage = new Image();
    popImage.src = imgSrc;
    popImage.style.position = "absolute";
    popImage.style.zIndex = "1";
    popImage.style.width = CARD_WIDTH;
    popImage.style.height = CARD_HEIGHT;
    elem.appendChild(popImage);
}
function hideImage(elem) {
    elem.removeChild(elem.lastChild);
}
function imbueHoverImage(elem, imgSrc) {
    elem.onmouseover = () => { showImage(elem, imgSrc); };
    elem.onmouseout = () => { hideImage(elem); };
}
function autocomplete(inp, arr, commaSeparated) {
    let currentFocus = -1;
    inp.addEventListener("input", function (e) {
        let val = this.value;
        closeAllLists(null);
        if (!val) {
            return false;
        }
        currentFocus = -1;
        let a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        a.style.position = "absolute";
        a.style.border = "1px solid #d4d4d4";
        a.style.zIndex = "99";
        a.style.top = "100%";
        a.style.left = "0";
        a.style.right = "0";
        this.parentNode.appendChild(a);
        for (const elem of arr) {
            const baseIndex = commaSeparated ? val.lastIndexOf(',') + 1 : 0;
            const modifiedVal = val.substring(baseIndex).trim();
            let prefix = elem.substring(0, modifiedVal.length);
            if (prefix.toUpperCase() == modifiedVal.toUpperCase()) {
                let b = document.createElement("div");
                b.innerHTML += "<strong>" + prefix + "</strong>";
                b.innerHTML += elem.substring(modifiedVal.length);
                b.innerHTML += "<input type='hidden' value='" + elem + "'>";
                b.addEventListener("click", function () {
                    let keptBase = "";
                    if (commaSeparated) {
                        const commaI = inp.value.lastIndexOf(',');
                        keptBase = commaI == -1 ? "" : inp.value.substring(0, commaI + 1).trim() + " ";
                    }
                    inp.value = keptBase + this.getElementsByTagName("input")[0].value;
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
    inp.addEventListener("keydown", function (e) {
        let fullList = document.getElementById(this.id + "autocomplete-list");
        if (!fullList) {
            return;
        }
        let x = fullList.getElementsByTagName("div");
        if (e.key == "ArrowDown") {
            currentFocus++;
            addActive(x);
        }
        else if (e.key == "ArrowUp") {
            currentFocus--;
            addActive(x);
        }
        else if (e.key == "Enter") {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x)
                    x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        if (!x)
            return;
        removeActive(x);
        if (currentFocus >= x.length)
            currentFocus = 0;
        if (currentFocus < 0)
            currentFocus = x.length - 1;
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        for (let i = 0; i < x.length; ++i) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        let x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; ++i) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}
var Direction;
(function (Direction) {
    Direction[Direction["Worse"] = 0] = "Worse";
    Direction[Direction["Better"] = 1] = "Better";
})(Direction || (Direction = {}));
;
class DirStats {
    constructor() {
        this.cards = [];
        this.degree = 0;
        this.total = 0;
    }
}
;
class Card {
    constructor(nm) {
        this.worseStats = new DirStats();
        this.betterStats = new DirStats();
        this.name = nm;
    }
    isPlaceholder() {
        return (this.name.indexOf('/') > 0 && this.name.indexOf('//') < 0) || this.name == "MORPH";
    }
    stats(dir) {
        return dir == Direction.Worse ? this.worseStats : this.betterStats;
    }
}
;
function initNode(dag, key) {
    if (!(key in dag)) {
        dag[key] = new Card(key);
    }
    return dag[key];
}
function deep_equal(arr1, arr2) {
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
function processData(dag, inData) {
    const top_level = [];
    for (const elem of inData) {
        if (elem.length != 2) {
            continue;
        }
        const worse = elem[0];
        const better = elem[1];
        const worseNode = initNode(dag, worse);
        const betterNode = initNode(dag, better);
        worseNode.stats(Direction.Better).cards.push(betterNode);
        const betterCards = betterNode.stats(Direction.Worse).cards;
        betterCards.push(worseNode);
        if (betterCards.length == 0) {
            top_level.push(betterNode);
        }
    }
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
    for (let i = top_level.length - 1; i >= 0; --i) {
        const worse = top_level[i].stats(Direction.Worse).cards;
        if (worse.length == 1 && worse[0].stats(Direction.Worse).cards.length == 0) {
            top_level.splice(i, 1);
        }
    }
    const data = { "name": "root", "children": [], value: 1, depth: 1 };
    recurAddChildren(data, top_level, Direction.Worse);
    return data;
}
function computeStats(dag) {
    const worseSet = {};
    const betterSet = {};
    const getSet = (dir) => dir == Direction.Worse ? worseSet : betterSet;
    function computeStatsRecursive(card, dir) {
        const set = getSet(dir);
        if (set[card.name] === undefined) {
            set[card.name] = new Set();
            const ws = set[card.name];
            let maxDegree = 0;
            for (const worse of card.stats(dir).cards) {
                computeStatsRecursive(worse, dir);
                ws.add(worse.name);
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
    }
}
function recurAddChildren(rootNode, childList, dir) {
    for (const child of childList) {
        const obj = {
            name: child.name,
            children: [],
            value: child.stats(dir).total,
            depth: child.stats(dir).degree
        };
        rootNode.children.push(obj);
        recurAddChildren(obj, child.stats(dir).cards, dir);
    }
}
function makeTree(rootNode, dir) {
    const data = { name: rootNode.name, "children": [], value: rootNode.stats(dir).total, depth: rootNode.stats(dir).degree };
    recurAddChildren(data, rootNode.stats(dir).cards, dir);
    return data;
}
function getImageURL(name) {
    const card = oracleData.all_cards[name];
    if (card === undefined) {
        return "";
    }
    const faces = card["card_faces"];
    const face = card["image_uris"] === undefined ? faces[0] : card;
    return face["image_uris"]["normal"];
}
function makeChart(data, rootName, startExpanded) {
    data["name"] = rootName;
    console.log(data);
    const width = 1300;
    const marginTop = 10;
    const marginRight = 10;
    const marginBottom = 10;
    const marginLeft = 200;
    const root = d3.hierarchy(data);
    const dx = 12;
    const dy = (width - marginRight - marginLeft) / (1 + root.height);
    const tree = d3.tree().nodeSize([dx, dy]);
    const diagonal = d3.linkHorizontal().x((d) => d.y).y((d) => d.x);
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", dx)
        .attr("viewBox", [-marginLeft, -marginTop, width, dx])
        .attr("style", "max-width: 100%; height: auto; font: 12px sans-serif; user-select: none;");
    const gLink = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);
    const gNode = svg.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all");
    function update(event, source) {
        const duration = event?.altKey ? 2500 : 250;
        const nodes = root.descendants().reverse();
        const links = root.links();
        tree(root);
        let left = root;
        let right = root;
        root.eachBefore((node) => {
            if (node.x < left.x)
                left = node;
            if (node.x > right.x)
                right = node;
        });
        const height = right.x - left.x + marginTop + marginBottom;
        const transition = svg.transition()
            .duration(duration)
            .attr("height", height)
            .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
            .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));
        const node = gNode.selectAll("g")
            .data(nodes, (d) => d.id);
        const nodeEnter = node.enter().append("g")
            .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (event, d) => {
            d.children = d.children ? null : d._children;
            update(event, d);
        });
        nodeEnter.append("circle")
            .attr("r", 2.5)
            .attr("fill", (d) => d.data.value > 5 ? "#900" : d._children ? "#555" : "#999")
            .attr("stroke-width", 10);
        const getLabel = (data) => {
            if (data.value <= 1) {
                return data.name;
            }
            else {
                return data.name + " " + data.value + "(" + data.depth + ")";
            }
        };
        const hoverDiv = d3.select("body").append("div")
            .attr("class", "hoverImage-chart")
            .style("opacity", 0);
        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", (d) => d._children ? -6 : 6)
            .attr("text-anchor", (d) => d._children ? "end" : "start")
            .text((d) => getLabel(d.data))
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white")
            .attr("fill", (d) => d.data.value > 5 ? "#900" : "#555")
            .attr("paint-order", "stroke")
            .on("mouseover", (event, d) => {
            const imgURL = getImageURL(d.data.name);
            if (imgURL === "") {
                return;
            }
            hoverDiv
                .style("position", "absolute")
                .style("left", (event.clientX + 10) + "px")
                .style("top", (event.clientY - 15) + "px");
            hoverDiv.transition()
                .style("opacity", 1);
            hoverDiv.append("img")
                .attr("src", imgURL)
                .style("width", CARD_WIDTH)
                .style("height", CARD_HEIGHT)
                .style("position", "absolute")
                .style("zIndex", "1");
        })
            .on("mouseout", (event) => {
            hoverDiv.transition()
                .style("opacity", 0);
            hoverDiv.html("");
        });
        node.merge(nodeEnter).transition(transition)
            .attr("transform", (d) => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);
        node.exit().transition(transition).remove()
            .attr("transform", (d) => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);
        const link = gLink.selectAll("path")
            .data(links, (d) => d.target.id);
        const linkEnter = link.enter().append("path")
            .attr("d", (d) => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
        });
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);
        link.exit().transition(transition).remove()
            .attr("d", (d) => {
            const o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
        });
        root.eachBefore((d) => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
        if (!startExpanded) {
            d.children = null;
        }
    });
    update(null, root);
    return svg;
}
function addCheckBox(base, label) {
    const boxElem = document.createElement("div");
    const labelElem = document.createElement("label");
    labelElem.textContent = label;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    boxElem.appendChild(labelElem);
    boxElem.appendChild(checkbox);
    base.appendChild(boxElem);
    return () => checkbox.checked ? label : "";
}
const maximalCards = [[], []];
function initializeMaximalCards(dag, toInit, dir) {
    if (toInit.length == 0) {
        for (const cardName in dag) {
            const card = dag[cardName];
            if (card.stats(dir).cards.length == 0 && !card.isPlaceholder()) {
                toInit.push(card);
            }
        }
    }
}
function makeElement(type, parent, text) {
    const elem = document.createElement(type);
    elem.className = "mytable";
    if (text) {
        elem.textContent = text;
    }
    parent.appendChild(elem);
    return elem;
}
;
var TableColumn;
(function (TableColumn) {
    TableColumn[TableColumn["Name"] = 0] = "Name";
    TableColumn[TableColumn["Cost"] = 1] = "Cost";
    TableColumn[TableColumn["Degree"] = 2] = "Degree";
    TableColumn[TableColumn["TotalWorse"] = 3] = "TotalWorse";
})(TableColumn || (TableColumn = {}));
const getPTString = (oracle) => {
    if (oracle.power === undefined) {
        return "";
    }
    return oracle.power + " / " + oracle.toughness;
};
class TableElem {
    constructor(card, oracle, dir) {
        const oDir = dir == Direction.Better ? Direction.Worse : Direction.Better;
        this.name = card.name;
        this.colors = oracle.colors;
        this.cost = oracle.mana_cost;
        this.cmc = oracle.cmc;
        this.type = oracle.type_line;
        this.pt = getPTString(oracle);
        this.degree = card.stats(oDir).degree;
        this.totalWorse = card.stats(oDir).total;
    }
}
class TableMaker {
    constructor(cards, oData, dg, dir) {
        this.column = TableColumn.Cost;
        this.increasing = true;
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
    }
    makeClickSort(elem, parent, column) {
        elem.onclick = () => {
            if (column === this.column) {
                this.increasing = !this.increasing;
            }
            else {
                this.increasing = true;
                this.column = column;
            }
            this.renderTable(parent);
        };
    }
    renderTable(parent) {
        this.cardSort();
        parent.replaceChildren("");
        const table = makeElement("table", parent);
        const hdrRow = makeElement("tr", table);
        this.makeClickSort(makeElement("th", hdrRow, "Card"), parent, TableColumn.Name);
        this.makeClickSort(makeElement("th", hdrRow, "Cost"), parent, TableColumn.Cost);
        makeElement("th", hdrRow, "Type");
        makeElement("th", hdrRow, "P / T");
        this.makeClickSort(makeElement("th", hdrRow, "Degree"), parent, TableColumn.Degree);
        this.makeClickSort(makeElement("th", hdrRow, "Total " + (this.dir == Direction.Worse ? "Worse" : "Better")), parent, TableColumn.TotalWorse);
        for (const card of this.swData) {
            const elemRow = makeElement("tr", table);
            const nameRow = makeElement("td", elemRow, card.name);
            imbueHoverImage(nameRow, getImageURL(card.name));
            nameRow.onclick = () => {
                displayCharts(parent, this.dag, card.name);
            };
            makeElement("td", elemRow, card.cost);
            makeElement("td", elemRow, card.type);
            makeElement("td", elemRow, card.pt);
            makeElement("td", elemRow, card.degree + "");
            makeElement("td", elemRow, card.totalWorse + "");
        }
        parent.appendChild(table);
    }
    cardSort() {
        const costCompare = (a, b) => {
            const colors = (c) => c.colors ? c.colors.length : 2;
            const colorCountDiff = colors(a) - colors(b);
            if (colorCountDiff != 0) {
                return colorCountDiff;
            }
            const colorToNum = (color) => { return "WUBRG".indexOf(color); };
            if (a.colors && b.colors && a.colors.length == 1) {
                const colorDiff = colorToNum(a.colors[0]) - colorToNum(b.colors[0]);
                if (colorDiff != 0) {
                    return colorDiff;
                }
            }
            return (a.cmc - b.cmc) * (this.increasing ? 1 : -1);
        };
        const compare = ((column) => {
            switch (column) {
                case TableColumn.Cost:
                    return costCompare;
                case TableColumn.Degree:
                    return (a, b) => {
                        return (a.degree - b.degree) * (this.increasing ? 1 : -1);
                    };
                case TableColumn.TotalWorse:
                    return (a, b) => {
                        return (a.totalWorse - b.totalWorse) * (this.increasing ? 1 : -1);
                    };
                default:
                    return costCompare;
            }
        })(this.column);
        this.swData.sort(compare);
    }
}
function displayCharts(outdiv, dag, name) {
    outdiv.replaceChildren("");
    const card = dag[name];
    if (!card) {
        const text = document.createElement("p");
        text.textContent = name + " Not Found";
        outdiv.appendChild(text);
        return;
    }
    if (card.stats(Direction.Better).cards.length > 0) {
        const tree = makeTree(card, Direction.Better);
        const chart = makeChart(tree, card.name, true);
        const label = document.createElement("p");
        label.textContent = card.name + " is worse than...";
        outdiv.appendChild(label);
        outdiv.appendChild(chart.node());
    }
    if (card.stats(Direction.Worse).cards.length > 0) {
        const tree = makeTree(card, Direction.Worse);
        const chart = makeChart(tree, card.name, true);
        const label = document.createElement("p");
        label.textContent = card.name + " is better than...";
        outdiv.appendChild(label);
        outdiv.appendChild(chart.node());
    }
}
class Timer {
    constructor() {
        this.currentMs = performance.now();
    }
    reset() {
        this.currentMs = performance.now();
    }
    checkpoint(desc) {
        const now = performance.now();
        const delta = now - this.currentMs;
        console.log(desc + ": " + delta + "ms");
        this.currentMs = now;
    }
}
;
function main() {
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
    const dag = {};
    processData(dag, rawData.black);
    processData(dag, rawData.red);
    processData(dag, rawData.white);
    processData(dag, rawData.artifact);
    processData(dag, rawData.blue);
    processData(dag, rawData.green);
    processData(dag, rawData.multi);
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
    const button = document.createElement("button");
    button.type = "button";
    button.style.display = "block";
    button.style.border = "none";
    button.style.textAlign = "center";
    button.style.cursor = "pointer";
    button.style.backgroundColor = "#4CAF50";
    button.innerText = "Generate Table of SW Cards";
    const button15 = document.createElement("button");
    button15.type = "button";
    button15.style.display = "block";
    button15.style.border = "none";
    button15.style.textAlign = "center";
    button15.style.cursor = "pointer";
    button15.style.backgroundColor = "#4C50AF";
    button15.innerText = "Generate Table of Best Cards";
    const button2 = document.createElement("button");
    button2.type = "button";
    button2.style.display = "block";
    button2.style.border = "none";
    button.style.textAlign = "center";
    button2.style.cursor = "pointer";
    button2.style.backgroundColor = "#AF504C";
    button2.innerText = "Find Out More";
    const div = document.createElement("div");
    div.appendChild(wrapperDiv);
    div.appendChild(button);
    div.appendChild(button15);
    div.appendChild(button2);
    const outdiv = document.createElement("div");
    div.appendChild(outdiv);
    document.body.appendChild(div);
    const trailerDiv = document.createElement("div");
    trailerDiv.style.height = CARD_HEIGHT;
    document.body.appendChild(trailerDiv);
    timer.checkpoint("Button Init");
    autocomplete(inputElem, Object.keys(dag));
    timer.checkpoint("Autocomplete Computation");
    inputElem.addEventListener("keydown", (event) => {
        if (event.key != "Enter") {
            return;
        }
        displayCharts(outdiv, dag, inputElem.value);
    });
    const tableMakers = [undefined, undefined];
    const renderTable = (dir) => {
        timer.reset();
        initializeMaximalCards(dag, maximalCards[dir], dir);
        if (tableMakers[dir] === undefined) {
            tableMakers[dir] = new TableMaker(maximalCards[dir], oracleData, dag, dir);
        }
        tableMakers[dir]?.renderTable(outdiv);
        timer.checkpoint("Render Table");
    };
    button.onclick = () => renderTable(Direction.Worse);
    button15.onclick = () => renderTable(Direction.Better);
    let philText = "";
    button2.onclick = () => {
        if (philText === "") {
            philText = philosophy.pageSource;
            const re = /\[\[([^\[\]]*)\]\]/g;
            philText = philText.replace(re, "<a class='cardlink'>$1</a>");
        }
        outdiv.replaceChildren("");
        outdiv.innerHTML = philText;
        for (const obj of document.getElementsByClassName("cardlink")) {
            imbueHoverImage(obj, getImageURL(obj.textContent));
        }
    };
}
main();
