const pageSource = `
<h1> Philosophy </h1>
<p>
This page documents magic cards that are <b>Strictly Worse</b> than other magic cards. The term <b>Strictly Worse</b> is not really a technical term in magic, and ultimately there is just about always some imaginable scenario where you might want a certain card over another. It might be obvious that [[Ancestrall Recall]] is better than [[Inspiration]] or that [[Jade Avenger]] is better than [[Grizzly Bears]], but there are corner cases, and I go into those here.
</p>
<h2> Less Mana is Better </h2>
<p>
For the purposes of this exercise, a card that costs less mana and does the same thing is always better than a card that costs more mana. For example, [[Unsommon]] is better than [[Drown in Shapelessness]] because it does the same thing for less mana. Of course, there are cases in magic where the more expensive card would be better -- for example your [[Manaplasm]] will grow larger if you play the more expensive spell, or [[Scornful Egotist]] will grow larger with [[Accelerated Mutation]] than [[Gudul Lurker]]. The latter example was the entire theme of the Scourge set, so this isn't necessarily a fully ridiculous case in real magic, but this project just wouldn't work without this.
</p>
<h2> Less Restrictive Mana is Better </h2>
<p>
Due to the mechanics of Chroma and Devotion, one could argue for playing [[Swordwise Centaur]] in a deck over [[Terrain Elemental]] if the goal was to combo with [[Primalcrux]] and [[Aspect of Hydra]]. However, for the purpose of this exercise, it is considered always bad to have a more restrictive cost. This means that colored pips are worse than hybrid pips, and hybrid pips are worse than generic mana costs.
</p>
<h2> Types, Subtypes, and Supertypes (mostly) don't matter </h2>
<p>
This one is perhaps a bit more controvertial, but doing this as a blanket rule leads to simpler evaluation. To start with probably the simplest example, we consider creature subtypes to be incomparable, with it not being worse to have one creature type or another. Sure, in many cases you might want [[Mons's Goblin Raiders]] over [[Dwarven Trader]] because one interacts with Goblin support like [[Goblin King]], but maybe you are comboing with [[Dwarven Pony]]. And even if you don't have the pony, you might want to dodge [[Tividar of Thorn]]. So, creature types are ignored for purposes of card comparison. The only subtypes I have considered advantageous are land subtypes, despite there being some hate for basic land types, this is almost always an advantage, and e.g being a Gate is almost entirely upside (there are no explicit ways to punish your opponent for playing a gate, but maybe your opponent is playing [[Maze's End]] and [[Annex]]...).

Perhaps a bit more controvertial is ignoring <i>supertypes</i>. The important one here is Legendary. So, for example, I consider in this data [[Isamaru, Hound of Konda]] to be better than [[Savannah Lions]], despite the fact that Isamaru is worse to have multiples of in an opening hand in a white weenie deck. So many modern creatures are legendary that it just isn't particularly interesting to restrict comparability by this. Other supertypes like Snow are also ignored. World too, and yes, that does come up. I do not consider Basic lands comparable with other cards, however.

Lastly the card types themselves. While [[Personal Tutor]] can't find [[Lightning Strike]], I still claim it is strictly better than [[Volcanic Hammer]], so the abilility to be cast at instant speed is a pro, and the type is ignored. I take this to the logical extreme, and also say for example [[Omega Myr]] is better than [[Squire]] because of the less restrict mana cost, and consider the artifact type irrelevant. So long as the act of playing the card provides the same or more value, the type of the card it is attached to is considered superfluous.
</p>

<h2> Two Player Games </h2>
<h2> Competent Opponent </h2>


`