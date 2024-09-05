// @ts-ignore
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CARD_HEIGHT, CARD_WIDTH } from './hover.js'
import { getImageURL } from './image_url.js'
import { oracleData } from './oracle.js'

export function makeChart(data: any, rootName: string, startExpanded: boolean, fontSize: number): Node {
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