# StrictlyWorse

(c) Sam Donow 2024

This repository contains the code, data, and tools for recording an enumeration of Magic: the Gethering
card relationships, in particular which cards are "strictly worse" than others.

The site is live at [mtg.blue](http://mtg.blue)
## Use

If attempting to run this directly, rather than accessing a hosted version online, the key components are:

- `scripts/dl.py` downloads source data from Scryfall's API
- `scripts/check.py` checks and updates `data.js` and associated files for relationships
- `src/sw.ts` contains the main code for the website, built with `tsc` (Typescript Compiler) to `res/sw.js`
- `res/data.js` contains the mappings / source data. To add a new mapping, add an entry of the form `["worse card", "better card"]`

I am not very familiar/interesting in web development and attempted to minimize dependencies here: the only build dependencies are `python` (tested with 3.9) and `tsc` (tested with 4.4.3)

## Resources

Thanks to Scryall, whose resources were both critical to research of this project, as well as whose data serves to 
enhance the presentation of data

## Contact

I do not have a structured way for people to e.g send suggestions for new mappings, but I can generally be reached for comment on this site at

mtgsw@samdonow.com