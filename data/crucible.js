/**
 * The Crucible — Othorion Naxir's workshop on East Road.
 * @see blueprints/NPCs/cursor_othorion_crucible.md
 */

export const CRUCIBLE_ROOM = {
  name: "The Crucible",
  description: "The room announces itself before you reach the door — a faint smell of heated metal and something electrical that has no source you can identify. Inside, every surface is in use. Shelves of specimen jars line the walls at irregular heights, labels in a cramped shorthand that covers both sides of the paper. Two worktables run parallel down the room's length, covered in instruments you recognize in function but not in origin. Measurements are recorded on everything: the tabletops, the walls, the back of the door you just came through. At the far end, a low lamp burns over a desk where a tall figure writes without looking up. A small shape moves near his shoulder — something between a bird and an idea of a bird, its edges slightly imprecise, as if it was made from a concept rather than matter. Pip regards you with one eye that is entirely too knowing for something with no confirmed taxonomy.",
  exits: { north: "east_road" },
  objects: {
    othorion: {
      desc: "Othorion Naxir is tall, spare, and entirely contained. His clothing is practical in the specific way of someone who stopped caring about appearance the moment he had more interesting things to think about, and has not revisited the decision since. His hands are ink-stained from the knuckle to the second joint on both hands. He writes with one and takes notes with the other simultaneously, which should not be possible and which he does not acknowledge. When he finally looks at you it is with the particular attention of someone who has been tracking your approach since you entered the Ember Quarter and is now confirming their measurements.",
      actions: ["talk", "inspect"],
    },
    pip: {
      desc: "Pip occupies the space near Othorion's left shoulder with the authority of something that has always been exactly there. It is approximately the size and shape of a small bird — feathered or not, you cannot quite resolve the question when you look directly — and its single visible eye is a dark amber that contains considerably more information than an eye that size should be able to hold. It has been watching you since you came through the door. It watched you on the road. You are relatively certain it watched you before that. Othorion consults it without speaking. It communicates without moving. The arrangement appears to have been working for a very long time.",
      actions: ["inspect", "look"],
    },
    specimen_shelves: {
      desc: "The jars are labeled in Othorion's shorthand — a dense system of symbols and abbreviations that you can parse in fragments: dates, locations, measurements, and occasionally a single word in plain language that functions as a conclusion. One jar contains a liquid that is the exact color of the sewer water below but moves against gravity when the shelf vibrates. Another holds something solid that casts a shadow in a direction unrelated to the light source. A third is labeled, in plain letters, CONTROL. The jar appears empty. The label has a question mark after it.",
      actions: ["inspect", "browse"],
    },
    worktables: {
      desc: "Both tables are covered in instruments laid out in working sequences — not organized for storage but for active use, mid-process. On the near table: a series of measurements recorded on paper pinned flat with small stones, each one dated and cross-referenced to a location in a notation system that you gradually realize is a map of the sewer levels. On the far table: something that looks like a compass but points in a direction that is not north, and a device with no obvious purpose whose needle swings toward the door when you enter and has not moved back.",
      actions: ["inspect"],
    },
    wall_measurements: {
      desc: "Numbers, symbols, and diagrams cover the walls in layers — older measurements partially obscured by newer ones, each pass adding refinement. What you can reconstruct: a long-term study of something that does not behave the way it should. Temperature readings that don't correspond to depth. Resonance measurements that increase rather than decrease with distance from the source. A graph whose trend line Othorion has redrawn three times, each time with the same result, and has underlined once. Below the graph, in plain language: CONSISTENT. THEREFORE: NOT EQUIPMENT ERROR.",
      actions: ["inspect", "read"],
    },
    lamp: {
      desc: "A low oil lamp at the far end of the desk, burning with a steady flame that Othorion has not adjusted in some time — the wick is long and the light is amber and slightly too warm for the hour. The lamp has been burning long enough that the glass is faintly smoked at the top. He works by it without noticing it. The papers nearest the lamp are covered in a finer hand than the rest, as if he was writing slowly and thinking between each word.",
      actions: ["inspect"],
    },
  },
  items: [],
};
