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

if __name__ == "__main__":
    main()