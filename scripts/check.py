#!/usr/bin/python3.9

import sys
import json
from card import Card, CardDesc, Compare, construct_relationship_tree
from typing import Any 

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
    preserved_keys = ["colors", "mana_cost", "cmc", "type_line", "power", "toughness", "released_at"]
    ret = []
    for key in preserved_keys:
        if key in card:
            ret.append(card[key])
        elif "card_faces" not in card:
            ret.append("")
        elif key == "mana_cost":
            cost = card["card_faces"][0]["mana_cost"]
            c2 = card["card_faces"][1]["mana_cost"]
            if c2:
                cost += "//" + c2
            ret.append(cost)
        else:
            ret.append(card["card_faces"][0].get(key, ""))
    if "image_uris" in card:
        normal = card["image_uris"]["normal"]
    if card.get("card_faces", []):
        for face in card["card_faces"]:
            if "image_uris" in face:
                normal = face["image_uris"]["normal"]
                break
    ret.append(normal[len("https://cards.scryfall.io/normal/"):])
    return ret 

def is_real_card(obj):
    if obj['layout'] in ['token', 'reversible_card', "art_series"]:
        return False 
    weird_sets = ["Unknown Event", "Defeat a God", "Face the Hydra", 
                  "Battle the Horde", "M15 Prerelease Challenge"] 
    if obj['digital'] == True or obj["set_name"] in weird_sets or "alchemy" in obj.get("promo_types", []):
        return False
    weird_types = ['Token', 'Scheme', 'Emblem', 'Plane ', 
                   'Conspiracy', 'Card', 'Phenomenon', 
                   'Hero', 'Stickers', 'Vanguard',
                   'Dungeon']
    type_line = obj['type_line']

    subtype_point = type_line.index("\u2014") if "\u2014" in type_line else -1
    major_types = type_line[:subtype_point] if subtype_point != -1 else type_line
    minor_types = type_line[subtype_point:]
    weird_subtypes = ['Contraption', 'Attraction']
    if any(wt in major_types for wt in weird_types) or any(wt in minor_types for wt in weird_subtypes):
        return False
    return True 

def augment_rules(sw, sw_names, vanilla):
    # map from card name to vanilla spec
    invert_vanilla = {v: k for k,v in vanilla.items() }
    all_placeholders = set()
    for name in sw_names:
        if is_placeholder(name):
            all_placeholders.add(name)
    for name in invert_vanilla:
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
        return sugg[0] in rel_tree and is_name_in(rel_tree[sugg[0]], sugg[1], min_level)

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

def get_error_aliases(sw: list[list[str]], all_cards: dict[str, Any], vanilla: dict[str, str]):
    import datetime 
    error_aliases: set[str] = set()
    all_aliases: list[str] = []
    bad_date_aliases: dict[str, str] = {}
    for item in sw:
        if len(item) == 2:
            continue
        if item[2] != '=':
            raise ValueError(f"Found item {item} with 3 elements but not an alias")
        all_aliases.append(item[1])
        get_time = lambda x: datetime.datetime.strptime(all_cards[x]["released_at"], "%Y-%m-%d")
        dates = [get_time(name) for name in (item[0], item[1])]
        if dates[0] > dates[1]:
            if item[0] in bad_date_aliases:
                if get_time(item[1]) < get_time(bad_date_aliases[item[0]]):
                    bad_date_aliases[item[0]] = item[1]
            else:
                bad_date_aliases[item[0]] = item[1]
    for item in sw:
        if len(item) > 2:
            continue 
        for elem in item:
            if elem in all_aliases:
                error_aliases.add(elem)
    bad_vanilla_aliases = []
    for vanilla_name in vanilla.values():
        if vanilla_name in all_aliases:
            bad_vanilla_aliases.append(vanilla_name)
    return error_aliases, bad_date_aliases, bad_vanilla_aliases

def apply_realiases(sw: list[list[str]], realiases: dict[str, str]):
    for item in sw:
        if len(item) == 3 and item[1] in realiases:
            # remapping x -> y
            # this is an alias of z, x, = -> y, z, =
            # (in most cases, z == x)
            item[:] = [realiases[item[1]], item[0], "="]
        elif len(item) == 3 and realiases.get(item[0], "") == item[1]:
            # remapping x -> y
            # this an an alias of x, y, =
            # so it has to be redone as y, x, =
            item[:] = [item[1], item[0], "="]
        elif item[0] in realiases:
            item[0] = realiases[item[0]]
        elif item[1] in realiases:
            item[1] = realiases[item[1]]
      
def check_simplifying_placeholders(sw: list[list[str]]):
    tree = construct_relationship_tree(sw)
    def get_key(card: Card):
        return ":".join(sorted((c.name for c in card.worse_than)))
    invmap: dict[str, list[str]] = {}
    multikeys = []
    for card in tree.values():
        if len(card.worse_than) <= 2:
            continue
        k = get_key(card)
        if k not in invmap:
            invmap[k] = []
        else:
            multikeys.append(k)
        invmap[k].append(card.name)
    if len(multikeys) > 0:
        print("The following cards have identical worse than lists:")
    for mk in multikeys:
        print(f"{invmap[mk]}: {mk}")

