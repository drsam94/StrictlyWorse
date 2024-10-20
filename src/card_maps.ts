import { Card, CardCategory, Direction } from './card.js'
import { Oracle, OracleItem, oracleData, oracleDataUnmapped } from './oracle.js'

const worseSet: Record<string, Set<string>> = {};
const betterSet: Record<string, Set<string>> = {};
export function getTotalChildSet(dir: Direction) {
  return dir == Direction.Worse ? worseSet : betterSet;
}

const maximalCards: Record<Direction, Array<Card>> = [[], [], []];
function initializeMaximalCards(dag: Record<string, Card>, toInit: Array<Card>, dir: Direction) {
  if (toInit.length == 0) {
    for (const [cardName, card] of Object.entries(dag)) {
      if (card.name !== cardName) {
        // Skip alias nodes
        continue;
      }
      const stats = card.stats(dir);
      const ostats = card.stats(dir == Direction.Better ? Direction.Worse : Direction.Better);
      if (dir === Direction.Better && ostats.degree === 1 && ostats.total === 1) {
        // skip 1-1 better cards
        continue;
      }
      if (stats.cards.length == 0 && !card.isPlaceholder()) {
        toInit.push(card);
      }
    }
  }
}

export function getMaximalCards(dir: Direction) {
  return maximalCards[dir];
}

const total_sets: Record<CardCategory, Array<Card>> = [[], [], [], [], []];
const total_map: Record<string, CardCategory> = {};
export function initializeTotalSets(dag: Record<string, Card>) {
  if (total_sets[0].length !== 0) {
    return;
  }
  for (const dir of [Direction.Better, Direction.Worse]) {
    initializeMaximalCards(dag, maximalCards[dir], dir);
  }

  total_sets[CardCategory.Best] = maximalCards[Direction.Better];
  total_sets[CardCategory.Worst] = maximalCards[Direction.Worse];
  total_sets[CardCategory.Mapped] = Object.values(dag);

  const unmappedOracle = Object.keys(oracleDataUnmapped.all_cards);
  const unmappedCards = new Array<Card>(unmappedOracle.length);
  for (let i = 0; i < unmappedCards.length; ++i) {
    unmappedCards[i] = new Card(unmappedOracle[i]);
  }
  total_sets[CardCategory.Unmapped] = unmappedCards;

  for (const cat of [CardCategory.Best, CardCategory.Worst, CardCategory.Unmapped]) {
    for (const card of total_sets[cat]) {
      total_map[card.name] = cat;
    }
  }
  for (const card of total_sets[CardCategory.Mapped]) {
    if (!(card.name in total_map)) {
      total_map[card.name] = CardCategory.Mapped;
    }
  }
}

export function getTotalSet(cat: CardCategory): Array<Card> {
  return total_sets[cat];
}
export function getCategory(name: string): CardCategory {
  return total_map[name] ?? CardCategory.Unknown;
}
export function getOracle(cat: CardCategory): Oracle {
  return cat == CardCategory.Unmapped ? oracleDataUnmapped : oracleData;
}
export function getOracleData(name: string): [OracleItem, CardCategory] {
  const cat = getCategory(name);
  return [getOracle(cat).all_cards[name], cat];
}