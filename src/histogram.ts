// @ts-ignore
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CARD_HEIGHT } from './hover.js'

export class DateHistogramEntry {
  public date: string;
  public card: string;

  constructor(d: string, c: string) {
    this.date = d;
    this.card = c;
  }
};
export function makeDateHistogram(indata: Array<DateHistogramEntry>): Node {
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
      if (d.length < 10) {
        for (let i = 0; i < d.length; ++i) {
          cardList += `<li> ${d[i].card} </li>`;
        }
      } else {
        cardList += `<li> ${d.length} cards </li>`;
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