def get_connected_components(id_to_edges):
    components = []
    id_to_component = {}
    def get_connected_components_from_root(id, edges, new_component):
        if id in id_to_component:
            # already reached this component by another edge
            return
        id_to_component[id] = new_component
        new_component.add(id)
        for elem in edges:
            val = abs(elem)
            get_connected_components_from_root(val, id_to_edges[val], new_component)
    
    for id_iter, edges_iter in id_to_edges.items():
        if id_iter in id_to_component:
            continue
        next_component = set()
        components.append(next_component)
        get_connected_components_from_root(id_iter, edges_iter, next_component)
    return components

def generateDotFiles(sw):
    card_to_id = {}
    id_to_card = [""]
    card_to_edges = {}
    for item in sw:
        if len(item) > 2:
            continue 
        for card in item:
            if card not in card_to_id:
                id_to_card.append(card)
                card_to_id[card] = len(id_to_card) - 1
            if card not in card_to_edges:
                card_to_edges[card] = []
        card_to_edges[item[0]].append((item[1], -1))
        card_to_edges[item[1]].append((item[0], 1))

    edgeset_to_card = {}
    canonicalize_edgeset = lambda edges: tuple(sign * card_to_id[name] for name, sign in sorted(edges, key=lambda x:card_to_id[x[0]]))
    for card, edges in card_to_edges.items():
        edgeset = canonicalize_edgeset(edges)
        edgeset_to_card[edgeset] = card_to_id[card]

    id_to_canonical_id = lambda c: edgeset_to_card[canonicalize_edgeset(card_to_edges[id_to_card[c]])]
    canonical_card_to_edges = {}
    sign = lambda x: 1 if x > 0 else -1
    for card, edges in card_to_edges.items():
        edgeset = tuple(sign(val) * id_to_canonical_id(abs(val)) for val in canonicalize_edgeset(edges))
        canonical_card_to_edges[id_to_canonical_id(card_to_id[card])] = edgeset 
 
    ccs = get_connected_components(canonical_card_to_edges)
    out_map = []
    out_map.append((canonical_card_to_edges.keys(), 'res/tot_graph.dot'))
    i = 0
    for cc in ccs:
        if len(cc) > 3:
            out_map.append((cc, f'res/tot_graph_{len(cc)}_{i}.dot'))
            i += 1
    for cards, fname in out_map:
        with open(fname, "w+") as outf:
            comment_layout = "#" if len(cards) < 100 else ""
                
            outf.write(f"digraph G {{\n{comment_layout}layout=twopi;\nranksep=3;\nratio=auto;\n")
            for card in cards:
                edgeset = canonical_card_to_edges[card]
                for edgeval in edgeset:
                    if edgeval < 0:
                        continue
                    my_name = id_to_card[card].replace('"', '')
                    other_name = id_to_card[edgeval].replace('"','')
                    outf.write(f'"{my_name}" -> "{other_name}";\n')
            outf.write("}\n")

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
    error_aliases, bad_date_aliases, bad_vanilla_aliases = get_error_aliases(sw, official_names, vanilla)
    has_error = False
    #check_simplifying_placeholders(sw)
    if len(error_aliases) > 0:
        print("The Following are used as aliases and also first class names:")
        print('\n'.join(error_aliases))
        has_error = True
    if len(bad_date_aliases) > 0:
        print("The Following are aliases where the newer card aliases the older:")
        print('\n'.join(f"{k, v}" for k,v in bad_date_aliases.items()))
        apply_realiases(sw, bad_date_aliases)
        sw.sort()
    if len(bad_vanilla_aliases) > 0:
        print("The Following are names used in vanilla.json which are aliases:")
        print('\n'.join(bad_vanilla_aliases))
        has_error = True
    if len(error_names) > 0:
        print("The Following are not actual mtg card names:")
        print('\n'.join(error_names))
        has_error = True
    if not has_error:
        with open('res/filtered-oracle.js', 'w+') as outf:
            outf.write('export const all_cards = \n')
            filtered_names = {name: simplify_obj(obj) for name,obj in official_names.items() if name in sw_names}
            json.dump(filtered_names, outf, separators=(',', ':'))
        with open('res/filtered-oracle-unmatched.js', "w+") as outf:
            outf.write('export const all_cards = \n')
            filtered_names = {name: simplify_obj(obj) for name,obj in official_names.items() if name in non_sw_names}
            json.dump(filtered_names, outf, separators=(',', ':'))
        all_data_items = set()
        with open('res/data.js', "w+") as outf:
            outf.write('export const all_relations = [\n')
            first = True
            for item in sw:
                if not first: outf.write(",\n")
                json.dump(item, outf)
                first = False
                all_data_items.add(item[0])
                all_data_items.add(item[1])
            outf.write("\n];")
        """
        all_data_list = list(all_data_items)
        index_map = {}
        index = 0
        for item in all_data_list:
            index_map[item] = index
            index += 1
        with open('res/compressed_data.js', "w+") as outf:
            outf.write(f'export const all_names = {str(all_data_list)};\n')
            outf.write(f'export const all_relations = [\n')
            first = True
            for item in sw:
                if not first: outf.write(",")
                first = False 
                outf.write(f"[{index_map[item[0]]},{index_map[item[1]]}{',=' if len(item) == 3 else ''}]")
            outf.write(";\n")
        """
        generateDotFiles(sw)
        print(f"Relation Count: {len(sw)}")
        print("All Good! Exported Files")