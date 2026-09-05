#!/usr/bin/python3.9
import requests # type: ignore
import datetime
import json
import os
import gzip

def is_bad(card):
    return card['lang'] != 'en' or card['digital'] == True 

def better_example(card, prev_data):
    if is_bad(card):
        return False 
    elif is_bad(prev_data):
        return True 
    my_released = datetime.datetime.strptime(card["released_at"], "%Y-%m-%d")
    old_released = datetime.datetime.strptime(prev_data["released_at"], "%Y-%m-%d")

    allowed_pts = ["starterdeck","planeswalkerdeck", "mediainsert"]
    pts = lambda x: [pt for pt in x.get("promo_types", []) if pt not in allowed_pts]
    allowed_effects = ["colorshifted", "mooneldrazifdc", "tombstone", "legendary"]
    effects = lambda x: [fe for fe in x.get("frame_effects", []) if fe not in allowed_effects]
    bling = lambda x: len(effects(x)) + len(pts(x)) + int(x.get("reprint"))
    if bling(card) > bling(prev_data):
        return False
    if my_released < old_released or bling(card) < bling(prev_data):
      return True

def main():
    headers = {"User-Agent": "mtg.blue Strictly Worse Cards Database"}
    r = requests.get('https://api.scryfall.com/bulk-data', headers=headers)
    j = r.json()
    if r.status_code != 200:
        print("Failed to get bulk-data:", r.text)
    oracle = next(datum for datum in j["data"] if datum["type"] == "default_cards")
    uri = oracle["jsonl_download_uri"]
    local_filename = "oracle_data.jsonl.gz"
    with requests.get(uri, stream=True, headers=headers) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192): 
                # If you have chunk encoded response uncomment if
                # and set chunk_size parameter to None.
                #if chunk: 
                f.write(chunk)
    jsonl_file = gzip.open(local_filename)
    kept_entries = {}
    all_json = []
    for line in jsonl_file:
        entry = json.loads(line)
        all_json.append(entry)
        name = entry["name"]
        if ("layout" in entry and "token" in entry["layout"]):
            continue
        if name not in kept_entries or better_example(entry, kept_entries[name]):
            kept_entries[name] = entry
    
    with open('res/oracle-cards.json', "w+") as f:
        json.dump(list(kept_entries.values()), f)
    with open('res/oracle-allcards.json', "w+") as f:
        json.dump(all_json, f)
    sym = requests.get('https://api.scryfall.com/symbology', headers=headers)
    j = sym.json()
    if not os.path.exists("res/ico"):
      os.mkdir("res/ico")
    for datum in j['data']:
        uri = datum["svg_uri"]
        img = requests.get(uri)
        name = datum['symbol'][1:-1].replace('/', '_')
        with open(f'res/ico/{name}.svg', 'wb+') as f:
            f.write(img.content)
    
    sym = requests.get('https://api.scryfall.com/sets', headers=headers)
    j = sym.json()
    for datum in j['data']:
        uri = datum.get('icon_svg_uri', None)
        if not uri:
            continue
        img = requests.get(uri)
        name = datum['code']
        with open(f'res/ico/{name}.svg', 'wb+') as f:
            f.write(img.content)
        
if __name__ == "__main__":
    main()