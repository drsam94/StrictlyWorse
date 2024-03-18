import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as rawData from '../res/data.js';
function initNode(dag, key) {
    if (!(key in dag)) {
        dag[key] = {
            name: key,
            better: [],
            worse: []
        };
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
        console.log(elem);
        if (elem.length != 2) {
            continue;
        }
        const worse = elem[0];
        const better = elem[1];
        const worseNode = initNode(dag, worse);
        const betterNode = initNode(dag, better);
        worseNode.better.push(betterNode);
        betterNode.worse.push(worseNode);
        if (betterNode.better.length == 0) {
            top_level.push(betterNode);
        }
    }
    for (let i = top_level.length - 1; i >= 0; --i) {
        if (top_level[i].better.length > 0) {
            top_level.splice(i, 1);
        }
    }
    const to_remove = [];
    for (let i = 0; i < top_level.length; ++i) {
        for (let j = i + 1; j < top_level.length; ++j) {
            if ((deep_equal(top_level[i].worse, top_level[j].worse) &&
                deep_equal(top_level[i].better, top_level[j].better))) {
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
        if (top_level[i].worse.length == 1 && top_level[i].worse[0].worse.length == 0) {
            top_level.splice(i, 1);
        }
    }
    const data = { "name": "root", "children": [], value: 1, depth: 1 };
    recurAddChildren(data, top_level, "worse");
    return data;
}
function isPlaceholder(childName) {
    if ((childName[0] < '0' || childName[0] > '9') && childName != "MORPH") {
        return false;
    }
    return true;
}
function recurAddChildren(rootNode, childList, dir) {
    let depthIncrease = 0;
    for (const child of childList) {
        const obj = { name: child.name, children: [], value: 1, depth: 1 };
        rootNode.children.push(obj);
        let depthSubtree = recurAddChildren(obj, child[dir], dir);
        if (isPlaceholder(child.name)) {
            --depthSubtree;
        }
        depthIncrease = Math.max(depthIncrease, depthSubtree);
        rootNode.value += obj.value;
    }
    rootNode.depth += depthIncrease;
    return rootNode.depth;
}
function makeTree(rootNode, dir) {
    const data = { name: rootNode.name, "children": [], value: 1, depth: 1 };
    recurAddChildren(data, rootNode[dir], dir);
    return data;
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
    const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
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
        root.eachBefore(node => {
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
            .data(nodes, d => d.id);
        const nodeEnter = node.enter().append("g")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0)
            .on("click", (event, d) => {
            d.children = d.children ? null : d._children;
            update(event, d);
        });
        nodeEnter.append("circle")
            .attr("r", 2.5)
            .attr("fill", d => d.data.value > 5 ? "#900" : d._children ? "#555" : "#999")
            .attr("stroke-width", 10);
        const getLabel = (data) => {
            if (data.value <= 1) {
                return data.name;
            }
            else {
                return data.name + " " + data.value + "(" + data.depth + ")";
            }
        };
        nodeEnter.append("text")
            .attr("dy", "0.31em")
            .attr("x", d => d._children ? -6 : 6)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => getLabel(d.data))
            .attr("stroke-linejoin", "round")
            .attr("stroke-width", 3)
            .attr("stroke", "white")
            .attr("fill", d => d.data.value > 5 ? "#900" : "#555")
            .attr("paint-order", "stroke");
        const nodeUpdate = node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1);
        const nodeExit = node.exit().transition(transition).remove()
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .attr("fill-opacity", 0)
            .attr("stroke-opacity", 0);
        const link = gLink.selectAll("path")
            .data(links, d => d.target.id);
        const linkEnter = link.enter().append("path")
            .attr("d", d => {
            const o = { x: source.x0, y: source.y0 };
            return diagonal({ source: o, target: o });
        });
        link.merge(linkEnter).transition(transition)
            .attr("d", diagonal);
        link.exit().transition(transition).remove()
            .attr("d", d => {
            const o = { x: source.x, y: source.y };
            return diagonal({ source: o, target: o });
        });
        root.eachBefore(d => {
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
const dag = {};
const chart1 = makeChart(processData(dag, rawData.black), "black");
const chart2 = makeChart(processData(dag, rawData.red), "red");
const chart3 = makeChart(processData(dag, rawData.white), "white");
const chart4 = makeChart(processData(dag, rawData.artifact), "artifact");
const chart5 = makeChart(processData(dag, rawData.blue), "blue");
const chart6 = makeChart(processData(dag, rawData.green), "green");
const chart7 = makeChart(processData(dag, rawData.multi), "multi");
const inputElem = document.createElement("input");
inputElem.type = "text";
inputElem.style.border = "1px solid transparent";
inputElem.style.backgroundColor = "#f1f1f1";
inputElem.style.padding = "10px";
inputElem.style.fontSize = "16px";
inputElem.style.width = "100%";
const div = document.createElement("div");
div.appendChild(inputElem);
const outdiv = document.createElement("div");
div.appendChild(outdiv);
div.appendChild(chart1.node());
div.appendChild(chart2.node());
div.appendChild(chart3.node());
div.appendChild(chart4.node());
div.appendChild(chart5.node());
div.appendChild(chart6.node());
div.appendChild(chart7.node());
document.body.appendChild(div);
inputElem.onkeydown = (event) => {
    if (event.key != "Enter") {
        return;
    }
    outdiv.replaceChildren("");
    const card = dag[inputElem.value];
    if (!card) {
        const text = document.createElement("p");
        text.textContent = inputElem.value + " Not Found";
        outdiv.appendChild(text);
        return;
    }
    if (card.better.length > 0) {
        const tree = makeTree(card, "better");
        const chart = makeChart(tree, card.name, true);
        outdiv.appendChild(chart.node());
    }
    if (card.worse.length > 0) {
        const tree = makeTree(card, "worse");
        const chart = makeChart(tree, card.name, true);
        outdiv.appendChild(chart.node());
    }
};
