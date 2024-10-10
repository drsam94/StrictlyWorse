// @ts-ignore
import * as _oracleData from '../res/filtered-oracle.js';
// @ts-ignore
import * as _oracleDataUnmapped from '../res/filtered-oracle-unmatched.js'; 

export interface ImageURIs {
  normal: string;
}
export interface OracleItem {
  released_at: string;
  power: string;
  toughness: string;
  mana_cost: string;
  card_faces: Array<any>;
  cmc: number;
  type_line: string;
  colors: Array<string>;
  image_uris: ImageURIs;
}
export interface Oracle {
  all_cards: Record<string, OracleItem>;
}

export const oracleData: Oracle = _oracleData;
export const oracleDataUnmapped: Oracle = _oracleDataUnmapped;