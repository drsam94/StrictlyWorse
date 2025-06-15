// @ts-ignore
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { CardCategory } from './card.js'

export function makeCategoryChart(catData: Record<CardCategory, number>): Node {
  // set the dimensions and margins of the graph
  let width = 450;
  let height = 450;
  let margin = 40;

  // The radius of the pieplot is half the width or half the height (smallest one). I subtract a bit of margin.
  let radius = Math.min(width, height) / 2 - margin;

  // append the svg object to the div called 'my_dataviz'
  let svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);
  let container = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Create dummy data
  let data = catData;

  // set the color scale
  let color: Record<CardCategory, string> = {
    [CardCategory.Mapped]: 'purple',
    [CardCategory.Unmapped]: 'black',
    [CardCategory.Best]: 'blue',
    [CardCategory.Worst]: 'red',
    [CardCategory.Unknown]: 'black',
  };

  // Compute the position of each group on the pie:
  let pie = d3.pie()
    .value(function (d: any) { return d[1]; })

  let data_ready = pie(Object.entries(data))
  // Now I know that group A goes from 0 degrees to x degrees and so on.

  // shape helper to build arcs:
  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  container
    .selectAll('mySlices')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', arcGenerator)
    .attr('fill', function (d: any) { return color[d.data[0] as CardCategory]; })
    .attr("stroke", "black")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)

  // Now add the annotation. Use the centroid method to get the best coordinates
  container
    .selectAll('mySlices')
    .data(data_ready)
    .enter()
    .append('text')
    .text(function (d: any) {
      const count = d.data[1];
      if (count == 0) {
        return "";
      }

      return `${CardCategory[d.data[0]]}: ${count}`;
    })
    .attr("transform", function (d: any) { return "translate(" + arcGenerator.centroid(d) + ")"; })
    .style("text-anchor", "middle")
    .style("font-size", 17)

  return svg.node();
}