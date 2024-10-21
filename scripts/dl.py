#!/usr/bin/python3.9
import requests # type: ignore
import datetime
import json
import os

def is_bad(card):
    return card['lang'] != 'en' or card['digital'] == True 

def better_example(card, prev_data):
    if is_bad(card):
        return False 
    elif is_bad(prev_data):
        return True 
    my_released = datetime.datetime.strptime(card["released_at"], "%Y-%m-%d")
    old_released = datetime.datetime.strptime(prev_data["released_at"], "%Y-%m-%d")
    if my_released < old_released:
      return True
    bling = lambda x: len(x.get("frame_effects", [])) + len(x.get("promo_types", []))
    return bling(card) < bling(prev_data)

def main():
    r = requests.get('https://api.scryfall.com/bulk-data')
    j = r.json()
    oracle = next(datum for datum in j["data"] if datum["type"] == "default_cards")

    uri = oracle["download_uri"]
    file_request = requests.get(uri)
    kept_entries = {}
    all_json = file_request.json()
    for entry in all_json:
        name = entry["name"]
        if ("layout" in entry and "token" in entry["layout"]):
            continue
        if name not in kept_entries or better_example(entry, kept_entries[name]):
            kept_entries[name] = entry
    
    with open('res/oracle-cards.json', "w+") as f:
        json.dump(list(kept_entries.values()), f)
    with open('res/oracle-allcards.json', "w+") as f:
        json.dump(all_json, f)
    sym = requests.get('https://api.scryfall.com/symbology')
    j = sym.json()
    if not os.path.exists("res/ico"):
      os.mkdir("res/ico")
    for datum in j['data']:
        uri = datum["svg_uri"]
        img = requests.get(uri)
        name = datum['symbol'][1:-1].replace('/', '_')
        with open(f'res/ico/{name}.svg', 'wb+') as f:
            f.write(img.content)
        
if __name__ == "__main__":
    main()