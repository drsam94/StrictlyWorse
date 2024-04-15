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

    error_names = sw_names - set(official_names.keys())
    error_names = [name for name in error_names if not is_placeholder(name)]
    if len(error_names) > 0:
        print("The Following are not actual mtg card names:")
        print('\n'.join(error_names))
    else:
        with open('res/filtered-oracle.js', 'w+') as outf:
            outf.write('export const all_cards = \n')
            filtered_names = {name: obj for name,obj in official_names.items() if name in sw_names}
            json.dump(filtered_names, outf)
        print("All Good! Exported File")  