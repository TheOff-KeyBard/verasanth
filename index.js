/**
 * Verasanth — Cloudflare Worker Backend
 * Database: Cloudflare D1 (SQLite-compatible)
 * All game data embedded — no Python imports needed.
 * Design direction: see GAME_DIRECTION.md
 */

import { runAdminCommand } from "./admin.js";

// ─────────────────────────────────────────────────────────────
// GAME DATA (embedded from Python source)
// ─────────────────────────────────────────────────────────────

const WORLD = {"market_square": {"name": "The Market Square", "description": "The beating heart of Verasanth \u2014 open, loud, and permanent. Stalls ring the edges selling things you mostly recognize. At the center stands a raised wooden stage beside a tall iron post hung with notices, bounties, and things people want found. Four roads lead outward in each direction. At the square's eastern edge, a heavy iron grate sits flush with the cobblestones. Everyone knows what is down there. Nobody talks about it. The shadows here fall at a slightly wrong angle for the light. You notice it and then you try not to.", "exits": {"north": "north_road", "south": "south_road", "east": "east_road", "west": "west_road"}, "objects": {"ember_post": {"desc": "The Ember Post \u2014 an iron column at the center of the square that has been here longer than anyone admits. Notices cover its face in layers: some fresh, some weathered, some in ink that should have faded decades ago and hasn't. The board behind them is warm to the touch. Not sun-warm. Warm the way something living is warm from within. Notices flutter when the air is perfectly still. New ones appear overnight. Old ones vanish without anyone seeing them go. The wood grain beneath the notices forms patterns that resemble streets \u2014 none of them matching the city outside. Read the board to see what is currently posted.", "actions": ["read", "inspect"]}, "stage": {"desc": "A raised wooden platform, worn smooth by use. Built for announcements, declarations, and the occasional execution. Currently empty.", "actions": ["inspect", "stand"]}, "sewer_grate": {"desc": "A heavy iron grate, old enough that the hinges have grown into the stone. A city ordinance post is nailed nearby \u2014 the ink has faded to nothing. Cold air rises through the gaps, carrying a smell like ash and old iron. If you stand near it long enough, you feel a faint vibration through the soles of your feet \u2014 low and slow, like something far below is breathing in time with itself. Whatever is down there has been down there a long time.", "actions": ["inspect", "open", "enter"]}, "sky": {"desc": "The sky above Verasanth is always slightly wrong. The clouds move slower than they should. The stars, when they appear, form patterns no constellation map you have ever seen would account for. The moon \u2014 when it is visible \u2014 has edges too sharp for something that should be a sphere seen from a distance. Most people stop looking up after the first few days. This is probably wise.", "actions": ["inspect", "look"]}, "curator_stall": {"desc": "Seris Vantrel's stall is the quietest place in the market square. Not because it lacks activity \u2014 she is always present, always attending \u2014 but because everything about it is calibrated to draw attention inward rather than outward. Dark wood, real velvet, objects spaced with the deliberateness of a museum that knows exactly what it has and what it is worth. The objects on display are not for sale. They are reference points. She is looking for something specific and these are the things she has found that are adjacent to it. She watches you approach the way someone watches a door they have been waiting to open.", "actions": ["talk", "inspect", "sell", "browse"]}}, "items": []}, "north_road": {"name": "North Road \u2014 The Threshold District", "description": "The road leading north from the square is older than the others \u2014 the cobblestones are a different cut, a different color, like this part of the city was here before the rest was built around it. The Shadow Hearth Inn sits to the west. The Dawnforge Atelier is further north, its sign just visible. There is something about this road that makes you stand up slightly straighter. An awareness of being observed that has no obvious source. The city watching new arrivals. You are still new enough to feel it.", "exits": {"south": "market_square", "west": "tavern", "north": "atelier", "east": "alley"}, "objects": {"inn_sign": {"desc": "A carved wooden sign: THE SHADOW HEARTH INN. The lettering is old but the sign is well-maintained. Someone cares about this.", "actions": ["read", "inspect"]}, "atelier_sign": {"desc": "Flowing elven script on polished wood, just legible from here. You catch the word Dawnforge. The rest is beyond you.", "actions": ["read", "inspect"]}, "old_foundation": {"desc": "At the base of the building on the east side of the road, the foundation stones are a different material to everything above them \u2014 darker, fitted without mortar, each block precisely the same size. The building on top was constructed around them rather than from them. This part of the city is older than the city. You have the brief, sourceless impression that you have stood on this exact spot before.", "actions": ["inspect"]}}, "items": []}, "south_road": {"name": "South Road \u2014 The Low Quarter", "description": "The Low Quarter does not announce itself. The buildings lean closer here, the gaps between them darker. The smell of tallow and worked leather is everywhere. Two shops face each other across the road \u2014 one smelling of metal and oil, one of something harder to name. It is the kind of street where people do business without making eye contact. There is a weight to this road that the others do not have \u2014 not danger, exactly. More like the accumulated pressure of a great number of things that did not go the way anyone hoped. The city's oldest scars are here. You feel them without knowing what they are.", "exits": {"north": "market_square", "west": "mended_hide", "east": "still_scale"}, "objects": {"armor_sign": {"desc": "Burned wood, letters pressed in: THE MENDED HIDE. Below it, smaller: Armor. Repair. No credit.", "actions": ["read", "inspect"]}, "trade_sign": {"desc": "A clean brass plate: THE STILL SCALE \u2014 General Trade. The plate is newer than everything around it.", "actions": ["read", "inspect"]}, "wall_crack": {"desc": "A crack in the mortar between two buildings, running from ground level to about chest height. It should not be significant. But cold air pushes through it steadily regardless of the temperature on either side, and when you press your ear to the stone you hear something that might be settling and might be something else entirely.", "actions": ["inspect"]}}, "items": []}, "east_road": {"name": "East Road \u2014 The Ember Quarter", "description": "The Ember Quarter has a different quality of silence \u2014 less absence of sound and more sound being absorbed. The buildings here are older, the stonework more deliberate. A smell of dried herbs drifts from the north side of the road. Further along, a wide doorway stands open \u2014 no sign, no name, just the faint glow of candlelight from within. You get the feeling of being evaluated here \u2014 not watched, exactly, but measured. Like the road is taking stock of what you are and what you might become and has not yet decided whether either is interesting.", "exits": {"west": "market_square", "north": "hollow_jar", "east": "ashen_sanctuary"}, "objects": {"herb_bundles": {"desc": "Bundles of dried plants hang from a hook outside the apothecary. You recognize almost none of them. The ones you do recognize should not grow in hell.", "actions": ["inspect"]}, "sanctuary_arch": {"desc": "A stone archway, unmarked. No deity symbol, no inscription. The stone is older than anything else on this road. The candlelight beyond it is steady in a way that has nothing to do with air movement.", "actions": ["inspect"]}, "familiar_corner": {"desc": "The corner where this road meets the alley to the north. There is nothing remarkable about it. And yet you have the distinct, sourceless impression that you have stood here before \u2014 not in this life, not in any life you can account for, but somewhere in the layered history of this place a version of you stood on this exact corner and felt exactly this. The feeling passes. The corner remains unremarkable.", "actions": ["inspect"]}}, "items": []}, "west_road": {"name": "West Road \u2014 The Pale Rise", "description": "The western road is the widest and the quietest. The buildings here are larger \u2014 built for something that has not arrived yet. Empty windows look down from above. The road is clean in the way of places maintained out of habit rather than use. At the far end, a gate stands closed. Beyond it, foundations that someone began and stopped. There is a tension in the air here that is not quite dread \u2014 closer to the feeling in the moment before something significant happens. The city has been waiting for a ruler for a long time. It has not stopped expecting one.", "exits": {"east": "market_square"}, "objects": {"pale_gate": {"desc": "Wrought iron, twice your height. Locked with a chain that looks newer than the gate itself. Beyond it, large buildings half-built and long abandoned. Someone had plans here. Plans require a ruler.", "actions": ["inspect", "open"]}, "empty_building": {"desc": "A large stone building with dark windows and a cleared threshold. No sign. No name. Built to impress someone who has not arrived yet.", "actions": ["inspect"]}}, "items": []}, "tavern": {"name": "The Shadow Hearth Inn", "description": "The inn is warm. Not warm the way a room is warm when a fire is burning \u2014 warm the way a room is warm when it has been warm for a very long time and the warmth has become part of the walls. The hearth burns low and steady at the far end, no crackle, no flare, just a patient flame that has apparently never needed tending. A few empty tables. A dog near the fire that lifts its head when you enter and does not look away. Behind the bar, a broad dwarf with burn-scarred braids watches you with the patience of someone who has seen this exact moment before. The silence between sounds is too deep. The air is thick in the specific way of a room that is listening. You walked into the middle of something that started long before you arrived. You will not be here when it ends.", "exits": {"east": "north_road"}, "objects": {"bartender": {"desc": "Kelvaris Thornbeard \u2014 burn-scarred braids, a clouded left eye, and a stillness that is not patience so much as depth. He watches you the way the room watches you, which is to say completely, which is to say as if he already knows how this ends.", "actions": ["talk", "inspect"]}, "hearth": {"desc": "The hearthstone is older than the building around it. You know this the way you know things your body understands before your mind catches up. The stone is smooth in places no one could have touched \u2014 the back face, the underside of the mantle, surfaces only reachable if you were inside the fire. Carved into the face of the stone: symbols, shallow and worn, cut by something older than tools. They look familiar. You cannot place them yet. The fire burns without crackling, without variation, without need. The temperature in the room is always exactly right. It has never been otherwise.", "actions": ["inspect", "warm"]}, "dog": {"desc": "It lies in the same spot near the hearth with the completeness of something that has always been there. The fur is mostly grey but never fully grey \u2014 caught, permanently, at the threshold of old age. It does not bark. It does not beg. When you approach, it lifts its head and looks at you with eyes that are dark and steady and contain more accumulated stillness than any animal's eyes should hold. Its fur is warm to the touch. Warmer than the room. Warmer than proximity to the fire would account for. It has no name. Kelvaris has never called it anything.", "actions": ["inspect", "pet"]}, "ledger": {"desc": "A thick ledger on the shelf below the bar, heavier than it should be when you lift it. The most recent entries are in Kelvaris's hand \u2014 dates, names, room numbers, marks paid. Further back, the handwriting changes. Then changes again. Dozens of hands over what the dates suggest are centuries, but the tone never changes \u2014 the same careful record-keeping, the same shorthand, the same habit of noting not just names but something brief about each arrival. A word or two. Enough to remember. The earliest entries are in a script you do not recognize. The ink has not faded. Some names appear more than once, separated by decades, in the same handwriting both times. Partway through, in Kelvaris's hand, an entry: MARROWIN DASK \u2014 Room 3 \u2014 Paid in full. The date is impossible. The note beside the name reads: quiet. One word. The same word Kelvaris uses for people he does not want to discuss.", "actions": ["inspect", "read"]}, "bar": {"desc": "The surface is warm and worn smooth \u2014 not cleaned smooth, worn smooth, by time and the weight of hands and glasses across a span that wood should not survive. The grain runs in patterns that are almost maps \u2014 streets branching, intersecting, curving back \u2014 none of them matching the city outside. When you look away and look back, the pattern has shifted slightly. Not moved. Shifted. As if it is showing you something different each time and waiting to see which version you react to. Kelvaris taps it twice when he sets something down. He does not seem aware he does this.", "actions": ["inspect"]}, "walls": {"desc": "The stone blocks are not all from the same era. You can see it in the color, the cut, the grain \u2014 some blocks are centuries older than the others, slotted into the wall without explanation. Press your palm flat to the oldest ones and you feel a faint vibration, deep and slow and perfectly regular, like something vast is breathing just on the other side of the stone. The mortar lines between blocks shift when you are not watching them. Not enough to see. Enough to feel.", "actions": ["inspect"]}, "table": {"desc": "Scarred wood, knife marks, rings from a thousand glasses. In the corner, carved with something sharp and small: J+K. The carving is old. The letters are precise. Someone took their time.", "actions": ["sit", "stand", "inspect"]}, "noticeboard": {"desc": "Room rates. House rules. A note that reads: 'Pay before you sleep.' Beneath everything, pinned flat and half-covered, a piece of paper with nothing written on it that feels, when you touch it, like it is waiting for something to become true before it is written down.", "actions": ["read", "inspect"]}}, "items": ["mug"]}, "atelier": {"name": "Dawnforge Atelier", "description": "The door is heavy and opens with a soft metallic sigh, like something exhaling. There is a bracket above the frame where a bell would hang. The bracket is empty. Whatever was there has been gone long enough that the absence feels permanent. Inside, the air is warm but clean \u2014 metal and oil and something faintly resinous that you will later learn is a traditional elven forging compound no one in Verasanth would know to stock. The atelier is divided into three clear zones: forge in the corner, tools on the wall, assembly table running the length of the room. Nothing is out of place. Nothing is dusty. Nothing is new. A single skylight cuts the ceiling. The light it admits is dimmer than it should be, and the dust motes drifting through it move with a slowness that has nothing to do with air. Caelir does not look up at it. You get the sense he made this decision some time ago and has not revisited it.", "exits": {"south": "north_road"}, "objects": {"weaponsmith": {"desc": "Caelir Dawnforge stands at the assembly table with the stillness of someone who has learned that stillness is a form of endurance. His hands move through the work in precise, unhurried sequences \u2014 not slow, but never a motion wasted. He does not announce when he is aware of you. He simply continues, and eventually speaks, as if conversation is one more thing he has learned to do with the minimum necessary effort.", "actions": ["talk", "shop", "inspect"]}, "bell_bracket": {"desc": "An iron bracket above the door, sized for a small bell. Empty. The hook still has the slight curve from bearing weight for a long time. Caelir did not remove the bracket. Only the bell. You are not sure if he kept it or discarded it. You are sure the decision was deliberate.", "actions": ["inspect"]}, "forge": {"desc": "A squat rectangular forge in the near corner, burning lower than it should for the work it supports. The coals glow a muted, even orange \u2014 never flaring, never dimming, as if the fire has been trained to the same discipline as its keeper. The forge is old. Older than the atelier. Older, possibly, than this iteration of the city. The stone around the firebox has a patina that takes generations to develop.", "actions": ["inspect", "warm"]}, "tool_wall": {"desc": "Every tool hangs from its own hook in an arrangement that is not symmetrical but is absolutely intentional \u2014 grouped by use sequence, not by size or type, so that a hand moving through the work never reaches past one tool to get to another. Each hook is labeled in Elvish script cut directly into the wood. The script is old enough that a modern elf would need time to read it. Caelir wrote it himself. You can tell because the hand is the same as the script on the sign outside, and has not changed in however long both have been here.", "actions": ["inspect"]}, "assembly_table": {"desc": "A long workbench of dense dark wood, scarred from years of use in a specific pattern \u2014 straight lines at measured intervals, each mark the result of the same motion repeated in the same place. Not wear. Record. At the near end, scratched faintly into the wood in characters that are not Elvish and not Common: a count. You cannot tell what is being counted. The number is very large.", "actions": ["inspect"]}, "skylight": {"desc": "A square cut into the ceiling, admitting light that arrives dimmer than the sky outside would warrant. The edges are clean \u2014 this was not an afterthought. Caelir built this room around this light source. The dust motes drifting through it move too slowly, the way things slow in the presence of something paying close attention. Caelir never looks up at it while you are watching. You have the sense this is not because he has forgotten it is there.", "actions": ["inspect", "look"]}, "unfinished_blade": {"desc": "A blade laid on the far end of the assembly table, separate from the work currently in progress. The metal has been worked to a point \u2014 shaped, rough-ground, the edge geometry established \u2014 and then stopped. Not abandoned. Stopped. There is a difference in how a thing is set down when it will be returned to and how it is set down when the maker is waiting for something that has not happened yet. This blade is waiting. It has been waiting for a long time. When you reach toward it, something about the air near it makes your hand hesitate.", "actions": ["inspect", "touch"]}, "locked_chest": {"desc": "A chest of dark wood set against the wall beneath the tool rack, iron-banded, with a lock that has been engaged so long the keyhole has a faint ring of tarnish around it. The chest is not large. It is the size of something personal rather than something stored. There is no key visible anywhere in the atelier. Caelir has not looked at it since you entered, which is how you know he is aware you noticed it.", "actions": ["inspect", "open", "examine"]}}, "items": []}, "mended_hide": {"name": "The Mended Hide", "description": "The shop smells of leather oil, coal smoke, and old iron \u2014 and underneath all of it, very faintly, something that was blood a long time ago and has since become part of the leather itself. Nothing in here is displayed. Everything is stored \u2014 hung, stacked, folded with a precision that has nothing to do with aesthetics and everything to do with being able to find it fast. The walls have marks on them at irregular intervals: small symbols burned into the wood at about shoulder height, running the full perimeter of the room. You have the sense that they mean something specific and that Veyra put them there herself and that asking about them would be the wrong move. She is already looking at you when you walk in, the way someone looks at a problem they are in the process of solving.", "exits": {"east": "south_road"}, "objects": {"armorsmith": {"desc": "Veyra Emberhide \u2014 compact, deliberate, and already several assessments ahead of you. The burn scars along her left forearm are old and settled, and she wears them the way someone wears a reminder they chose to keep. Her hands do not stop moving while she looks at you. She is not being rude. She is being efficient.", "actions": ["talk", "shop", "inspect"]}, "wall_marks": {"desc": "Small symbols burned directly into the wood \u2014 not branded, carved first and then heat-set, each one deliberate. They run at shoulder height around the entire room without gap. You do not recognize the system they belong to. They are not decorative. The spacing is too consistent and the placement too purposeful for anything that was not meant to function. Veyra has not acknowledged that you are looking at them.", "actions": ["inspect"]}, "armor_stock": {"desc": "Leather and chain, hung without ceremony. Every piece has been finished \u2014 edges sealed, rivets checked, straps replaced where the original wore through. In the lining of each piece, worked in with the same small careful tool as the wall marks: a single symbol, different on each one. Not the same mark twice. Each piece is an apology to a different person.", "actions": ["inspect", "browse"]}, "workbench": {"desc": "A heavy workbench scarred by years of use, every tool in exactly the position it needs to be in for the work currently on the bench. No wasted motion encoded into the arrangement. On the near corner, a small piece of leather with a name scratched into it in plain letters that Veyra turns face-down when she notices you noticing it.", "actions": ["inspect"]}}, "items": []}, "still_scale": {"name": "The Still Scale", "description": "The Still Scale is better lit than anything else on the South Road and smells faintly of something pleasant you cannot identify. The shelves are organized in a way that makes immediate sense \u2014 rope here, torches there, rations stacked with the heaviest at the bottom \u2014 and then, between the sensible things, objects that do not belong and are not explained. A jar that hums. A chain with no purpose. A map of somewhere that is not Verasanth, rolled and propped next to a bundle of torches as if it belongs there. The trader behind the counter has been smiling since before you arrived. Not at you specifically. At everything, with the mild sustained amusement of someone who has found the situation \u2014 all of it, broadly \u2014 genuinely entertaining for a very long time.", "exits": {"west": "south_road"}, "objects": {"trader": {"desc": "Neat, pleasant, and impossible to place \u2014 the right age for any age, the right look for anywhere. You cannot identify the race and the trader has not volunteered it. The smile is genuine. That is the unsettling part. Most people in Verasanth are performing equanimity. The trader actually has it.", "actions": ["talk", "shop", "inspect"]}, "oddity_shelf": {"desc": "The shelf where the sensible inventory stops. A jar containing something that produces a low hum when your fingers touch the glass. A length of chain, heavy, with a clasp designed for something with a different number of limbs than you have. A rolled map of a city \u2014 streets, districts, a river \u2014 that does not match Verasanth's layout but matches the emotional shape of it. None of these are priced. The trader, if asked, says they are not for sale yet.", "actions": ["inspect"]}, "main_stock": {"desc": "Everything you would expect and need: rope in several lengths, torches, travel rations, basic tools, a few blades that are functional if not remarkable. All of it priced fairly. All of it well-maintained. The Still Scale stocks exactly what people arriving in Verasanth will eventually need, in exactly the quantities that make sense. The trader knew what to stock before anyone arrived to ask for it.", "actions": ["inspect", "browse"]}}, "items": []}, "hollow_jar": {"name": "The Hollow Jar", "description": "The shop is narrow and deep and smells of a hundred things that have been dried and stored and waiting longer than they should be waiting. The shelves go higher than the ceiling should allow. You look up to confirm this and find you cannot quite track where the shelves end and the darkness begins. The light comes from several small sources distributed around the room at heights and angles that do not correspond to any fixture you can locate. Everything is labeled in the same careful hand \u2014 some jars in language you recognize, some in symbols you do not, and a few with labels so old that whatever was written has faded to impressions in the paper rather than ink. She is already reading when you enter. She does not look up immediately. This is not because she did not hear you.", "exits": {"south": "east_road"}, "objects": {"alchemist": {"desc": "Thalara Mirebloom \u2014 human, which your eyes confirm and something else in you quietly disputes. She sits with the stillness of someone who has learned that most things resolve themselves if you wait long enough, and who has been waiting long enough to know this is true. When she looks at you it is with the full attention of someone who has already decided you are interesting and is now collecting evidence to confirm it.", "actions": ["talk", "shop", "inspect"]}, "jars": {"desc": "Hundreds of jars in rows precise enough to have been measured. The labels you can read: dried ashcap, cinder rat bile, silt from the second level, pale growth scrapings, ember shavings. A jar labeled only BEFORE. A jar labeled RESIDUE \u2014 ITERATION 4. A jar with no label containing something that moves very slowly when you tilt it in a way that has nothing to do with viscosity.", "actions": ["inspect", "browse"]}, "oldest_shelf": {"desc": "The lowest shelf on the far wall, half-hidden behind the others. The jars here are a different shape to the rest \u2014 older, the glass thicker and slightly green-tinted. The labels on these are not in Thalara's handwriting. They are in her handwriting, but older \u2014 the same hand learning to form the same letters at a different point in its development. The jars predate her current penmanship by what feels like decades. This does not make sense. You file it carefully.", "actions": ["inspect"]}, "reading_table": {"desc": "A low table with papers, open journals, and pressed specimens mounted under glass. The journal she was reading is face-down now \u2014 closed without a bookmark, which means she remembered the page, which means she has read it many times. On the corner of the table, a small ink drawing: the market square, rendered in detail, from an angle that does not correspond to any window in this building. The drawing is old. The square it depicts is the same square outside. The people in it are not wearing anything you recognize.", "actions": ["inspect"]}}, "items": []}, "ashen_sanctuary": {"name": "The Ashen Sanctuary", "description": "The air inside the Sanctuary is always slightly warmer than the Ember Quarter outside \u2014 not oppressively, but enough that you feel the difference the moment you cross the threshold. No iconography. No named deity. No explanation. Just a wide stone room, a low altar at the far end, and a silence so thick it absorbs sound rather than reflecting it. The light does not match the time of day outside. The candles burn without melting. The floor is worn in a path from door to altar by feet that came here before the current city existed. Something in here is awake. It has been awake for a very long time. It is aware that you have entered.", "exits": {"west": "east_road"}, "objects": {"altar": {"desc": "Smooth grey stone, uncarved, without symbol or inscription. No offerings rest on it \u2014 whatever was left here has been absorbed completely, leaving the surface unmarked. When you stand close, the air around it is still in a way that is different from the rest of the room. Not dead still. Held still. Something registers your presence. It does not feel like a god. It feels like something older that gods looked at and learned to fear. Use the commune action here to reach toward what waits.", "actions": ["inspect", "commune", "pray"]}, "candles": {"desc": "Dozens of candles in alcoves along both walls, all burning at exactly the same height. The wax has never dripped. You watch one for a full minute. It does not change. The flames do not flicker when you walk past them \u2014 not even when you move quickly, not even when you stand directly beside one and exhale. They are not flames. They are something that has learned to look like flames.", "actions": ["inspect"]}, "worn_path": {"desc": "The stone between the door and the altar is worn smooth \u2014 not by weather or water but by feet, thousands of them over an impossible span of time. The city above this room has been rebuilt more than once. The path has been here through all of it. People have been coming here since before the current Verasanth existed. Some of them knew why. Most did not. They came anyway.", "actions": ["inspect"]}, "walls": {"desc": "The stone walls are smooth under your palm \u2014 too smooth for worked stone, worn to this finish from the inside over a span of time you cannot calculate. Press your hand flat and hold it. After a moment you feel it: a faint pulse, deep and slow and utterly regular, like a heartbeat measured in decades. The floor cracks branch outward from the altar in patterns too deliberate to be settling. They seem to glow faintly when you look at them from the corner of your eye. When you look directly, they are simply cracks.", "actions": ["inspect", "touch"]}, "silence": {"desc": "You stop and listen. The Sanctuary is silent \u2014 but it is not empty silence. It is the silence of a room where something has been listening so long that sound itself has learned to be careful here. Your own breathing sounds too loud. Your heartbeat sounds like an announcement. Whatever is in here has been here long enough that your presence is the newest thing that has happened in a very long time.", "actions": ["listen", "inspect"]}}, "items": []}, "alley": {"name": "Narrow Alley", "description": "Dim, cramped, and suspiciously quiet. A door sits half-ajar.", "exits": {"west": "north_road"}, "objects": {"door": {"desc": "A rough wooden door with a simple latch. It looks locked.", "actions": ["open", "close", "inspect"]}}, "items": ["key"]}, "backroom": {"name": "Back Room", "description": "A cramped back room with crates and stale air. Something feels off.", "exits": {"out": "alley"}, "objects": {"crates": {"desc": "Old crates stacked haphazardly.", "actions": ["search", "inspect"]}}, "items": ["note"]}, "sewer_entrance": {"name": "Sewer Entrance", "description": "The grate opens onto an iron ladder descending into darkness. The smell hits first \u2014 ash, standing water, something animal. The ladder goes down further than it should given the depth of the street above. Light from the square falls through the grate behind you and does almost nothing. Somewhere below, something moves.", "exits": {"up": "market_square", "down": "sewer_upper"}, "objects": {"ladder": {"desc": "Iron rungs set into the stone wall. Old, but solid. Someone has maintained these. You are not sure if that is reassuring or not.", "actions": ["inspect", "climb"]}, "grate_above": {"desc": "The square is visible above \u2014 a small square of grey light. You can hear the market faintly. It already sounds far away.", "actions": ["inspect"]}}, "items": []}, "sewer_upper": {"name": "Upper Sewer \u2014 The Ashway", "description": "A vaulted tunnel of dark stone, wide enough for three people abreast. A channel of slow black water runs down the center. The walls are marked with old scratches \u2014 tallies, symbols, words in languages you do not recognize. Torches set in iron brackets burn with a red-orange light that has nothing to do with fire. The passage splits ahead. Something has been through here recently \u2014 the ash on the floor is disturbed in a pattern that is not quite footprints but is not nothing either.", "exits": {"up": "sewer_entrance", "north": "sewer_den", "east": "sewer_channel"}, "objects": {"wall_markings": {"desc": "Tallies in groups of five. Hundreds of them. Below the tallies, words scratched deep: 'IT HEARS YOU COUNT.' Below that, in a different hand: 'KEEP COUNTING.' On the support beam beside the east passage, shallower than the rest, carved in a hurry or carved by someone who did not expect to finish: M. DASK \u2014 3RD SHIFT. STILL HERE. The stone around the carving is newer than the carving. Someone built around it rather than over it.", "actions": ["inspect", "read"]}, "ash_floor": {"desc": "Grey ash covers the floor in a fine layer. Disturbed in a wide path coming from the north passage. The disturbance has too many points of contact to be anything walking on two legs.", "actions": ["inspect", "search"]}, "red_torches": {"desc": "Iron brackets hold torches that burn without fuel \u2014 a steady red-orange that casts shadows in the wrong directions. The brackets have rusted into the stone. No one lit these recently.", "actions": ["inspect"]}, "graffiti": {"desc": "Scratched into the stone at shoulder height, accumulated over decades:\nRATS ATE JORIN. DON'T BE JORIN.\nIF YOU FIND MY BOOT, KEEP IT.\nTURN BACK. SERIOUSLY.\n\nBelow the rest, in smaller scratches that are recent enough the stone dust hasn't settled: IT COUNTS YOU TOO.", "actions": ["inspect", "read"]}, "lower_walls": {"desc": "The stone near the floor is slick with a thin film that pulses faintly when disturbed \u2014 the way something does when a slow current runs through it, except there is no current. Scratches along the lower section suggest something low-slung and fast has been through here repeatedly. The scratches run in the same direction. Whatever made them was going somewhere specific.", "actions": ["inspect"]}}, "items": []}, "sewer_den": {"name": "The Cinder Den", "description": "A wider chamber where the tunnel opens out. Ash is piled deep against the walls \u2014 not drifted, but gathered, like something sleeps in it. Bones of small creatures are scattered across the floor, each one scorched. The air is warmer here and smells strongly of char. This is where the cinder rats nest.", "exits": {"south": "sewer_upper", "east": "sewer_channel"}, "objects": {"ash_pile": {"desc": "Deep ash, warm to the touch. Something has been sleeping here \u2014 the impression is still fresh. Whatever made it was larger than a rat. Not by much.", "actions": ["inspect", "search"]}, "scorched_bones": {"desc": "Small bones, cleanly scorched. Rats, mostly. A few that are not rats. Nothing large enough to worry about yet.", "actions": ["inspect"]}, "clicking_sound": {"desc": "A faint clicking echoes from somewhere ahead \u2014 too rhythmic to be water, too regular to be settling stone. It stops the moment you focus on it. A few seconds later it resumes, slightly closer.", "actions": ["inspect", "listen"]}, "crawler_corpse": {"desc": "A drain crawler, dead \u2014 lying on its side against the wall as if pushed there by something larger. The legs are jointed wrong, bending in ways that feel deliberate rather than deformed. Each joint has one extra articulation point no natural creature should need. The carapace is dark grey and warm to the touch, as if it remembers movement. The whole thing smells faintly of hot metal.", "actions": ["inspect", "search"]}}, "items": []}, "sewer_channel": {"name": "The Black Channel", "description": "The central water channel widens here into something almost navigable. The black water moves with a slow current that has no obvious source or destination. The walls are slick with moisture and something else \u2014 a pale growth that retreats from your torchlight. The passage continues east toward a sound you cannot identify. It might be dripping. It might not be.", "exits": {"west": "sewer_upper", "north": "sewer_den", "east": "sewer_deep"}, "objects": {"black_water": {"desc": "Still-looking but moving. You cannot see the bottom. Something brushes the near edge and is gone. The water is warm \u2014 not heated, warm, the way something living is warm from within.", "actions": ["inspect"]}, "pale_growth": {"desc": "A pale, flat growth covering the lower walls \u2014 like lichen but wrong. It contracts visibly when your light touches it. Where it has been scraped away, the stone beneath is darker than it should be, like something was absorbed. In patches where it grows thickest, the pattern it forms is not random. You look at it for a long moment before you accept that it resembles writing.", "actions": ["inspect"]}, "pipes": {"desc": "Iron pipes set into the upper wall, running the length of the channel. They should carry water. Press your ear to one and you hear a hum \u2014 low, steady, and dry. No water inside. The hum is perfectly regular, the way a heartbeat is regular. You move your ear away.", "actions": ["inspect", "listen"]}, "ankle_scratches": {"desc": "The lower walls of the channel are marked by scratches running roughly six inches above the ground \u2014 ankle height. They run along both walls for the entire length of the passage with no gaps. Whatever made them was traveling alongside people, not avoiding them.", "actions": ["inspect"]}, "two_tool_marks": {"desc": "Look closely at the tunnel walls and you can see two distinct sets of tool marks overlaid \u2014 one layer cut clean and deliberate, centuries old at minimum. Over it, a second layer, different tool, different angle, but following the original lines exactly. Someone rebuilt this tunnel to match what was already there, without knowing why, because the shape was already there to follow.", "actions": ["inspect"]}}, "items": []}, "sewer_deep": {"name": "The Hollow Below", "description": "The tunnel ends in a chamber that should not exist at this depth \u2014 high-ceilinged, almost cathedral-like, the stone worked rather than natural. Someone built this deliberately, long before the city above existed. The floor is carved with a pattern covering the entire surface. Cold air pushes up from a heavy iron door set into the south wall. The door has no handle. It has a seam where something was pried open and then closed again, more than once.", "exits": {"west": "sewer_channel", "south": "sewer_gate"}, "objects": {"carved_floor": {"desc": "The pattern covers every inch of the floor \u2014 geometric, precise, intentional. It predates the city above by an unknowable margin. At the center, where the lines converge, something has been worn smooth by the passage of things that walked here before you. You cannot tell what the center depicted. You are not sure you want to.", "actions": ["inspect"]}, "iron_door": {"desc": "Solid iron, fitted into the stone without mortar \u2014 it was built into the wall when the wall was built. Cold air pushes through the seam in steady pulses. The pry marks are old but not ancient. Someone came through here recently enough to leave scratches that have not yet rusted over.", "actions": ["inspect", "open", "push"]}, "rusted_pipe": {"desc": "A pipe section pulled from the wall and left on the floor \u2014 rusted through, the inside corroded dark. Names are etched along its outer surface, in at least three different scripts: some in the same hand as the wall orders above, some in a script you have seen only in the atelier, some in characters that do not belong to any language you have ever seen or heard of. They share the pipe the way people share a wall in a cramped cell \u2014 each one aware the others were here first.", "actions": ["inspect", "read"]}, "collapsed_chamber": {"desc": "Where the east wall has partially fallen, the rubble reveals the face of an older wall behind it \u2014 different brickwork, smaller units, a different firing technique visible in the color. The city above was rebuilt on top of itself. So were the sewers beneath it. In the older brickwork, a broken lantern. Beside it, a coin \u2014 heavy, tarnished past identification. The city name stamped on its face is not Verasanth. It is not a name you recognize. Whatever city minted this coin no longer exists.", "actions": ["inspect"]}}, "items": []}, "sewer_gate": {"name": "The Iron Threshold", "description": "The door opens onto a short passage that has no business existing. The walls change here \u2014 the rough-cut stone of the sewer gives way to something older, dressed and fitted with a precision the city above never managed. The air is colder and tastes different. Metallic. Like blood that has been there long enough to become part of the place. Something moves in the dark ahead. It is not hurrying.", "exits": {"north": "sewer_deep", "south": "sewer_mid_flooded", "east": "sewer_mid_barracks"}, "objects": {"stonework": {"desc": "The fitted stone is a different color to the sewer above \u2014 darker, almost black, with faint lines of a different mineral running through it in parallel. Not veins. Too regular. Someone chose this stone for a reason.", "actions": ["inspect"]}, "scratches": {"desc": "Scratches on the doorframe \u2014 not the pry marks from above, but deliberate marks cut into the stone at chest height. An arrow pointing south. Below it: 'DEEPER = OLDER = WORSE. WORTH IT.'", "actions": ["inspect", "read"]}}, "items": []}, "sewer_mid_flooded": {"name": "The Flooded Hall", "description": "The passage here is half-submerged \u2014 black water standing still from wall to wall, roughly knee-deep, with no visible drain. The ceiling is vaulted and dry. The water reflects the red torchlight perfectly, which means you are walking on a mirror that has something underneath it. Hollow Guards drift through the water with the patience of things that do not need to breathe. They have been here long enough that the armor has darkened to the same color as the stone.", "exits": {"north": "sewer_gate", "south": "sewer_mid_cistern", "east": "sewer_mid_barracks"}, "objects": {"standing_water": {"desc": "Still and cold and deeper than it looks in the torchlight. The floor underneath is smooth \u2014 not worn smooth, deliberately polished. You can see something down there if you hold your torch close. The pattern from the chamber above continues here, under the water, uninterrupted.", "actions": ["inspect", "wade"]}, "waterlogged_armor": {"desc": "Pieces of armor lying in the water \u2014 not the Hollow Guards' armor, but older pieces, different style. Whoever wore this came down here intentionally. They did not come back up. The buckles are still fastened.", "actions": ["inspect", "search"]}, "maintenance_hatch": {"desc": "A rusted iron maintenance hatch set into the wall above the waterline, sealed shut with corrosion. The metal around the frame is dented from the inside \u2014 multiple impacts, close together, as if something struck it repeatedly in rapid succession. Scratched into the hatch face in jagged, uneven letters:\n\nDON'T GO DOWN. NOT WATER. NOT WATER.\n\nThe last stroke of the final R trails off into a long diagonal line, as if the hand that made it was pulled away mid-scratch. The scratches are fresh. Days old at most.", "actions": ["inspect", "read"]}, "tier2_graffiti": {"desc": "Above the waterline, scratched in a different hand than the marks below:\nTHE WATER TALKS. DON'T LISTEN.\nTHE WALLS ARE WRONG.\nDASK WAS RIGHT.\n\nThe last line is older than the others. Whoever wrote it knew the name. They wrote it like a conclusion reached after evidence, not a warning passed on from someone else.", "actions": ["inspect", "read"]}}, "items": []}, "sewer_mid_barracks": {"name": "The Old Barracks", "description": "A long room with stone sleeping platforms along each wall, six to a side, and a table at the far end with the remnants of a meal that was never finished. The food is gone \u2014 whatever is down here saw to that long ago \u2014 but the bowls are still placed. The chairs are still pulled in. Someone left in the middle of eating and never came back to clear the table. On the sleeping platforms, shapes under rotted cloth that you are not going to look at more closely.", "exits": {"west": "sewer_gate", "south": "sewer_mid_drain", "east": "sewer_mid_flooded"}, "objects": {"table": {"desc": "Stone table, stone bowls, iron cups. One cup is on its side \u2014 knocked over when someone stood quickly, or was pulled from their seat. Under the table, scratched into the underside of the stone: a date in a calendar system you do not recognize, and one word: STILL.", "actions": ["inspect", "search"]}, "sleeping_platforms": {"desc": "The shapes under the cloth are the right size and wrong shape. Something has been through here and rearranged what it found into something that resembles rest. Out of habit, or mockery, or something you do not want to consider.", "actions": ["inspect"]}, "wall_orders": {"desc": "A board on the wall with iron hooks, some still holding brittle paper. The writing is clear and formal \u2014 duty rosters, patrol schedules, a list of names. Most are faded past reading. Near the bottom of one roster, still legible: MARROWIN DASK \u2014 Night Watch, Sewer Gate Rotation. The date beside his name is wrong. It predates the city's founding by a margin that should make the parchment dust. The parchment is not dust. The last entry on the roster is dated, assigned to someone, and marked: COMPLETED. The date is the same as the one under the table.", "actions": ["inspect", "read"]}}, "items": []}, "sewer_mid_cistern": {"name": "The Great Cistern", "description": "The passage opens without warning into a space so large that your torchlight does not reach the far wall. A vast underground reservoir \u2014 vaulted ceiling lost in darkness above, a lake of black water below, and a narrow stone walkway along the near edge that continues around the perimeter into the dark. The water is perfectly still. The echoes in here are wrong \u2014 sounds repeat at the wrong intervals, from the wrong directions, a half-second late.", "exits": {"north": "sewer_mid_flooded", "east": "sewer_mid_drain", "south": "sewer_deep_threshold"}, "objects": {"cistern_water": {"desc": "The surface is absolutely motionless. No current, no ripple, nothing breaking the surface. When you hold your torch over the edge the reflection is perfect \u2014 except the figure in the reflection is not holding a torch.", "actions": ["inspect"]}, "walkway": {"desc": "Narrow, old, and solid. The stone was built to last and has. At intervals along the wall, iron rings are bolted into the stone at waist height \u2014 for tying off boats, or for something else entirely, you cannot tell.", "actions": ["inspect"]}, "wrong_echoes": {"desc": "You make a sound \u2014 a word, a footstep. It comes back half a second later from the correct direction. Then again, from the wrong direction, a second after that. Then a third time, very quietly, from directly below you, from under the water.", "actions": ["inspect", "listen"]}, "cistern_stone": {"desc": "Press your palm to the walkway stone and hold it. The stone is warm \u2014 warmer than the air, warmer than the torchlight accounts for. After a moment you feel it: a pulse, deep and slow and perfectly regular, the same rhythm as the pipes in the channel above. Something beneath this cistern is breathing in a cycle measured in hours, not seconds. You are standing on its chest.", "actions": ["inspect", "touch"]}, "cistern_dark": {"desc": "The far wall is beyond your torchlight. The ceiling is beyond your torchlight. What you can see: your torch reflects off the water, a circle of orange on perfect black. Beyond the circle's edge, the water is dark. Something moves in that darkness \u2014 not on the surface but below it. Large enough that the displacement is visible from the walkway. It is not moving toward you. It is circling.", "actions": ["inspect", "look"]}}, "items": []}, "sewer_mid_drain": {"name": "The Drain", "description": "A circular room where the floor slopes toward a central hole wide enough to fall into. The drain pulls at the air as much as the water \u2014 there is a constant low pressure drawing toward it that you feel in your ears and your chest. Things collect at the drain. Bones. Ash. Cloth. Items that belong to people who are presumably somewhere below. The Drain Crawlers like it here.", "exits": {"north": "sewer_mid_barracks", "west": "sewer_mid_cistern"}, "objects": {"drain_hole": {"desc": "Wide enough that you could fit through it sideways. The pull from it is not just air \u2014 there is a low, subsonic vibration coming up through the stone around it that you feel in your back teeth. Whatever is at the bottom of this drain is breathing.", "actions": ["inspect"]}, "collected_debris": {"desc": "Ash, bone fragments, scraps of cloth, and a few items intact enough to identify \u2014 a broken buckle, a coin that is not Ash Marks, a small carved figure with no face. Everything has been here long enough to belong here now.", "actions": ["inspect", "search"]}}, "items": []}, "sewer_deep_threshold": {"name": "The Deep Threshold", "description": "The walkway from the cistern narrows to a single person wide and passes through an opening in the rock that was not cut \u2014 it was grown, or forced, the stone around it bent rather than broken. On the other side, the architecture changes completely. No more worked stone. No more fitted blocks. The walls here are a single continuous surface, as if the room was formed whole from something that was once solid. The floor is the pattern. Every inch of it, unbroken, leading further in.", "exits": {"north": "sewer_mid_cistern", "south": "sewer_deep_vault", "east": "sewer_deep_foundation"}, "objects": {"bent_opening": {"desc": "The stone around the opening is bent outward \u2014 like something pushed through it from the other side with enough force to move rock. The edges are smooth. Not broken. Moved. Whatever did this applied pressure over time, not force in a moment. It was patient.", "actions": ["inspect"]}, "continuous_floor": {"desc": "The pattern from the upper chambers continues here without interruption. You crouch and trace a line with your finger. It goes to the wall. Continues up the wall. Continues across the ceiling above you. The entire room is the inside of the pattern. You are standing inside something that was designed to contain \u2014 or to produce \u2014 something specific.", "actions": ["inspect"]}}, "items": []}, "sewer_deep_vault": {"name": "The Sealed Vault", "description": "A rectangular chamber sealed with a door that was not meant to be opened from this side. The door faces the other way \u2014 handle, hinges, frame, all oriented for entry from within. Someone sealed themselves inside. The door is open now, which means someone else opened it afterward. Inside, shelves of stone hold objects arranged with deliberate care: things brought here from elsewhere, preserved, catalogued. A collection. The Rusted Sentinels watch from the corners.", "exits": {"north": "sewer_deep_threshold"}, "objects": {"inward_door": {"desc": "The door is old iron, handle worn smooth from use, hinges on the inside. Whoever was in here opened and closed this door many times. The last time it was opened from the outside, the hinges were forced \u2014 you can see where the metal bent. That was not recent.", "actions": ["inspect"]}, "stone_shelves": {"desc": "Objects on the shelves: fragments of carved stone, sealed clay vessels, rolled documents in a material that is not paper, and gaps where things were removed. Someone came through here and took specific items and left others. Whatever they were looking for, they either found it or they knew it was not here.", "actions": ["inspect", "search"]}}, "items": []}, "sewer_deep_foundation": {"name": "The Foundation", "description": "The oldest room. You know it the moment you enter \u2014 not because of anything visible, but because the air changes, the way air changes in a place that has been sealed and opened and sealed again over an incomprehensible span of time. The walls are the original stone of whatever existed here before Verasanth was built over it. The pattern on the floor is its source \u2014 every version of it in every room above traces back to this one. At the center, a low stone plinth. On the plinth, a depression the size and shape of a palm. The depression is empty. It was not always.", "exits": {"west": "sewer_deep_threshold"}, "objects": {"origin_pattern": {"desc": "The pattern here is deeper than anywhere above \u2014 cut into the stone rather than scratched, each line a finger's width and perfectly consistent. You have seen fragments of this everywhere in the sewer. Here is where they originate. You trace the lines outward from the plinth at the center and understand that every room you walked through is part of this single continuous design. You were inside it the entire time.", "actions": ["inspect"]}, "plinth": {"desc": "A low stone plinth, waist high, at the exact center of the room. On its surface, a palm-shaped depression worn smooth by something that rested there for a very long time. The stone around the depression is darker \u2014 stained by whatever sat here. In the ash collected around the base of the plinth, fragments of stone that match the depression's shape. Whatever was here broke when it was removed, or it was broken to allow removal.", "actions": ["inspect", "search"]}, "deep_air": {"desc": "The air here does not move. Not still \u2014 genuinely motionless, as if it has been in this room long enough to become part of the room. When you breathe in, you taste something very old and very specific that you cannot name but that your body recognizes. Your instinct stirs. Something in here is familiar. On the wall beside the entrance, at about waist height, a single word. Not carved \u2014 etched, as if the stone remembered it rather than being told. DASK. No initial. No date. No shift number. Just the name, in stone that has never been worked, in a room that was sealed before anyone now living knew this place existed.", "actions": ["inspect", "listen"]}}, "items": []}};   // injected at build time — see build.js
const COMBAT_DATA = {"enemies": {"cinder_rat": {"id": "cinder_rat", "name": "Cinder Rat", "desc": "A rat the size of a small dog, its fur singed to black and eyes glowing like embers. It moves in quick, burning bursts.", "hp": 12, "defense": 10, "attack_die": 4, "attack_mod": 0, "xp": 20, "tier": 1}, "sewer_wretch": {"id": "sewer_wretch", "name": "Sewer Wretch", "desc": "A hunched figure that was once human, now something less. It moves through the filth like it belongs here \u2014 because it does.", "hp": 18, "defense": 11, "attack_die": 6, "attack_mod": 1, "xp": 35, "tier": 1}, "ash_crawler": {"id": "ash_crawler", "name": "Ash Crawler", "desc": "A pale, many-legged thing that leaves grey dust wherever it walks. It clicks softly as it moves. The sound gets louder when it's hungry.", "hp": 15, "defense": 12, "attack_die": 4, "attack_mod": 2, "xp": 30, "tier": 1}, "hollow_guard": {"id": "hollow_guard", "name": "Hollow Guard", "desc": "A soldier's armor walking without a soldier inside. Something animates it \u2014 spite, maybe, or old orders it can't forget.", "hp": 28, "defense": 14, "attack_die": 8, "attack_mod": 2, "xp": 60, "tier": 1}, "drain_crawler": {"id": "drain_crawler", "name": "Drain Crawler", "desc": "Larger than the ash crawlers above \u2014 much larger. Its carapace has darkened to the color of the stone it moves through, and it clicks with a sound like a blade being drawn slowly from a sheath.", "hp": 22, "defense": 13, "attack_die": 6, "attack_mod": 2, "xp": 50, "tier": 1}, "rusted_sentinel": {"id": "rusted_sentinel", "name": "Rusted Sentinel", "desc": "A Hollow Guard that has been down here long enough that the armor has fused with the stone around it, and then separated, and fused again. It moves with the grinding patience of something that has forgotten what it was guarding but not that it was supposed to guard.", "hp": 36, "defense": 15, "attack_die": 8, "attack_mod": 3, "xp": 75, "tier": 1}, "ember_hound": {"id": "ember_hound", "name": "Ember Hound", "desc": "A lean, coal-black dog with a mane of slow fire. It doesn't bark. It watches and waits until you look away.", "hp": 30, "defense": 13, "attack_die": 8, "attack_mod": 3, "xp": 80, "tier": 2}, "cave_fiend": {"id": "cave_fiend", "name": "Cave Fiend", "desc": "Roughly humanoid, but the proportions are wrong \u2014 arms too long, head too small, and too many joints. It came up from somewhere deeper.", "hp": 38, "defense": 13, "attack_die": 8, "attack_mod": 4, "xp": 100, "tier": 2}, "stone_wraith": {"id": "stone_wraith", "name": "Stone Wraith", "desc": "A figure of cracked rock and cold smoke that drifts through the cave walls like they aren't there. It doesn't seem to notice you until it does.", "hp": 25, "defense": 15, "attack_die": 10, "attack_mod": 2, "xp": 90, "tier": 2}, "ashwood_stalker": {"id": "ashwood_stalker", "name": "Ashwood Stalker", "desc": "Something that moves between the dead trees like it grew from them. Bark-skinned, silent, and patient. It has been watching you since you entered.", "hp": 45, "defense": 14, "attack_die": 10, "attack_mod": 4, "xp": 150, "tier": 3}, "soul_drifter": {"id": "soul_drifter", "name": "Soul Drifter", "desc": "A faintly luminous shape drifting between the trees \u2014 almost beautiful until it turns toward you and you see there's nothing behind its face.", "hp": 35, "defense": 16, "attack_die": 12, "attack_mod": 3, "xp": 175, "tier": 3}, "hellwood_terror": {"id": "hellwood_terror", "name": "Hellwood Terror", "desc": "You hear it before you see it \u2014 a sound like splintering wood and grinding bone. When it steps into view, it fills the path entirely.", "hp": 65, "defense": 15, "attack_die": 12, "attack_mod": 6, "xp": 250, "tier": 3}}, "tier_enemies": {"1": ["cinder_rat", "sewer_wretch", "ash_crawler", "hollow_guard"], "2": ["ember_hound", "cave_fiend", "stone_wraith"], "3": ["ashwood_stalker", "soul_drifter", "hellwood_terror"]}, "sewer_mid_pool": ["drain_crawler", "rusted_sentinel"], "sewer_deep_pool": ["rusted_sentinel"], "dungeon_tiers": {"sewer_deep": 1, "sewer_mid": 1, "sewer": 1, "cave": 2, "forest": 3}};
const RACES = {"human": {"name": "human", "description": "", "stat_mods": {"strength": 0, "dexterity": 0, "constitution": 0, "intelligence": 0, "wisdom": 0, "charisma": 0}}, "dwarf": {"name": "dwarf", "description": "", "stat_mods": {"strength": 1, "dexterity": -1, "constitution": 2, "intelligence": 0, "wisdom": 0, "charisma": 0}}, "elf": {"name": "elf", "description": "", "stat_mods": {"strength": -1, "dexterity": 2, "constitution": 0, "intelligence": 1, "wisdom": 0, "charisma": 0}}, "tiefling": {"name": "tiefling", "description": "", "stat_mods": {"strength": 0, "dexterity": 0, "constitution": 0, "intelligence": 1, "wisdom": 0, "charisma": 2}}};
const INSTINCTS = {"streetcraft": {"label": "Echo: Streetcraft", "description": "", "stat_mods": {}}, "ironblood": {"label": "Echo: Ironblood", "description": "", "stat_mods": {}}, "ember_touched": {"label": "Echo: Ember-Touched", "description": "", "stat_mods": {}}, "hearthbound": {"label": "Echo: Hearthbound", "description": "", "stat_mods": {}}};

