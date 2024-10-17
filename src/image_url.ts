import { Oracle } from './oracle.js'
export function getImageURL(name: string, oracle: Oracle) {
  const card = oracle.all_cards[name];
  if (card === undefined) {
    return "";
  }
  return "https://cards.scryfall.io/normal/" + card.image_uri;
}