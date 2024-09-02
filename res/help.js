export const pageSource = `
<h1> Help </h1>
<p>
This page presents some FAQs for using this website
</p>
<h2> Who made this and how can I contact them? </h2>
See <a href="https://github.com/drsam94/StrictlyWorse">The GitHub Page</a> for this project.
<h2> Why was this made? </h2>
I have for a long time been interested in bad magic cards, wanting to make a home for them. To this end, I have long had a cube consisting only 
of Strictly Worst magic cards, which can be found <a href="https://cubecobra.com/cube/list/e11">here</a>. I would constantly find out that
I either could add a card I had not previously thought about or I had included a card that made the cube invalid, so I figured that the only solution 
was to construct a high quality data set for knowing the relationships between cards, rather than trusting myself to keep it all straight.
<h2> Why can't I find a card in the search bar? </h2>
The main search bar only searches <b>mapped</b> cards, i.e cards that I have a record of being better or worse than another card.
If a card is not comparable to any other, it will not show up.
<h2> What is the definition of Worst and Best cards? </h2>
For the tables of these cards, these are the "maximal" sets of cards. In particular, Worst cards are any cards that are strictly worse than
other cards but strictly better than no other cards, while Best cards are better than something without being worse than anything.

To limit the size of the table, the Best cards table actually only lists cards that are better than at least two cards, while the worst table
lists truly all cards.

<h2> How do I use the advanced search? </h2>
The advanced search feature allows you to first choose a card pool (mapped cards, unmapped cards, or best or worst cards), then enter
a search query, and see what cards match.

This search query is based on <a href="https://scryfall.io">Scryfall's</a> search syntax, but is more limited, in particular it 
supports only keys for color (c), cmc, power (pow), toughness (tou), and type (t). 

I may implement further terms in the future, but the main missing feature is searching oracle text, which I avoid for now to avoid
having to load a significant amount of data. 

This feature was largely added to make finding new unmapped cards easier, e.g you can look at all green 1-drops at once and see which
have not yet been marked as better than [[Willow Elf]].
`;