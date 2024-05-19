#!/usr/bin/python3.9

import sys 
import json 

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

def search_query(card) -> bool:
    if 'Creature' not in card['type_line']:
        return False
    if card['digital'] or card['layout'] == 'token':
        return False
    if ('colors' in card and 'W' in card['colors'] and len(card['colors']) == 1) or (
        'card_faces' in card and any('colors' in face and 'W' in face['colors'] for face in card['card_faces'])
    ):
        return True
    return False

if __name__ == "__main__":
    sw_file = 'res/data.js' if len(sys.argv) < 2 else sys.argv[1]
    sf_file = 'res/oracle-cards.json' if len(sys.argv) < 3 else sys.argv[2]
    sw = parse_sw(sw_file)
    sf = parse_sf(sf_file)
    official_names = {obj["name"] : obj for obj in sf if obj['layout'] != 'token'}
    sw_names = set()
    for elem in sw:
        try:
            sw_names.add(elem[0])
            sw_names.add(elem[1])
        except IndexError as e:
            print(elem)
            raise e

    sw_names = sw_names.union(get_text_names())    
    error_names = sw_names - set(official_names.keys())
    error_names = [name for name in error_names if not is_placeholder(name)]
    sq_names = {name for name, obj in official_names.items() if name not in sw_names and search_query(obj)}
    sw_names = sw_names.union(sq_names)
    if len(error_names) > 0:
        print("The Following are not actual mtg card names:")
        print('\n'.join(error_names))
    else:
        with open('res/filtered-oracle.js', 'w+') as outf:
            outf.write('export const all_cards = \n')
            filtered_names = {name: obj for name,obj in official_names.items() if name in sw_names}
            json.dump(filtered_names, outf)
        with open('res/unmatched-search.js', "w+") as outf:
            outf.write('export const pageSource = `\n<h1>Search Query Cards</h1>\n<ul>\n')
            for name in sq_names:
                outf.write(f"<li>[[{name}]]</li>\n")
            outf.write("</ul>`;\n")
        print("All Good! Exported File")  