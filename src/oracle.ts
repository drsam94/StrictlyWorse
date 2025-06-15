// @ts-ignore
import * as _oracleData from '../res/filtered-oracle.js';
// @ts-ignore
import * as _oracleDataUnmapped from '../res/filtered-oracle-unmatched.js';

export enum FilterCategory {
  Unset = 0,
  Playtest = 1,
  Un = 2,
  Digital = 3,
  UniversesBeyond = 4,
  OtherPromotional = 5,
  WeakMultiplayer = 6,
}

export interface OracleItem {
  released_at: string;
  power: string;
  toughness: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  colors: Array<string>;
  image_uri: string;
  set: string;
  filter_category: FilterCategory;
}
export interface Oracle {
  all_cards: Record<string, OracleItem>;
}

function expandOracle(oData: Record<string, Array<any>>): Oracle {
  const ret: Oracle = { all_cards: {} };
  for (const [name, rawOracle] of Object.entries(oData.all_cards)) {
    ret.all_cards[name] = {
      "colors": rawOracle[0],
      "mana_cost": rawOracle[1],
      "cmc": rawOracle[2],
      "type_line": rawOracle[3],
      "power": rawOracle[4],
      "toughness": rawOracle[5],
      "released_at": rawOracle[6],
      "set": rawOracle[7],
      "image_uri": rawOracle[8],
      "filter_category": FilterCategory[rawOracle[9] as keyof typeof FilterCategory],

    };
  }
  return ret
}
export const oracleData: Oracle = expandOracle(_oracleData);
export const oracleDataUnmapped: Oracle = expandOracle(_oracleDataUnmapped);

