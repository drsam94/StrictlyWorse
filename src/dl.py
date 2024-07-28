#!/usr/bin/python3.9
import requests
import datetime
import json

def better_example(card, prev_data):
    if card['lang'] == 'en' and prev_data['lang'] != 'en':
        return True 
    my_released = datetime.datetime.strptime(card["released_at"], "%Y-%m-%d")
    old_released = datetime.datetime.strptime(prev_data["released_at"], "%Y-%m-%d")
    return my_released < old_released

def main():
    r = requests.get('https://api.scryfall.com/bulk-data')
    j = r.json()
    oracle = next(datum for datum in j["data"] if datum["type"] == "default_cards")

    uri = oracle["download_uri"]
    file_request = requests.get(uri)
    kept_entries = {}
    for entry in file_request.json():
        name = entry["name"]
        if ("layout" in entry and "token" in entry["layout"]):
            continue
        if name not in kept_entries or better_example(entry, kept_entries[name]):
            kept_entries[name] = entry
    
    with open('res/oracle-cards.json', "w+") as f:
        json.dump(list(kept_entries.values()), f)

    sym = requests.get('https://api.scryfall.com/symbology')
    j = sym.json()
    for datum in j['data']:
        if datum["appears_in_mana_costs"] == False:
            continue 
        uri = datum["svg_uri"]
        img = requests.get(uri)
        name = datum['symbol'][1:-1].replace('/', '_')
        with open(f'res/{name}.svg', 'wb+') as f:
            f.write(img.content)
        
if __name__ == "__main__":
    main()