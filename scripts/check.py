#!/usr/bin/python3.9

import sys
import json
from card import Card, CardDesc, Compare, construct_relationship_tree

def parse_sw(file: str):
    content = '['
    for line in open(file).readlines():
        if line.startswith('export') or line.startswith(']'):
            continue
        content += line
    content += ']'
    return json.loads(content)

def parse_sf(file: str):
    return json.load(open(file))

def is_placeholder(name: str) -> bool:
    return name in ["MORPH"] or ('/' in name and '//' not in name) or (name[0].isdigit())

def get_text_names() -> set[str]:
    import re
    text_file = 'res/philosophy.js'
    r = re.compile(r'\[\[([^\[\]]*)\]\]')
    names = set()
    for match in r.finditer(open(text_file).read()):
        names.add(match.group(1))
    return names

def any_prop(card, key: str, val: str) -> bool:
    if key in card and card[key] == val:
        return True
    if 'card_faces' in card and any(key in face and face[key] == val for face in card['card_faces']):
        return True
    return False

def simplify_obj(card):
    preserved_keys = ["card_faces", "image_uris", "colors", "mana_cost", "cmc", "type_line", "power", "toughness", "released_at"]
    ret = {key: value for key, value in card.items() if key in preserved_keys}
    if "image_uris" in ret:
        normal = ret["image_uris"]["normal"]
        ret["image_uris"] = {"normal": normal}
    if "card_faces" in ret:
        faces = []
        for face in ret["card_faces"]:
            if "image_uris" in face:
                normal = face["image_uris"]["normal"]
                face["image_uris"] = {"normal": normal}
                faces.append(face)
        ret["card_faces"] = faces
    return ret 

def is_real_card(obj):
    if obj['layout'] in ['token', 'reversible_card', "art_series"]:
        return False 
    if 'Token' in obj['type_line'] or obj['digital'] == True:
        return False
    return True 


def augment_rules(sw, sw_names, vanilla):
    # map from card name to vanilla spec
    invert_vanilla = {v: k for k,v in vanilla.items() }
    all_placeholders = set()
    for name in sw_names:
        if is_placeholder(name):
            all_placeholders.add(name)
        if name in invert_vanilla:
            all_placeholders.add(invert_vanilla[name])
  
    placeholder_descs = [CardDesc(desc) for desc in all_placeholders if all(kw not in desc for kw in ["MORPH", "Instant"])]
    total_descs = len(placeholder_descs)
    suggestions = []
    reduce_name = lambda desc: vanilla.get(desc, desc)
    for i in range(0, total_descs):
        for j in range(i + 1, total_descs):
            descs = placeholder_descs[i], placeholder_descs[j]
            comp = descs[0].compare(descs[1])
            first, second = (0, 1) if comp == Compare.Less else (1, 0)
            names = [reduce_name(descs[first].desc), reduce_name(descs[second].desc)]
            if comp in [Compare.Equal, Compare.Incomparable]:
                continue
            suggestions.append(names)
    rel_tree = construct_relationship_tree(sw)
    def is_redundant(sugg: tuple[str, str], min_level = 0):
        def is_name_in(lhs: Card, rhs: str, min_level):
            for card in lhs.worse_than:
                if card.name == rhs and min_level == 0:
                    return True 
                if is_name_in(card, rhs, max(min_level - 1, 0)):
                    return True 
            return False
        return is_name_in(rel_tree[sugg[0]], sugg[1], min_level)

    def print_item(item: tuple[str, str]):
        return f'["{item[0]}", "{item[1]}"]'
    for sugg in suggestions:
        import bisect
        loc = bisect.bisect_left(sw, sugg)
        if sw[loc] == sugg:
            continue
        if is_redundant(sugg):
            continue 
        print(f"Adding Inferred Rule: {print_item(sugg)}")
        sw.insert(loc, sugg)

    rel_tree = construct_relationship_tree(sw)
    ret_sw = []
    for item in sw:
        if len(item) > 2:
            pass
        elif is_redundant(item, 1):
            print(f"Removing redundant item {print_item(item)}")
            continue 
        ret_sw.append(item)
    return ret_sw

def get_error_aliases(sw: list[list[str]]):
    error_aliases: set[str] = set()
    all_aliases: list[str] = []
    for item in sw:
        if len(item) == 2 or item[2] != '=':
            continue
        all_aliases.append(item[1])
    for item in sw:
        if len(item) > 2:
            continue 
        for elem in item:
            if elem in all_aliases:
                error_aliases.add(elem)
    return error_aliases 

if __name__ == "__main__":
    sw_file = 'res/data.js' if len(sys.argv) < 2 else sys.argv[1]
    sf_file = 'res/oracle-cards.json' if len(sys.argv) < 3 else sys.argv[2]
    vanilla_file = 'res/vanilla.json' if len(sys.argv) < 4 else sys.argv[3]
    vanilla = json.load(open(vanilla_file))
    sw = parse_sw(sw_file)
    filtered_sw = []
    lastItem: list[str] = []
    filtered_items = []
    for item in sw:
        for i in range(len(item)):
            if item[i] in vanilla:
                item[i] = vanilla[item[i]]
        if item != lastItem:
            filtered_sw.append(item)
            lastItem = item
        else:
            filtered_items.append(", ".join(item))
    if len(filtered_items) > 0:
        print(f"Removed {len(filtered_items)} duplicates: {chr(10).join(filtered_items)}")
    sw = filtered_sw

    sf = parse_sf(sf_file)
    official_names = {obj["name"] : obj for obj in sf if is_real_card(obj)}
    raw_sw_names = set()
    for elem in sw:
        try:
            raw_sw_names.add(elem[0])
            raw_sw_names.add(elem[1])
        except IndexError as e:
            print(elem)
            raise e
    sw_names = raw_sw_names.union(get_text_names())
    error_names: list[str] = []
    ph_names: list[str] = []
    for name in sw_names - set(official_names.keys()):
        (ph_names if is_placeholder(name) else error_names).append(name)
    non_sw_names = {name for name, obj in official_names.items() if name not in sw_names}
    sw.sort()
    sw = augment_rules(sw, sw_names, vanilla)
    error_aliases = get_error_aliases(sw)
    if len(error_aliases) > 0:
        print("The Following are used as aliases and also first class names:")
        print('\n'.join(error_aliases))
    elif len(error_names) > 0:
        print("The Following are not actual mtg card names:")
        print('\n'.join(error_names))
    else:
        with open('res/filtered-oracle.js', 'w+') as outf:
            outf.write('export const all_cards = \n')
            filtered_names = {name: simplify_obj(obj) for name,obj in official_names.items() if name in sw_names}
            json.dump(filtered_names, outf)
        with open('res/filtered-oracle-unmatched.js', "w+") as outf:
            outf.write('export const all_cards = \n')
            filtered_names = {name: simplify_obj(obj) for name,obj in official_names.items() if name in non_sw_names}
            json.dump(filtered_names, outf)
        with open('res/data.js', "w+") as outf:
            outf.write('export const all_relations = [\n')
            first = True
            for item in sw:
                if not first: outf.write(",\n")
                json.dump(item, outf)
                first = False
            outf.write("\n];")
            print(f"Relation Count: {len(sw)}")
        print("All Good! Exported Files")