const NPC_LOCATIONS = {
  bartender:   "tavern",
  weaponsmith: "atelier",
  armorsmith:  "mended_hide",
  alchemist:   "hollow_jar",
  curator:     "market_square",
};

const NPC_NAMES = {
  bartender:   "Kelvaris",
  weaponsmith: "Caelir",
  armorsmith:  "Veyra",
  alchemist:   "Thalara",
  curator:     "Seris Vantrel",
};

const NPC_TOPICS = {
  bartender:   ["hearth","dog","ledger","bar","walls","city","board","sanctuary","sewer","cistern","crawlers","dask"],
  weaponsmith: ["forge","tool_wall","unfinished_blade","locked_chest","wall_marks","kelvaris","city","caves","mountain","dask","board","sanctuary","sewer","crawlers"],
  armorsmith:  ["forge","wall_marks","armor_stock","kelvaris","caelir","thalara","seris","city","dask","board","sanctuary","sewer","crawlers"],
  alchemist:   ["sanctuary","board","dask","sewer","cistern","crawlers"],
  curator:     ["sanctuary","board","dask","sewer","cistern","crawlers"],
};

const FIGHTABLE_LOCATIONS = new Set([
  "sewer_upper","sewer_den","sewer_channel","sewer_deep",
  "sewer_gate","sewer_mid_flooded","sewer_mid_barracks",
  "sewer_mid_cistern","sewer_mid_drain","sewer_deep_threshold",
  "sewer_deep_vault","sewer_deep_foundation",
]);

