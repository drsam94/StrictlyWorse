import { Direction } from './card.js';

export function displayCharts(name: string): void {
  window.location.hash = "card-" + name;
}
export function renderSearch(query: string) {
  window.location.hash = "search-" + query;
}
export function renderChecker() {
  window.location.hash = "page-checker"
}
export function renderTable(dir: Direction) {
  window.location.hash = "table-" + Direction[dir];
};