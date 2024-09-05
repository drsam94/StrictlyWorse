import { Oracle } from './oracle.js'
export function getImageURL(name: string, oracle: Oracle) {
  const card = oracle.all_cards[name];
  if (card === undefined) {
    return "";
  }
  const faces = card["card_faces"];
  const face = card["image_uris"] === undefined ? faces[0] : card;
  return face["image_uris"]["normal"];
}