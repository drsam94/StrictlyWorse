import { Direction } from './card.js';

export enum Page {
  card,
  search,
  checker,
  table,
  help,
  philosophy,
  home,
  stats,
  components
}

export function changeLocation(loc: Page, arg?: any): void {
  switch (loc) {
    case Page.card:
    case Page.search:
      window.location.hash = Page[loc] + "-" + (arg as string);
      break;
    case Page.table:
      window.location.hash = Page[loc] + "-" + Direction[arg as Direction];
      break;
    case Page.home:
      window.location.hash = Page[loc];
      break;
    default:
      window.location.hash = "page-" + Page[loc];
      break;
  }
}