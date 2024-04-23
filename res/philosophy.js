export const pageSource = `
<h1> Philosophy </h1>
<p>
This page documents magic cards that are <b>Strictly Worse</b> than other magic cards. The term <b>Strictly Worse</b> is not really a technical term in magic, and ultimately there is just about always some imaginable scenario where you might want a certain card over another. It might be obvious that [[Ancestral Recall]] is better than [[Inspiration]] or that [[Jade Avenger]] is better than [[Grizzly Bears]], but there are corner cases, and I go into those here.
</p>
<h2> Less Mana is Better </h2>
<p>
For the purposes of this exercise, a card that costs less mana and does the same thing is always better than a card that costs more mana. For example, [[Unsummon]] is better than [[Drown in Shapelessness]] because it does the same thing for less mana. Of course, there are cases in magic where the more expensive card would be better -- for example your [[Manaplasm]] will grow larger if you play the more expensive spell, or [[Scornful Egotist]] will grow larger with [[Accelerated Mutation]] than [[Gudul Lurker]]. The latter example was the entire theme of the Scourge set, so this isn't necessarily a fully ridiculous case in real magic, but this project just wouldn't work without this.
</p>
<h2> Less Restrictive Mana is Better </h2>
<p>
Due to the mechanics of Chroma and Devotion, one could argue for playing [[Swordwise Centaur]] in a deck over [[Terrain Elemental]] if the goal was to combo with [[Primalcrux]] and [[Aspect of Hydra]]. However, for the purpose of this exercise, it is considered always bad to have a more restrictive cost. This means that colored pips are worse than hybrid pips, and hybrid pips are worse than generic mana costs.
</p>
<h2> Types, Subtypes, and Supertypes (mostly) don't matter </h2>
<p>
This one is perhaps a bit more controvertial, but doing this as a blanket rule leads to simpler evaluation. To start with probably the simplest example, we consider creature subtypes to be incomparable, with it not being worse to have one creature type or another. Sure, in many cases you might want [[Mons's Goblin Raiders]] over [[Dwarven Trader]] because one interacts with Goblin support like [[Goblin King]], but maybe you are comboing with [[Dwarven Pony]]. And even if you don't have the pony, you might want to dodge [[Tivadar of Thorn]]. So, creature types are ignored for purposes of card comparison. The only subtypes I have considered advantageous are land subtypes, despite there being some hate for basic land types, this is almost always an advantage, and e.g being a Gate is almost entirely upside (there are no explicit ways to punish your opponent for playing a gate, but maybe your opponent is playing [[Maze's End]] and [[Annex]]...).

Perhaps a bit more controvertial is ignoring <i>supertypes</i>. The important one here is Legendary. So, for example, I consider in this data [[Isamaru, Hound of Konda]] to be better than [[Savannah Lions]], despite the fact that Isamaru is worse to have multiples of in an opening hand in a white weenie deck. So many modern creatures are legendary that it just isn't particularly interesting to restrict comparability by this. Other supertypes like Snow are also ignored. World too, and yes, that does come up. I do not consider Basic lands comparable with other cards, however.

Lastly the card types themselves. While [[Personal Tutor]] can't find [[Lightning Strike]], I still claim it is strictly better than [[Volcanic Hammer]], so the abilility to be cast at instant speed is a pro, and the type is ignored. I take this to the logical extreme, and also say for example [[Omega Myr]] is better than [[Squire]] because of the less restrict mana cost, and consider the artifact type irrelevant. So long as the act of playing the card provides the same or more value, the type of the card it is attached to is considered superfluous.
</p>

<h2> Two Player Games </h2>
All cards are assessed here on the basis of two-player games of magic. Some cards are built for multiplayer in such a way that they end up quite bad when assessed for two-player magic. One example is [[Mass Mutiny]] is heavily outclassed by all other [[Threaten]] style effects. Other cards that scale with opponents will all be assessed here entirely on the basis of having a single opponent.

<h2> Rules Sets </h2>
All cards are assessed based on being played in a game with fundamentally standard magic rules. This extends the two-player notion, and for example means that neither player has a Commander, and thus cards that reference commanders, like [[Flamekin Herald]] have meaningless abilities. Some rules variants are allowed, namely that cards could be played in either Constructed or Limited formats. Despite the fact I built this data mostly to drive cube-building, I do not take the preconditions of cube into consideration (e.g these cards may be played in non-singelton formats). I do take "funny" cards (i.e silver-boarded or acorn cards) into consideration, when they can be fairly assessed in comparison to another card. Lastly, ante rules are not in affect. Conspiracy cards with draft effects will be assessed purely based on their gameplay abilities assuming they appeared in your deck without being drafted (so for example [[Lore Seeker]] is just a 2/2). [[Regicide]] is a legal card to play in Legacy, but it would do nothing.

<h2> Removed Cards </h2>
For the most part, I want to consider all magic cards "in the pool." Some cards are really bad, and it could be tempting to for example say that we will not consider "Global Series Jiang Yanggu & Mu Yanling" because of how many truly awful cards in printed, adding new levels of awful for strictly worseness (why did they have to print [[Breath of Fire]] ?). However, due to the above notes on game modes, there are some cards I think do just have to be removed from the assessment pool. These come in a couple flavors, some of these cards would have to be assessed as literally blank cards based on my rules above. I also left in some Conspiracy cards, mostly because they were vanilla sizes that were interesting to compare, but [[Spire Phantasm]] being strictly worse then [[Snapping Drake]] would create an issue if I put Spire Phantasm in my strictly worse cube, as all of a sudden it wouldn't actually be worse than the drake in a draft.
<h3> Commander Cards </h3>
<ul>
<li>[[Acolyte of Bahamut]]</li>
<li>[[Agent of the Iron Throne]]</li>
<li>[[Agent of the Shadow Thieves]]</li>
<li>[[Arcane Signet]]</li>
<li>[[Biowaste Blob]]</li>
<li>[[Cactus Preserve]]</li>
<li>[[Candlekeep Sage]]</li>
<li>[[Captain Vargus Wrath]]</li>
<li>[[Clan Crafter]]</li>
<li>[[Cloakwood Hermit]]</li>
<li>[[Cloudkill]]</li>
<li>[[Command Beacon]]</li>
<li>[[Commander's Insignia]]</li>
<li>[[Commander's Sphere]]</li>
<li>[[Command Tower]]</li>
<li>[[Convergence of Dominion]]</li>
<li>[[Criminal Past]]</li>
<li>[[Cultist of the Absolute]]</li>
<li>[[Dragon Cultist]]</li>
<li>[[Dungeon Delver]]</li>
<li>[[Far Traveler]]</li>
<li>[[Feywild Visitor]]</li>
<li>[[Flaming Fist]]</li>
<li>[[Folk Hero]]</li>
<li>[[Font of Magic]]</li>
<li>[[Forge of Heroes]]</li>
<li>[[Fury Storm]]</li>
<li>[[Gray Harbor Merfolk]]</li>
<li>[[Guardian Augmenter]]</li>
<li>[[Guild Artisan]]</li>
<li>[[Hardy Outlander]]</li>
<li>[[Haunted One]]</li>
<li>[[Imposing Grandeur]]</li>
<li>[[Inspiring Leader]]</li>
<li>[[Jeweled Lotus]]</li>
<li>[[Keleth, Sunmane Familiar]]</li>
<li>[[Kediss, Emberclaw Familiar]]</li>
<li>[[Leadership Vacuum]]</li>
<li>[[Majestic Genesis]]</li>
<li>[[Master Chef]]</li>
<li>[[Myth Unbound]]</li>
<li>[[Netherborn Altar]]</li>
<li>[[Noble Heritage]]</li>
<li>[[Opal Palace]]</li>
<li>[[Passionate Archaeologist]]</li>
<li>[[Path of Ancestry]]</li>
<li>[[Popular Entertainer]]</li>
<li>[[Raised by Giants]]</li>
<li>[[Road of Return]]</li>
<li>[[Sanctum of Eternity]]</li>
<li>[[Scion of Halaster]]</li>
<li>[[Shameless Charlatan]]</li>
<li>[[Skull Storm]]</li>
<li>[[Stinging Study]]</li>
<li>[[Street Urchin]]</li>
<li>[[Stumpsquall Hydra]]</li>
<li>[[Sword Coast Sailor]]</li>
<li>[[Tangleweave Armor]]</li>
<li>[[Tavern Brawler]]</li>
<li>[[Tome of Legends]]</li>
<li>[[Veteran Soldier]]</li>
<li>[[War Room]]</li>
<li>[[Witch's Clinic]]</li>
</ul>
Conspiracy Draft Cards
<ul>
<li>[[Caller of the Untamed]]</li>
<li>[[Cogwork Grinder]]</li>
<li>[[Garbage Fire]]</li>
<li>[[Lurking Automaton]]</li>
<li>[[Noble Banneret]]</li>
<li>[[Paliano, the High City]]</li>
<li>[[Pyretic Hunter]]</li>
<li>[[Regicide]]</li>
<li>[[Smuggler Captain]]</li>
<li>[[Spire Phantasm]]</li>
<li>[[Arcane Savant]]</li>

</ul>
Ante Cards
<ul>
<li>[[Amulet of Quoz]]</li>
<li>[[Bronze Tablet]]</li>
<li>[[Contract from Below]]</li>
<li>[[Darkpact]]</li>
<li>[[Demonic Attorney]]</li>
<li>[[Jeweled Bird]]</li>
<li>[[Rebirth]]</li>
<li>[[Tempest Efreet]]</li>
<li>[[Timmerian Fiends]]</li>
</ul>
<h2> Competent Opponent </h2>


`