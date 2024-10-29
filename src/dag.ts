import { Card, Direction } from './card.js'
import { getTotalChildSet } from './card_maps.js'
import { addUnion } from './set.js'

function initNode(dag: Record<string, Card>, key: string): Card {
  if (!(key in dag)) {
    dag[key] = new Card(key);
  }
  return dag[key];
}

export function processData(inData: Array<Array<string>>): Record<string, Card> {
  const dag: Record<string, Card> = {};
  for (const elem of inData) {
    const worse = elem[0];
    const better = elem[1];
    const worseNode = initNode(dag, worse);
    const betterNode = initNode(dag, better);
    if (elem.length === 3) {
      if (elem[2] === '=') {
        dag[better] = worseNode;
        continue;
      }
    }
    worseNode.stats(Direction.Better).cards.push(betterNode);
    const betterCards = betterNode.stats(Direction.Worse).cards;
    betterCards.push(worseNode);
  }
  computeStats(dag);
  return dag;
}

function computeStats(dag: Record<string, Card>): void {
  function computeStatsRecursive(card: Card, dir: Direction) {
    const set = getTotalChildSet(dir);
    if (set[card.name] === undefined) {
      set[card.name] = new Set();
      const ws = set[card.name];
      let maxDegree = 0;
      for (const worse of card.stats(dir).cards) {
        computeStatsRecursive(worse, dir);
        ws.add(worse.name);
        addUnion(ws, set[worse.name]);
        let childDegree = worse.stats(dir).degree + (worse.isPlaceholder() ? 0 : 1);
        maxDegree = Math.max(maxDegree, childDegree);
      }
      const stats = card.stats(dir);
      stats.degree = maxDegree;
      for (const c of ws) {
        stats.total += dag[c].isPlaceholder() ? 0 : 1;
      }
    }
  }
  for (const card of Object.values(dag)) {
    computeStatsRecursive(card, Direction.Worse);
    computeStatsRecursive(card, Direction.Better);
  }
}
// { name: rootNode.name, "children": [], value: rootNode.stats(dir).total, depth: rootNode.stats(dir).degree };
class TreeNode {
  public readonly name: string;
  public children: Array<TreeNode>;
  public readonly value: number;
  public readonly depth: number;

  public constructor(sourceNode: Card, dir: Direction) {
    this.name = sourceNode.name;
    this.children = [];
    const stats = sourceNode.stats(dir)
    this.value = stats.total;
    this.depth = stats.degree
  }
};

function recurAddChildren(rootNode: TreeNode, childList: Array<Card>, dir: Direction) {
  for (const child of childList) {
    const obj = new TreeNode(child, dir);
    let newRoot = obj;
    if (!child.isPlaceholder()) {
      let childAlreadyExists = false;
      for (const chi of rootNode.children) {
        if (chi.name === child.name) {
          childAlreadyExists = true;
          break;
        }
      }
      if (!childAlreadyExists) {
        rootNode.children.push(obj);
      }
    } else {
      newRoot = rootNode;
    }
    recurAddChildren(newRoot, child.stats(dir).cards, dir);
  }
}

function recurCleanTree(rootNode: TreeNode, dir: Direction) {
  // This cleans the tree to remove instances of
  //
  //    B
  //   /
  // A
  //   \
  //    C - B
  //
  // Because B is transitively related to A, we should not also claim it is directly a child of A.
  // We generally keep the input data clean of these cases, but they can arise due to the collapsing
  // of
  const allDeeper = new Set<string>();
  const totalSet = getTotalChildSet(dir);
  for (const child of rootNode.children) {
    addUnion(allDeeper, totalSet[child.name])
  }
  const filteredChildren = [];
  for (const child of rootNode.children) {
    if (!allDeeper.has(child.name)) {
      filteredChildren.push(child);
    }
    recurCleanTree(child, dir);
  }
  rootNode.children = filteredChildren;
}

export function makeTree(rootNode: Card, dir: Direction) {
  const data = new TreeNode(rootNode, dir);
  recurAddChildren(data, rootNode.stats(dir).cards, dir);

  recurCleanTree(data, dir);

  return data;
}
