import { Direction } from './card.js';
import { HashInfo } from './hash.js';
export enum Page {
  card,
  search,
  checker,
  table,
  help,
  philosophy,
  home,
  stats,
  components,
  path
}

export function changeLocation(loc: Page, arg?: any): void {
  const hash = new HashInfo();
  switch (loc) {
    case Page.card:
    case Page.search:
      hash.update(Page[loc], (arg as string));
      break;
    case Page.table:
      hash.update(Page[loc], Direction[arg as Direction]);
      break;
    case Page.home:
      hash.update(Page[loc]);
      break;
    case Page.path:
      hash.update(Page[loc]);
      break;
    default:
      hash.update("page", Page[loc]);
      break;
  }
}