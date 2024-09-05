// @ts-ignore
import * as _oracleData from '../res/filtered-oracle.js';
// @ts-ignore
import * as _oracleDataUnmapped from '../res/filtered-oracle-unmatched.js'; 

export interface Oracle {
  all_cards: Record<string, any>;
}

export const oracleData: Oracle = _oracleData;
export const oracleDataUnmapped: Oracle = _oracleDataUnmapped;