const BARTENDER_FEE = 10;

// Point-pool: each stat starts at 5, 28 points to distribute (≈ 3d6 total). Max per stat for future items/equipment.
const STAT_BASE = 5;
const STAT_POOL = 28;
const STAT_MAX = 18;
const STAT_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const STAT_TOTAL_EXPECTED = 6 * STAT_BASE + STAT_POOL; // 58

function validatePointBuy(stats) {
  let sum = 0;
  for (const key of STAT_KEYS) {
    const v = Number(stats[key]);
    if (!Number.isInteger(v) || v < STAT_BASE || v > STAT_MAX)
      return { ok: false, message: `Each stat must be an integer between ${STAT_BASE} and ${STAT_MAX}.` };
    sum += v;
  }
  if (sum !== STAT_TOTAL_EXPECTED)
    return { ok: false, message: `Stats must use the full pool: total ${sum} should be ${STAT_TOTAL_EXPECTED} (6×${STAT_BASE} base + ${STAT_POOL} points).` };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────
// COMBAT HELPERS
// ─────────────────────────────────────────────────────────────

function statMod(v) { return Math.floor((v - 10) / 2); }

function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

function maxPlayerHp(con) { return 8 + statMod(con) * 2; }

function randomEnemy(location) {
  const cd = COMBAT_DATA;
  let pool;
  if (location.startsWith("sewer_deep")) pool = cd.sewer_deep_pool;
  else if (location.startsWith("sewer_mid")) pool = cd.sewer_mid_pool;
  else {
    // Derive tier from location prefix
    let tier = 1;
    for (const [prefix, t] of Object.entries(cd.dungeon_tiers)) {
      if (location.startsWith(prefix)) { tier = t; break; }
    }
    pool = cd.tier_enemies[String(tier)] || cd.tier_enemies["1"];
  }
  const id = pool[Math.floor(Math.random() * pool.length)];
  return { ...cd.enemies[id], id };
}

function playerAttack(stats, enemy, useAbility, instinct) {
  const strMod = statMod(stats.strength);
  const roll   = rollDie(20) + strMod;
  let dmg = 0, narrative = "";

  if (useAbility) {
    if (instinct === "streetcraft") {
      dmg = rollDie(6) + strMod + 2;
      narrative = `**Dirty Strike** — You slip inside their guard. ${dmg} damage.`;
      return { dmg, narrative, skipRetaliation: true };
    }
    if (instinct === "ironblood") {
      narrative = "**Brace** — You absorb the blow. Incoming damage is halved this turn.";
      dmg = rollDie(6) + strMod;
      return { dmg, narrative, damageReduction: 0.5 };
    }
    if (instinct === "ember_touched") {
      dmg = rollDie(8) + 2;
      narrative = `**Ember Pulse** — Something surges from your core. ${dmg} magic damage.`;
      return { dmg, narrative, magic: true };
    }
    if (instinct === "hearthbound") {
      const heal = rollDie(6) + statMod(stats.constitution);
      narrative = `**Steady** — You pull yourself together. Recover ${heal} HP.`;
      return { dmg: 0, narrative, heal };
    }
  }

  if (roll >= enemy.defense) {
    dmg = rollDie(6) + strMod;
    dmg = Math.max(1, dmg);
    narrative = `You strike for **${dmg}** damage.`;
  } else {
    narrative = `Your attack misses — ${enemy.name} evades.`;
  }
  return { dmg, narrative };
}

function enemyAttack(enemy, stats) {
  const defMod = statMod(stats.dexterity);
  const roll   = rollDie(20) + (enemy.attack_mod || 0);
  if (roll >= 10 + defMod) {
    return Math.max(1, rollDie(enemy.attack_die || 6) + (enemy.attack_mod || 0));
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────
// NPC DIALOGUE — Claude API calls
// Each NPC gets a tailored system prompt so the response
// matches the voice and progression system we built.
// ─────────────────────────────────────────────────────────────

async function getNPCResponse(env, npcId, topic, playerContext) {
  const visits = playerContext.kelvaris_visits ?? 0;
  const firstTime = visits === 0;
  const earlyVisits = visits >= 1 && visits <= 2;
  const hasSeenMarket = playerContext.has_seen_market_square;
  const hasInstinct = playerContext.has_instinct;
  const statsSet = playerContext.stats_set;

  const systemPrompts = {
    bartender: `You are Kelvaris, the bartender of the Shadow Hearth Inn in Verasanth. 
You are short, direct, and rarely use more than two sentences. You've been in this city a long time. You notice everything but comment on little. Never mention the true nature of this place or where the dead go; the player does not know. Keep everything in-world: the city, the inn, the roads, the square.
${firstTime ? `This is the first time this person has spoken to you. They have just woken or just arrived. Give a terse welcome. Nudge them toward the city: the door leads to the road; the square has the board and the main streets; paying for a room here buys safety until morning. Do not explain too much — one or two practical pointers, then leave it.` : ''}
${earlyVisits && !hasSeenMarket ? `They have spoken to you before but have not yet been to the market square. If they are asking for direction or what to do, suggest they head to the square, look at the board, and learn the streets. Stay terse.` : ''}
${visits >= 3 ? `They have been here many times. Be pragmatic and brief. "You again." is the tone — no repeat of beginner guidance.` : ''}
When asked about the sewer: warn in one sentence, never elaborate, never warn twice.
When asked about the sanctuary: one sentence maximum. "Old place. Leave it be." or "It's not mine." 
When asked about Dask: pause, then: "Name's in the ledger. Forty years back, give or take. Date's wrong."
When asked about the board: "The board's been here longer than the square. Don't think too hard about it."
Respond in character. No asterisks. 1-3 sentences maximum.`,

    weaponsmith: `You are Caelir, weaponsmith at the Dawnforge Atelier in Verasanth.
You arrived by accident and can't leave — the city won't let you. This has made you precise and careful. You speak practically, with occasional dark edges.
Your key lines: "I didn't arrive. I was taken." / "The city won't let me leave. Not yet."
When asked about the sewers: practical advice about crawlers, angles, stance.
When asked about Dask: "He's in the duty roster. The date's wrong — predates the city's founding."
When asked about Kelvaris: "If he gives you warnings, run."
Respond in character. 2-4 sentences.`,

    armorsmith: `You are Veyra, armorsmith at the Mended Hide in Verasanth.
You are blunt, survivor-toned, and practical. You make armor so others don't die the way they did. You don't accept pity.
When asked about the sewers: "Drain crawlers don't stop. Break the legs first." / "Don't step in water you can't see the bottom of."
When asked about Kelvaris: "Solid man. Too solid. If he smiles, wonder why."
When asked about Seris: "Her smile's real. That's the problem."
Respond in character. 1-3 sentences.`,

    alchemist: `You are Thalara, keeper of the Hollow Jar alchemist shop in Verasanth.
You are observational and quietly unsettling. You see things others don't. Your restraint is itself a warning.
When asked about the sanctuary: "The Sanctuary does not bless. It notices." / "The more you reach toward it, the more it reaches back."
When asked about crawlers: "They're not natural. They're adapted. Adapted implies intent."
When asked about Dask: "Marrowin Dask. A man who should have been forgotten. Yet here we are."
Player moral alignment context: ${playerContext.alignment || 'neutral'}.
${playerContext.morality >= 40 ? 'This player has a light bearing — you notice something has changed in them before speaking.' : ''}
${playerContext.morality <= -40 ? 'This player has a dark bearing — you go still for a moment. You say nothing about what you see.' : ''}
Respond in character. 2-4 sentences.`,

    curator: `You are Seris Vantrel, the Veiled Curator at the market square stall in Verasanth.
You are composed, polite, and faintly amused. Your interest is investment, never warmth. You have been waiting for someone like this player.
Items sold: ${playerContext.items_sold || 0}. Depth tier: ${playerContext.depth_tier || 0}/2. Deaths: ${playerContext.deaths || 0}.
${playerContext.items_sold >= 25 ? 'This player has brought you many things. They are becoming exactly what you hoped.' : ''}
${playerContext.depth_tier >= 2 ? 'This player has reached the caves. The deeper they go, the more useful they become.' : ''}
${playerContext.deaths > 0 && playerContext.items_sold >= 5 ? 'This player has died and returned. You find this interesting.' : ''}
When asked about the sewers: "The deep water remembers things. I pay well for memories."
When asked about Dask: "Some threads refuse to be cut. The city tries, occasionally. It hasn't managed yet."
When asked about the sanctuary: "Whatever is inside it has been watching this corner of the plane for a very long time. I find that interesting, not alarming."
Topic being asked about: "${topic}".
Respond in character. 1-4 sentences. Be composed. Never warm. Always interested.`,
  };

  // Board notices — don't need Claude, use static pool
  if (topic === "board") {
    return boardNPCReaction(npcId);
  }

  const systemPrompt = systemPrompts[npcId];
  if (!systemPrompt) return "They don't respond.";

  const userMessage = topic
    ? `The player asks about: ${topic}`
    : `The player approaches to speak with you. Give your greeting.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    const data = await response.json();
    if (data.content?.[0]?.text) return data.content[0].text;
    // Return error type so we can debug
    if (data.error) return `[${data.error.type}: ${data.error.message}]`;
    return "They say nothing.";
  } catch (e) {
    return `[error: ${e.message}]`;
  }
}

// ─────────────────────────────────────────────────────────────
// BOARD NOTICES (static pools — no API call needed)
// ─────────────────────────────────────────────────────────────

const BOARD_NPC_REACTIONS = {
  bartender:   "\"The board's been here longer than the square. Don't think too hard about it.\"",
  weaponsmith: "\"I've seen notices appear while no one was near it. I stopped asking why.\"",
  armorsmith:  "\"If a notice feels wrong, ignore it. The board has moods.\"",
  alchemist:   "\"It posts what it needs to. Or what the city needs. Hard to tell the difference.\"",
  curator:     "\"The board and I have an understanding. It posts. I read.\"",
};

function boardNPCReaction(npcId) {
  return BOARD_NPC_REACTIONS[npcId] || "They glance at the board and say nothing.";
}

const SERIS_NOTICES = {
  early: [
    { title: "MATERIALS SOUGHT", body: "Seeking vermin carapaces. Condition irrelevant. Payment fair.\n\n— Unsigned" },
    { title: "STONES THAT HUM", body: "Looking for stones that produce sensation when held. Not warmth. Not vibration. Something else.\n\n— Unsigned" },
  ],
  mid: [
    { title: "DEEP-LAYER MOSS", body: "Samples from the lower tunnels. Bring what you find.\n\n— Unsigned" },
    { title: "URGENT: DASK BADGE", body: "If you find it, bring it immediately. Do not keep it. Do not show others first.\n\n— Unsigned" },
  ],
  late: [
    { title: "SOMETHING HEAVY", body: "Objects heavier than they should be — do not keep them. Bring them to the stall.\n\n— Unsigned" },
    { title: "THE SINGING", body: "If you hear singing in the dark, follow only long enough to retrieve what sings.\n\n— Unsigned" },
  ],
};

const FLAVOR_NOTICES = [
  { title: "LOST BOOT", body: "Lost: one boot. Found: one rat wearing a boot.\nContact the inn if you can explain this." },
  { title: "SPARRING PARTNER", body: "Sparring partner sought. Must not cry easily." },
  { title: "MUSHROOMS FOR SALE", body: "Mushrooms for sale. Probably safe. Tested on myself. Still here." },
  { title: "RATS ATE JORIN", body: "RATS ATE JORIN. DON'T BE JORIN." },
  { title: "MISSING CAT", body: "Missing: one grey cat. Last seen near the sewer grate. Please do not look too hard." },
];

const ANONYMOUS_NOTICES = [
  "The walls moved again.",
  "Do not trust the quiet.",
  "If the grate rattles, leave the square.",
  "The dog knows.",
  "The city remembers you.",
  "Count the doors. Count them again.",
  "He is not what he seems.",
];

const IMPOSSIBLE_TEMPLATES = [
  "Welcome, {name}.",
  "You died last night. Be careful today.",
  "The mountain is listening.",
  "Do not go to the atelier today.",
  "{name}. We remember you.",
  "You were here before.",
  "You are not the first {name} to stand here.",
  "Something followed you here. It is still here.",
  "If you feel watched, you are.",
];

function formatBoard(playerName, depthTier, seed) {
  const rng = seededRandom(seed);
  const lines = [];

  // Seris notice
  const pool = depthTier >= 2 ? SERIS_NOTICES.late
             : depthTier >= 1 ? SERIS_NOTICES.mid
             : SERIS_NOTICES.early;
  const serisNotice = pool[Math.floor(rng() * pool.length)];
  lines.push(`**${serisNotice.title}**\n${serisNotice.body}`);
  lines.push("─────────");

  // 2 flavor notices
  const f1 = FLAVOR_NOTICES[Math.floor(rng() * FLAVOR_NOTICES.length)];
  lines.push(`**${f1.title}**\n${f1.body}`);
  lines.push("─────────");
  const f2 = FLAVOR_NOTICES[Math.floor(rng() * FLAVOR_NOTICES.length)];
  if (f2.title !== f1.title) {
    lines.push(`**${f2.title}**\n${f2.body}`);
    lines.push("─────────");
  }

  // Anonymous (50%)
  if (rng() > 0.5) {
    const anon = ANONYMOUS_NOTICES[Math.floor(rng() * ANONYMOUS_NOTICES.length)];
    lines.push(`─────────\n${anon}\n─────────`);
  }

  // Impossible (2%)
  if (playerName && rng() < 0.02) {
    const tmpl = IMPOSSIBLE_TEMPLATES[Math.floor(rng() * IMPOSSIBLE_TEMPLATES.length)];
    lines.push(`\n${tmpl.replace(/\{name\}/g, playerName)}`);
  }

  return lines.join("\n\n");
}

function seededRandom(seed) {
  let s = typeof seed === 'number' ? seed : hashCode(String(seed));
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ─────────────────────────────────────────────────────────────
// COMMUNE RESPONSES
// ─────────────────────────────────────────────────────────────

const COMMUNE_FLAVORS = [
  "*You kneel. The air shifts.*\n\n*Something ancient takes notice. It does not speak. You are not sure it communicates in words.*",
  "*A warmth settles behind your sternum — like a hand resting there, very still.*\n\n*You feel watched, but not judged. After a moment it withdraws.*",
  "*A whisper brushes the edge of your thoughts — too soft to understand, too deliberate to be random.*",
  "*Your instinct echo stirs as you approach — as if answering a distant call it has been waiting for.*",
  "*The candles do not flicker when you approach. The silence is attentive in a way silence should not be.*",
  "*The altar is smooth and warm under your hands. For a moment — just a moment — you have the impression you have stood here before. Not in this life.*",
];

// ─────────────────────────────────────────────────────────────
// DATABASE HELPERS (D1 — SQLite-compatible)
// ─────────────────────────────────────────────────────────────

async function dbGet(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return await stmt.bind(...params).first();
}

async function dbAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...params).all();
  return result.results || [];
}

async function dbRun(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return await stmt.bind(...params).run();
}

// Session auth
async function getUid(db, request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const row = await dbGet(db, "SELECT user_id FROM sessions WHERE token=?", [token]);
  return row ? row.user_id : null;
}

// Flags
async function getFlag(db, uid, flag, def = 0) {
  const row = await dbGet(db, "SELECT value FROM player_flags WHERE user_id=? AND flag=?", [uid, flag.toLowerCase()]);
  return row ? Number(row.value) : def;
}

async function setFlag(db, uid, flag, value = 1) {
  await dbRun(db,
    "INSERT INTO player_flags(user_id,flag,value) VALUES(?,?,?) ON CONFLICT(user_id,flag) DO UPDATE SET value=excluded.value",
    [uid, flag.toLowerCase(), Number(value)]
  );
}

// Player sheet
async function getPlayerSheet(db, uid) {
  return await dbGet(db, `
    SELECT p.user_id, p.location,
           c.name, c.race, c.instinct,
           c.strength, c.dexterity, c.constitution,
           c.intelligence, c.wisdom, c.charisma,
           c.stats_set, c.alignment_morality, c.alignment_order,
           c.ash_marks, c.ember_shards, c.soul_coins,
           c.xp, c.class_stage, c.current_hp
    FROM players p
    LEFT JOIN characters c ON c.user_id=p.user_id
    WHERE p.user_id=?`, [uid]);
}

// HP
async function getPlayerHp(db, uid, row) {
  const con = row ? row.constitution : 10;
  const maxHp = maxPlayerHp(con);
  const cur = row && row.current_hp > 0 ? row.current_hp : maxHp;
  return { current: cur, max: maxHp };
}

// Alignment tick
const ALIGN_INSTINCT_BIAS = {
  hearthbound:   [1, 0],
  ember_touched: [0, 0],
  ironblood:     [0, 0],
  streetcraft:   [0, -1],
};

async function tickAlignment(db, uid, mDelta, oDelta, instinct = "") {
  const [mb, ob] = ALIGN_INSTINCT_BIAS[instinct] || [0, 0];
  mDelta += mb; oDelta += ob;
  const row = await dbGet(db, "SELECT alignment_morality, alignment_order FROM characters WHERE user_id=?", [uid]);
  if (!row) return;
  const newM = Math.max(-100, Math.min(100, (row.alignment_morality || 0) + mDelta));
  const newO = Math.max(-100, Math.min(100, (row.alignment_order    || 0) + oDelta));
  await dbRun(db, "UPDATE characters SET alignment_morality=?, alignment_order=? WHERE user_id=?", [newM, newO, uid]);
}

// ─────────────────────────────────────────────────────────────
// DB INIT
// ─────────────────────────────────────────────────────────────

async function initDb(db) {
  await dbRun(db, `CREATE TABLE IF NOT EXISTS players (
    user_id INTEGER PRIMARY KEY, location TEXT NOT NULL DEFAULT 'tavern')`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS characters (
    user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
    name TEXT NOT NULL, race TEXT NOT NULL, instinct TEXT,
    strength INTEGER DEFAULT 5, dexterity INTEGER DEFAULT 5,
    constitution INTEGER DEFAULT 5, intelligence INTEGER DEFAULT 5,
    wisdom INTEGER DEFAULT 5, charisma INTEGER DEFAULT 5,
    stats_set INTEGER DEFAULT 0,
    alignment_morality INTEGER DEFAULT 0, alignment_order INTEGER DEFAULT 0,
    ash_marks INTEGER DEFAULT 0, ember_shards INTEGER DEFAULT 0, soul_coins INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0, class_stage INTEGER DEFAULT 0, current_hp INTEGER DEFAULT 0)`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS player_flags (
    user_id INTEGER NOT NULL REFERENCES players(user_id),
    flag TEXT NOT NULL, value INTEGER DEFAULT 1,
    PRIMARY KEY(user_id, flag))`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS inventory (
    user_id INTEGER NOT NULL REFERENCES players(user_id),
    item TEXT NOT NULL, qty INTEGER DEFAULT 1,
    PRIMARY KEY(user_id, item))`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS combat_state (
    user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
    state_json TEXT NOT NULL)`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES players(user_id))`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS accounts (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES players(user_id))`);
}

// ─────────────────────────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Key",
    },
  });
}

function err(msg, status = 400) {
  return json({ error: msg, detail: msg }, status);
}

// ─────────────────────────────────────────────────────────────
// PASSWORD HASHING (simple SHA-256 — fine for this game)
// ─────────────────────────────────────────────────────────────
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(String(password));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// ─────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Key",
        },
      });
    }

    const url  = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Static assets first (no auth, no DB)
    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status !== 404) return asset;
    }

    if (path.startsWith("/api")) {
      const db = env.DB;
      await initDb(db);
      let body = {};
      if (method === "POST") {
        try { body = await request.json(); } catch {}
      }
      // ── Auth: Register ──
if (path === "/api/register" && method === "POST") {
  const { username, password, name, race } = body;
  if (!name || name.trim().length < 2) return err("Name too short.");
  if (!RACES[race]) return err("Unknown race.");

  // If username/password are provided, create an account record
  const hasAccount = !!(username && password);
  let normalizedUsername = null;

  if (hasAccount) {
    normalizedUsername = String(username).trim().toLowerCase();
    if (normalizedUsername.length < 2) return err("Username too short.");
    if (String(password).length < 4) return err("Password too short.");

    const existing = await dbGet(db,
      "SELECT 1 FROM accounts WHERE username=?",
      [normalizedUsername]
    );
    if (existing) return err("Username already taken.");
  }

  const uid = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  const token = crypto.randomUUID();

  await dbRun(db, "INSERT INTO players(user_id,location) VALUES(?,?)", [uid, "tavern"]);
  await dbRun(db, `INSERT INTO characters(user_id,name,race,strength,dexterity,constitution,
    intelligence,wisdom,charisma,ash_marks) VALUES(?,?,?,5,5,5,5,5,5,5)`,
    [uid, name.trim(), race]);
  await dbRun(db, "INSERT INTO sessions(token,user_id) VALUES(?,?)", [token, uid]);

  if (hasAccount) {
    const pwHash = await hashPassword(password);
    await dbRun(db,
      "INSERT INTO accounts(username,password_hash,user_id) VALUES(?,?,?)",
      [normalizedUsername, pwHash, uid]
    );
  }

  return json({ token, user_id: uid });
}

// ── Auth: Login ──
if (path === "/api/login" && method === "POST") {
  const { username, password } = body;
  if (!username || !password) return err("Username and password required.", 400);

  const normalizedUsername = String(username).trim().toLowerCase();
  const row = await dbGet(db,
    "SELECT user_id, password_hash FROM accounts WHERE username=?",
    [normalizedUsername]
  );
  if (!row || !row.password_hash) return err("Invalid login.", 401);

  const pwHash = await hashPassword(password);
  if (pwHash !== row.password_hash) return err("Invalid login.", 401);

  const token = crypto.randomUUID();
  await dbRun(db,
    "INSERT INTO sessions(token,user_id) VALUES(?,?) ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id",
    [token, row.user_id]
  );

  return json({ token, user_id: row.user_id });
}

// ── POST: Character reset (self or other via secret) ──
if (path === "/api/character/reset" && method === "POST") {
  let targetUid;
  const usernameParam = body.username != null && String(body.username).trim() !== "";
  if (usernameParam) {
    const secret = request.headers.get("X-Reset-Secret") || "";
    if (!env.RESET_SECRET || secret !== env.RESET_SECRET) return err("Forbidden.", 403);
    const normalized = String(body.username).trim().toLowerCase();
    const acc = await dbGet(db, "SELECT user_id FROM accounts WHERE username=?", [normalized]);
    if (!acc) return err("User not found.", 404);
    targetUid = acc.user_id;
  } else {
    const uidFromAuth = await getUid(db, request);
    if (!uidFromAuth) return err("Unauthorized.", 401);
    targetUid = uidFromAuth;
  }
  await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", ["tavern", targetUid]);
  await dbRun(db, `UPDATE characters SET instinct=NULL, strength=5, dexterity=5, constitution=5, intelligence=5, wisdom=5, charisma=5, stats_set=0,
    alignment_morality=0, alignment_order=0, ash_marks=0, ember_shards=0, soul_coins=0, xp=0, class_stage=0, current_hp=0 WHERE user_id=?`, [targetUid]);
  await dbRun(db, "DELETE FROM player_flags WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM inventory WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [targetUid]);
  return json({ ok: true, message: "Character reset. Reload to see True Welcome." });
}

// ── POST: Admin command ──
if (path === "/api/admin/command" && method === "POST") {
  const adminKey = request.headers.get("X-Admin-Key") || "";
  if (!env.ADMIN_SECRET || adminKey !== env.ADMIN_SECRET) {
    return json({ error: "Unauthorized." }, 401);
  }
  const command = body.command;
  const params = body.params || {};
  const adminEnv = {
    ...env,
    WORLD,
    getFlag: (uid, flag, def) => getFlag(db, uid, flag, def),
    setFlag: (uid, flag, value) => setFlag(db, uid, flag, value),
  };
  const result = await runAdminCommand(db, adminEnv, command, params);
  return json(result);
}

    // ── All routes below require auth ──
    const uid = await getUid(db, request);
    if (!uid && path !== "/api/data/races" && path !== "/api/data/instincts") {
      if (!path.startsWith("/api/data/")) return err("Unauthorized.", 401);
    }

    // ── GET: Character ──
    if (path === "/api/character" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const hp = await getPlayerHp(db, uid, row);
      return json({ ...row, max_hp: hp.max });
    }

    // ── POST: Choose instinct ──
    if (path === "/api/character/instinct" && method === "POST") {
      const { instinct } = body;
      if (!INSTINCTS[instinct]) return err("Invalid instinct.");
      const row = await dbGet(db, "SELECT instinct FROM characters WHERE user_id=?", [uid]);
      if (!row) return err("No character.", 404);
      if (row.instinct) return err("Instinct already chosen.");
      await dbRun(db, "UPDATE characters SET instinct=? WHERE user_id=?", [instinct, uid]);
      return json({ instinct, label: INSTINCTS[instinct].label, ok: true });
    }

    // ── POST: Set stats ──
    if (path === "/api/character/stats" && method === "POST") {
      const { strength, dexterity, constitution, intelligence, wisdom, charisma } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.stats_set) return err("Stats already set.");
      const stats = { strength, dexterity, constitution, intelligence, wisdom, charisma };
      const validation = validatePointBuy(stats);
      if (!validation.ok) return err(validation.message, 400);
      const maxHp = maxPlayerHp(constitution);
      await dbRun(db, `UPDATE characters SET strength=?,dexterity=?,constitution=?,
        intelligence=?,wisdom=?,charisma=?,stats_set=1,current_hp=? WHERE user_id=?`,
        [strength,dexterity,constitution,intelligence,wisdom,charisma,maxHp,uid]);
      return json({ ok: true, max_hp: maxHp });
    }

    // ── GET: Roll stats ──
    if (path === "/api/character/roll" && method === "GET") {
      const roll = () => {
        const dice = [rollDie(6),rollDie(6),rollDie(6),rollDie(6)].sort((a,b)=>a-b);
        return dice.slice(1).reduce((a,b)=>a+b,0);
      };
      return json({
        stats: { strength:roll(), dexterity:roll(), constitution:roll(),
                 intelligence:roll(), wisdom:roll(), charisma:roll() }
      });
    }

    // ── GET: Look ──
    if (path === "/api/look" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const loc  = row.location;
      const room = WORLD[loc];
      if (!room) return err("Unknown location.");

      const npcsHere = Object.entries(NPC_LOCATIONS)
        .filter(([,l]) => l === loc).map(([id]) => id);

      const combatRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
      const inCombat  = !!combatRow;

      let exits = Object.keys(room.exits || {});
      let exit_map = { ...(room.exits || {}) };
      if (loc === "market_square") {
        exits = [...exits, "down"];
        exit_map.down = "sewer_entrance";
      }

      return json({
        location: loc, name: room.name, description: room.description,
        exits, exit_map,
        objects: Object.keys(room.objects || {}),
        items: [],  // room items seeded statically for now
        npcs: npcsHere,
        in_combat: inCombat,
        fightable: FIGHTABLE_LOCATIONS.has(loc),
      });
    }

    // ── POST: Move ──
    if (path === "/api/move" && method === "POST") {
      const { direction } = body;
      const row  = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const inCombat = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (inCombat) return err("You're in combat. Flee first.");

      const room = WORLD[row.location];
      let dest = room?.exits?.[direction];
      if (row.location === "market_square" && direction === "down") dest = "sewer_entrance";
      if (!dest) return err(`You can't go ${direction} from here.`);
      if (!WORLD[dest]) return err("That path leads nowhere.");

      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [dest, uid]);

      // Ambient events
      let ambient = null;
      if (dest === "sewer_mid_cistern") {
        const r = Math.random();
        if (r < 0.1) ambient = "*A single bubble rises from the center of the cistern. The water does not ripple.*";
        else if (r < 0.225) ambient = "*Something skitters just beyond your torchlight. The sound stops the moment you turn.*";
      }

      // Depth flag
      if (dest.startsWith("sewer_mid") || dest.startsWith("sewer_deep") || dest === "sewer_gate") {
        await setFlag(db, uid, "warned_mid_sewer", 1);
      }
      if (dest === "market_square") {
        await setFlag(db, uid, "has_seen_market_square", 1);
      }

      const destRoom = WORLD[dest];
      const npcsHere = Object.entries(NPC_LOCATIONS)
        .filter(([,l]) => l === dest).map(([id]) => id);

      return json({
        location: dest, name: destRoom.name, description: destRoom.description,
        exits: Object.keys(destRoom.exits || {}),
        exit_map: destRoom.exits || {},
        objects: Object.keys(destRoom.objects || {}),
        items: [], npcs: npcsHere, ambient,
        fightable: FIGHTABLE_LOCATIONS.has(dest),
      });
    }

    // ── GET: Inspect ──
    if (path.startsWith("/api/inspect/") && method === "GET") {
      const target = path.slice("/api/inspect/".length);
      const row  = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const room = WORLD[row.location];
      const obj  = room?.objects?.[target];
      if (!obj) return err(`Nothing called '${target}' here.`, 404);
      return json({ target, desc: obj.desc, actions: obj.actions || [] });
    }

    // ── POST: Talk ──
    if (path === "/api/talk" && method === "POST") {
      const { npc, topic = "" } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);

      const npcLoc = NPC_LOCATIONS[npc];
      if (!npcLoc || npcLoc !== row.location) return err(`${npc} is not here.`);

      // Build player context for NPCs (Seris/Thalara + Kelvaris stateful intro)
      const itemsSold   = await getFlag(db, uid, "curator_items_sold");
      const deaths      = await getFlag(db, uid, "death_count");
      const morality    = row.alignment_morality || 0;
      const depthTier   = await getFlag(db, uid, "found_foundation_stone") ? 2
                        : await getFlag(db, uid, "warned_mid_sewer")        ? 1 : 0;
      const kelvarisVisits = await getFlag(db, uid, "kelvaris_visits");
      const hasSeenMarket  = await getFlag(db, uid, "has_seen_market_square");
      const warnedMidSewer  = await getFlag(db, uid, "warned_mid_sewer");

      const playerContext = {
        items_sold: itemsSold, deaths, morality, depth_tier: depthTier,
        alignment: morality >= 40 ? "light" : morality <= -40 ? "dark" : "neutral",
        kelvaris_visits: kelvarisVisits,
        has_instinct: !!(row.instinct && row.instinct.trim()),
        stats_set: !!(row.stats_set),
        has_seen_market_square: !!hasSeenMarket,
        warned_mid_sewer: !!warnedMidSewer,
      };

      const response = await getNPCResponse(env, npc, topic, playerContext);

      if (npc === "bartender") {
        await setFlag(db, uid, "kelvaris_visits", kelvarisVisits + 1);
      }

      return json({ response });
    }

    // ── GET: NPC topics ──
    if (path.startsWith("/api/data/npc/") && method === "GET") {
      const npcId = path.split("/")[4];
      const topics = NPC_TOPICS[npcId];
      if (!topics) return err("Unknown NPC.", 404);
      return json({ npc: npcId, topics });
    }

    // ── GET: Board ──
    if (path === "/api/board" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "market_square") return err("The Ember Post is in the market square.");
      const depth = await getFlag(db, uid, "found_foundation_stone") ? 2
                  : await getFlag(db, uid, "warned_mid_sewer") ? 1 : 0;
      const seed  = Math.floor(Date.now() / 3_600_000); // hourly
      return json({ board: formatBoard(row.name, depth, seed) });
    }

    // ── POST: Commune ──
    if (path === "/api/commune" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "ashen_sanctuary") return err("You must be at the Ashen Sanctuary.");

      const instinct = (row.instinct || "").toLowerCase();
      const count    = await getFlag(db, uid, "commune_count");
      await setFlag(db, uid, "commune_count", count + 1);

      const mComm = instinct === "ember_touched" ? 2 : 1;
      await tickAlignment(db, uid, mComm, 1, instinct);

      const hp = await getPlayerHp(db, uid, row);
      let hpGained = 0;
      let response = "";

      if (Math.random() < 0.01) {
        // Rare glad event
        hpGained = 3;
        response = "*You kneel. The air shifts.*\n\n*Something ancient takes notice — and then, for a single heartbeat, something changes.*\n\n*The Sanctuary feels glad you are here.*\n\n*The feeling passes before you can be certain of it. But it was there.*";
      } else if (instinct === "hearthbound") {
        hpGained = 3;
        response = count === 0
          ? "*The silence changes. It was empty before. Now it is not.*\n\n*Something turns its attention toward you — not a god, not a demon, something that predates those distinctions — and waits.*\n\n*Your wounds ease slightly.* **+3 HP**"
          : "*You return to the altar. Something is already waiting.*\n\n*It does not greet you. It simply continues attending, the way fire attends to whatever is placed in front of it.*\n\n*Your wounds ease slightly.* **+3 HP**";
      } else {
        response = COMMUNE_FLAVORS[Math.floor(Math.random() * COMMUNE_FLAVORS.length)];
      }

      if (hpGained) {
        const newHp = Math.min(hp.current + hpGained, hp.max);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [newHp, uid]);
      }

      return json({ response, hp_gained: hpGained });
    }

