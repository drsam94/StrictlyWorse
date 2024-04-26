#!/usr/bin/python3.9
import requests
import json

def main():
    r = requests.get('https://api.scryfall.com/bulk-data')
    j = r.json()
    oracle = next(datum for datum in j["data"] if datum["type"] == "oracle_cards")

    uri = oracle["download_uri"]
    file_request = requests.get(uri)
    with open('res/oracle-cards.json', "w+") as f:
        json.dump(file_request.json(), f)

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