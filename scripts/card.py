from enum import Enum
class Card:
    def __init__(self, name):
        self.name = name
        self.worse_than = []
    

def construct_relationship_tree(inData) -> dict[str, Card]:
    dag: dict[str, Card] = {}
    def initNode(name: str):
        if name not in dag:
            dag[name] = Card(name)
        return dag[name]
    
    for elem in inData:
        if len(elem) > 2:
            continue
        worse = elem[0]
        better = elem[1]
        worse_node = initNode(worse)
        better_node = initNode(better)
        worse_node.worse_than.append(better_node)
    return dag 

class Compare(Enum):
    Less = 1
    Equal = 2
    Greater = 3
    Incomparable = 4

# TODO: use attrs? might make it harder for others to use
class CardDesc:
    positive_kw = ["Trample", "Flying", "Lifelink", "Haste", 
                   "Reach", "Vigilance", "Hexproof", "Deathtouch", "Menace", "Flash", "Firebreathing"]
    negative_kw = ["Noblock", "Defender"]
    two_word_positive_kw = ["Add", "First", "Double"]
    two_word_negative_kw = ["Can't"]
    def __init__(self, placeholder_name: str):
        parts = placeholder_name.split(' ')
        self.cost = parts[0]
        it = iter(parts[1:])
        self.positives: dict[str, float] = {}
        self.negatives: dict[str, float] = {}
        self.pow = "0"
        self.tou = "0"
        self.desc = placeholder_name
        def handle_part(part: str, weight = 1.0):
            if part in CardDesc.two_word_positive_kw:
                next_part = next(it)
                self.positives[" ".join((part, next_part))] = weight
            elif '/' in part:
                self.pow, self.tou = part.split('/')
            elif part in CardDesc.positive_kw:
                self.positives[part] = weight
            elif part in CardDesc.negative_kw:
                self.negatives[part] = weight
            # + and - are used to represent abstractly better/worse: this creates an incomparable advantage or disadvantage
            # or can be applied to kw as a modify, i.e -Flying is "sometimes flying"
            elif part.startswith("+"):
                if len(part[1:]) <= 1:
                    self.positives[placeholder_name] = 1
                else:
                    handle_part(part[1:], 0.5)
            elif part.startswith("-"):
                if len(part[1:]) <= 1:
                    self.negatives[placeholder_name] = 1
                else:
                    handle_part(part[1:], 0.5)
            elif part in CardDesc.two_word_negative_kw:
                next_part = next(it)
                self.negatives[" ".join((part, next_part))] = weight
            else:
                raise ValueError(f"Unmapped Part: {part} in {placeholder_name}")
        for p in it:
            handle_part(p)

  
    @staticmethod 
    def _compare_arrays(arr1, arr2):
        if len(arr1) != len(arr2):
            return Compare.Incomparable
        results = [float(arr1[i]) - float(arr2[i]) for i in range(len(arr2))]
        if all(r == 0 for r in results):
            return Compare.Equal
        elif all(r <= 0 for r in results):
            return Compare.Less
        elif all(r >= 0 for r in results):
            return Compare.Greater
        else:
            return Compare.Incomparable
    
    @staticmethod
    def _decompose_cost(cost: str):
        cost = cost.replace('X', '')
        if not cost:
            cost = "0"
        ret = [0, 0, 0, 0, 0, 0]
        offs = 1
        if cost[0] in "0123456789":
            ret[0] = int(cost[0])
        else:
            offs = 0
        for c in cost[offs:]:
            ret["WUBRG".index(c) + 1] += 1
      
        ret[0] = sum(ret)
        return ret
    
    @staticmethod
    def _compare_cost(cost1: str, cost2: str):
        dc1 = CardDesc._decompose_cost(cost1)
        dc2 = CardDesc._decompose_cost(cost2)
        # Less cost is better 
        return CardDesc._compare_arrays(dc2, dc1)
        
    @classmethod
    def _merge_result(cls, results):
        if Compare.Incomparable in results:
            return Compare.Incomparable
        g = Compare.Greater in results 
        l = Compare.Less in results 
        if g and l:
            return Compare.Incomparable
        if not g and not l:
            return Compare.Equal
        if g:
            return Compare.Greater
        else:
            return Compare.Less

    @classmethod
    def _compare_modifiers(cls, map1: dict[str, float], map2: dict[str, float], *, invert=False) -> Compare:
        values_compare = [val - map2.get(key, 0.) for key, val in map1.items()]
        keys_included = all(key in map1 for key in map2)
        if all(v == 0 for v in values_compare) and keys_included and len(map1) == len(map2):
            return Compare.Equal 
        if all(v >= 0 for v in values_compare) and keys_included:
            return Compare.Greater if not invert else Compare.Less 
        if all(v <= 0 for v in values_compare) and all(key in map2 for key in map1):
            return Compare.Less if not invert else Compare.Greater
        else:
            return Compare.Incomparable
    
    def compare(_self, other) -> Compare:
        self = _self
        x_slot = -1
        if 'X' in self.cost and 'X' in other.cost:
            # not handling X vs X right now
            return Compare.Incomparable
        if 'X' in self.cost:
            self = CardDesc(self.desc)
            dc_self, dc_other = CardDesc._decompose_cost(self.cost), CardDesc._decompose_cost(other.cost)
            x_val = dc_other[0] - dc_self[0]
            self.pow = str(eval(self.pow.replace('X', str(x_val))))
            self.tou = str(eval(self.tou.replace('X', str(x_val))))
            x_slot = 0
        if 'X' in other.cost:
            other = CardDesc(other.desc)
            dc_self, dc_other = CardDesc._decompose_cost(self.cost), CardDesc._decompose_cost(other.cost)
            x_val = dc_self[0] - dc_other[0]
            other.pow = str(eval(other.pow.replace('X', str(x_val))))
            other.tou = str(eval(other.tou.replace('X', str(x_val))))
            x_slot = 1
        cost_result = CardDesc._compare_cost(self.cost, other.cost)
        pt_result = CardDesc._compare_arrays([int(self.pow), int(self.tou)], [int(other.pow), int(other.tou)])
        neg_result = CardDesc._compare_modifiers(self.negatives, other.negatives, invert=True)
        pos_result = CardDesc._compare_modifiers(self.positives, other.positives)
        results = (cost_result, pt_result, neg_result, pos_result)
        res = CardDesc._merge_result(results)
        if (x_slot == 0 and res == Compare.Less) or (x_slot == 1 and res == Compare.Greater):
            # Not having this can crete an erroneous worse than: just because an X card is worse
            # at a given cost doesn't mean it is actually worse
            return Compare.Incomparable 
        return res 
    