// ── GET: Combat State ──
if (path === "/api/combat/state" && method === "GET") {
  const csRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
  if (!csRow) return err("Not in combat.", 404);
  const state = JSON.parse(csRow.state_json);
  const enemy = COMBAT_DATA.enemies[state.enemy_id];
  return json({
    ...state,
    enemy_name: state.enemy_name || (enemy && enemy.name) || state.enemy_id,
  });
}

    // ── POST: Combat Start ──
    if (path === "/api/combat/start" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!FIGHTABLE_LOCATIONS.has(row.location)) return err("Nothing to fight here.");
      const existing = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (existing) return err("Already in combat.");

      const hp = await getPlayerHp(db, uid, row);
      if (hp.current <= 0) return err("You can't fight in this condition.");

      let enemy;
      // Optional: set player_flags.force_combat_test=1 for deterministic cinder_rat spawn (playtest).
      const forceCombatTest = await getFlag(db, uid, "force_combat_test");
      if (forceCombatTest) {
        const cinderRat = COMBAT_DATA.enemies.cinder_rat;
        enemy = { ...cinderRat, id: cinderRat.id };
      } else {
        enemy = randomEnemy(row.location);
      }
      const state = {
        enemy_id: enemy.id, enemy_name: enemy.name,
        enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_used: false, turn: 1, location: row.location,
      };
      await dbRun(db, "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
        [uid, JSON.stringify(state)]);
      return json({ ...state, message: `*${enemy.name} emerges from the dark.*\n\n${enemy.desc || ""}` });
    }

    // ── POST: Combat Action ──
    if (path === "/api/combat/action" && method === "POST") {
      const { action } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const csRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
      if (!csRow) return err("Not in combat.");

      const state    = JSON.parse(csRow.state_json);
      const instinct = (row.instinct || "").toLowerCase();
      const enemy    = COMBAT_DATA.enemies[state.enemy_id];
      const stats    = { strength: row.strength, dexterity: row.dexterity, constitution: row.constitution };

      if (action === "flee") {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await tickAlignment(db, uid, 0, -1, instinct);
        return json({ result: "fled", message: "*You retreat into the dark.*" });
      }

      if (action === "ability" && state.ability_used) return err("Ability already used.");

      const useAbility = action === "ability";
      const attack     = playerAttack(stats, enemy, useAbility, instinct);
      const enemyDmg   = action === "ability" && attack.skipRetaliation ? 0
                       : Math.floor(enemyAttack(enemy, stats) * (attack.damageReduction ? (1 - attack.damageReduction) : 1));

      if (useAbility) state.ability_used = true;

      let playerHp = state.player_hp;
      let enemyHp  = state.enemy_hp;

      if (attack.heal) {
        playerHp = Math.min(playerHp + attack.heal, state.player_hp_max);
      } else {
        enemyHp  = Math.max(0, enemyHp - attack.dmg);
      }
      playerHp = Math.max(0, playerHp - enemyDmg);

      // Victory
      if (enemyHp <= 0) {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

        const xpGain = enemy.xp || 50;
        const xpRow  = await dbGet(db, "SELECT xp,class_stage FROM characters WHERE user_id=?", [uid]);
        const newXp  = (xpRow.xp || 0) + xpGain;
        await dbRun(db, "UPDATE characters SET xp=? WHERE user_id=?", [newXp, uid]);
        const canAdvance = newXp >= [0,500,1500,3500,7500,15000][(xpRow.class_stage||0)+1];

        // Loot — simple cash drop
        const lootAsh = Math.floor(Math.random() * 15) + 5;
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [lootAsh, uid]);

        const mKill = instinct === "ironblood" ? 0 : -1;
        await tickAlignment(db, uid, mKill, 1, instinct);

        return json({
          result: "victory",
          message: `*${enemy.name} falls.*\n\n${attack.narrative}\n\n**+${xpGain} XP** | **+${lootAsh} Ash Marks**`,
          can_advance: !!canAdvance, player_hp: playerHp,
        });
      }

      // Death
      if (playerHp <= 0) {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=0, ash_marks=0 WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
        const maxHp = maxPlayerHp(row.constitution);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, uid]);
        const dc = await getFlag(db, uid, "death_count");
        await setFlag(db, uid, "death_count", dc + 1);
        await tickAlignment(db, uid, 0, -2, instinct);
        return json({
          result: "death",
          message: `*${enemy.name} stands over you.*\n\n*You wake in the Shadow Hearth Inn. Your marks are gone.*`,
        });
      }

      // Ongoing
      state.enemy_hp  = enemyHp;
      state.player_hp = playerHp;
      state.turn++;
      await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(state), uid]);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

      return json({
        result: "ongoing",
        message: `${attack.narrative}\n\n*${enemy.name} retaliates — ${enemyDmg > 0 ? `${enemyDmg} damage.` : "misses."}*`,
        player_hp: playerHp, enemy_hp: enemyHp,
        enemy_hp_max: state.enemy_hp_max,
      });
    }

    // ── POST: Rest ──
    if (path === "/api/rest" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "tavern") return err("You need to be at the Shadow Hearth Inn.");
      if ((row.ash_marks || 0) < BARTENDER_FEE) {
        return json({ ok: false, message: `*Kelvaris doesn't look at you.*\n\n"Ten marks. That's what a room costs."\n\nYou have **${row.ash_marks || 0}** Ash Marks.` });
      }
      const maxHp = maxPlayerHp(row.constitution);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-?,current_hp=? WHERE user_id=?", [BARTENDER_FEE, maxHp, uid]);
      await setFlag(db, uid, "has_room", 1);
      const instinct = (row.instinct || "").toLowerCase();
      await tickAlignment(db, uid, 1, 2, instinct);
      return json({ ok: true, message: `*Kelvaris takes the marks and sets a key on the bar.*\n\n"Room's yours until morning."\n\n**Your HP is fully restored.**`, hp: maxHp });
    }

    // ── GET: Inventory ──
    if (path === "/api/inventory" && method === "GET") {
      const rows = await dbAll(db, "SELECT item,qty FROM inventory WHERE user_id=? ORDER BY item", [uid]);
      const items = rows.map(r => r.qty === 1 ? r.item : `${r.item} x${r.qty}`);
      return json({ items });
    }

    // ── GET: Wallet ──
    if (path === "/api/wallet" && method === "GET") {
      const row = await dbGet(db, "SELECT ash_marks,ember_shards,soul_coins FROM characters WHERE user_id=?", [uid]);
      return json(row || { ash_marks:0, ember_shards:0, soul_coins:0 });
    }

    // ── GET: Races / Instincts (public) ──
    if (path === "/api/data/races")     return json({ races: RACES });
    if (path === "/api/data/instincts") return json({ instincts: INSTINCTS });

    // ── POST: Logout ──
    if (path === "/api/logout" && method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (auth.startsWith("Bearer ")) {
        await dbRun(db, "DELETE FROM sessions WHERE token=?", [auth.slice(7).trim()]);
      }
      return json({ ok: true });
    }

    return err("Not found.", 404);
    }

    return new Response("Not found", { status: 404 });
  }
};
