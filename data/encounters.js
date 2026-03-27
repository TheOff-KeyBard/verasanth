/** Narrative random encounters (non-combat). Zone keys map to ENCOUNTER_CHANCES in same module. */

export const ENCOUNTER_ZONES = {
  street: [
    "market_square",
    "low_quarter_street",
    "upper_street",
    "ash_road",
    "crossroads",
    "merchant_row",
  ],
  guild: [
    "ashen_archive_entrance",
    "stone_watch_gate",
    "broken_banner_gate",
    "quiet_sanctum_entrance",
    "veil_market_surface",
    "umbral_covenant_descent",
  ],
  indoor: [
    "tavern",
    "atelier",
    "mended_hide",
    "still_scale",
    "hollow_jar",
    "ashen_sanctuary",
    "crucible",
    "backroom",
  ],
  sewer: [
    "drain_entrance",
    "overflow_channel",
    "broken_pipe_room",
    "vermin_nest",
    "workers_alcove",
    "rusted_gate",
    "fungal_bloom_chamber",
    "collapsed_passage",
    "old_maintenance_room",
    "echoing_hall",
    "spore_garden",
    "cracked_aqueduct",
  ],
};

export const ENCOUNTER_CHANCES = {
  street: 0.08,
  guild: 0.06,
  indoor: 0.02,
  sewer: 0.04,
};

// ── TIER 1 — AMBIENT (no interaction) ─────────────────────────────

export const AMBIENT_ENCOUNTERS = [
  {
    id: "amb_wrong_door",
    zones: ["street", "guild"],
    text: "A door stands open in a wall you don't remember having a door. By the time you look twice, it's closed.",
  },
  {
    id: "amb_smell_salt",
    zones: ["street"],
    text: "The air carries a brief, sharp smell of salt water. There is no sea for a hundred miles.",
  },
  {
    id: "amb_wrong_shadow",
    zones: ["street", "guild"],
    text: "Your shadow moves a half-step behind you. Just once. Then it catches up.",
  },
  {
    id: "amb_name_whisper",
    zones: ["street"],
    text: "Someone says your name. When you turn, the street is empty.",
  },
  {
    id: "amb_stone_warm",
    zones: ["street", "guild"],
    text: "The stone wall beside you is warm to the touch. The sun hasn't reached this alley.",
  },
  {
    id: "amb_ledger_ref",
    zones: ["street"],
    text: "A page blows past you. You catch a glimpse of names written in a hand that isn't ink. It crumbles before you can read it.",
    requires_flag: "ledger_gautrorn_confirmed",
  },
  {
    id: "amb_scar_smell",
    zones: ["street", "sewer"],
    text: "The air tastes faintly biological. Like something breathing nearby that has no mouth.",
    requires_flag: "first_echo_triggered",
  },
  {
    id: "amb_candle_wrong",
    zones: ["indoor"],
    text: "A candle in the corner burns without wax. No one else seems to notice.",
  },
  {
    id: "amb_voice_wall",
    zones: ["indoor"],
    text: "You hear two voices through the wall. When you listen closely, they stop mid-sentence.",
  },
  {
    id: "amb_sewer_echo",
    zones: ["sewer"],
    text: "Your footstep echoes back a half-second late. And then once more, from a direction that doesn't exist.",
  },
  {
    id: "amb_sewer_mark",
    zones: ["sewer"],
    text: "There is a mark scratched into the wall. Fresh. You didn't make it.",
  },
];

// ── TIER 2 — SOCIAL (engage / ignore) ───────────────────────────

export const SOCIAL_ENCOUNTERS = [
  {
    id: "soc_confused_arrival",
    zones: ["street"],
    once: false,
    stranger:
      "Hey — sorry. You look like you know your way around. What is this place? I was on the road to Greyharrow and then — I blinked and I was here.",
    options: [
      {
        label: "This is Verasanth. It does that.",
        response: "So it wasn't just me. Gods help us.",
      },
      {
        label: "You're safe enough. For now.",
        response: "That's… not comforting.",
      },
      {
        label: "What's the last thing you remember?",
        response: "A crossroads. A choice. Maybe I chose wrong.",
      },
      {
        label: "Keep moving. Don't stop to think about it.",
        response: "Right. Moving. Before something else finds me.",
      },
    ],
    ignore_text: "You keep walking. They're still staring at the street.",
    effects: null,
  },
  {
    id: "soc_panicked_arrival",
    zones: ["street"],
    once: false,
    stranger:
      "Wait — stop. Please. Tell me you see the same streets I do. Tell me this isn't some trick of the dark.",
    options: [
      {
        label: "I see them. They're real enough.",
        response: "Real enough. That's not reassuring.",
      },
      {
        label: "The city shifts. Don't trust your eyes.",
        response: "Wonderful. Just wonderful.",
      },
      {
        label: "You're not the first to arrive like this.",
        response: "Then something's wrong with this place.",
      },
      {
        label: "Take a breath. You'll adjust.",
        response: "I don't want to adjust!",
      },
    ],
    ignore_text: "You walk past. They call after you. You don't turn around.",
    effects: null,
  },
  {
    id: "soc_ember_touched",
    zones: ["street", "guild"],
    once: false,
    stranger:
      "Do you feel it? The heat under the stones? Like the ground remembers something we don't. I wasn't supposed to be here. None of us were.",
    options: [
      { label: "Some feel it. Some don't.", response: "Then why me?" },
      {
        label: "That's the city's heartbeat.",
        response: "It feels angry.",
      },
      {
        label: "Ignore it. It only gets louder if you listen.",
        response: "Too late for that.",
      },
      {
        label: "If it's calling you, answer carefully.",
        response: "Calling for what?",
      },
    ],
    ignore_text: "You leave them standing in the heat they can't explain.",
    effects: null,
  },
  {
    id: "soc_cambral_arrival",
    zones: ["street"],
    once: false,
    stranger:
      "Oi. You. What district is this? Last thing I recall was a tunnel collapse and now — this isn't my mine.",
    options: [
      {
        label: "Low Quarter. You're far from any mine.",
        response: "Then how did I get here?",
      },
      {
        label: "The city brought you. Happens.",
        response: "Cities don't bring people.",
      },
      {
        label: "You're alive. That's what matters.",
        response: "Alive. But where?",
      },
      {
        label: "If you're strong enough to stand, you're strong enough to walk.",
        response: "Aye. Walking's something.",
      },
    ],
    ignore_text: "You leave them calculating distances that no longer apply.",
    effects: null,
  },
  {
    id: "soc_darmerian_sailor",
    zones: ["street"],
    once: false,
    stranger:
      "By the tides. I was on a ship. A real one. Now I'm standing on dry stone with no sea in sight. What kind of place steals a man mid-voyage?",
    options: [
      {
        label: "Verasanth doesn't ask permission.",
        response: "Neither do storms.",
      },
      {
        label: "You're not the first sailor to wash up here.",
        response: "Then where's the sea?",
      },
      {
        label: "If you remember the waves, hold onto that.",
        response: "Feels like they're slipping.",
      },
      {
        label: "Stand firm. The city respects strength.",
        response: "Then it'll respect me.",
      },
    ],
    ignore_text: "You leave them looking for a horizon that isn't there.",
    effects: null,
  },
  {
    id: "soc_you_too",
    zones: ["street", "guild"],
    once: false,
    stranger:
      "You're new here, aren't you? I can tell by the way you're looking around. Everyone who arrives does that. Everyone who survives stops.",
    options: [
      {
        label: "How long have you been here?",
        response: "Long enough to stop looking.",
      },
      {
        label: "What made you survive?",
        response: "Stubbornness. Or cowardice. Hard to tell now.",
      },
      {
        label: "What should I know?",
        response:
          "Don't trust the streets after dark. Or before. The city doesn't have a good time.",
      },
    ],
    ignore_text: "They watch you go. You feel them watching.",
    effects: null,
  },
  {
    id: "soc_dont_belong",
    zones: ["street"],
    once: false,
    stranger:
      "I'm not supposed to be here. I have a family. A home. I just stepped through a doorway and the world changed. Please tell me there's a way back.",
    options: [
      { label: "A lot of us had those.", response: "Had?" },
      {
        label: "You'll find your footing.",
        response: "I don't want footing. I want home.",
      },
      {
        label: "The city doesn't return what it takes.",
        response: "Then I'm trapped.",
      },
      { label: "You're not alone. Not anymore.", response: "Thank you." },
    ],
    ignore_text:
      "You walk on. Some questions don't have answers worth stopping for.",
    effects: null,
  },
  {
    id: "soc_lost_navigator",
    zones: ["street", "guild"],
    once: false,
    stranger:
      "You know these streets? Because I swear they weren't here a moment ago. Either the city's moving — or I am.",
    options: [
      {
        label: "They move. Get used to it.",
        response: "Streets shouldn't move.",
      },
      {
        label: "You moved. The city stayed.",
        response: "That's worse.",
      },
      {
        label: "Follow me. I'll get you somewhere safer.",
        response: "Bless you.",
      },
      {
        label: "Trust your instincts over the roads.",
        response: "Instincts got me lost.",
      },
    ],
    ignore_text: "You leave them to the streets. The streets will sort it out.",
    effects: null,
  },
  {
    id: "soc_watch_patrol",
    zones: ["street", "guild"],
    once: false,
    stranger:
      "A Stone Watch patrol moves through the street in formation. One of them glances at you, notes something, looks away.",
    options: [
      {
        label: "Nod at them.",
        response: "The nearest one nods back. Once.",
      },
      {
        label: "Step aside and let them pass.",
        response: "They pass without comment. That's as good as it gets.",
      },
    ],
    ignore_text: "They pass. You keep moving. The city has eyes.",
    effects: null,
  },
  {
    id: "soc_veil_courier",
    zones: ["street", "guild"],
    once: false,
    stranger:
      "A figure in a grey coat moves through the crowd with purpose. They brush past you. Something small and paper falls from their pocket — and they don't stop.",
    options: [
      {
        label: "Pick it up.",
        response:
          "It's blank. Both sides. You look up. The figure is gone.",
      },
      {
        label: "Leave it.",
        response:
          "Someone else picks it up before you've taken three steps.",
      },
    ],
    ignore_text: "The moment passes. The city swallows it.",
    effects: null,
  },
  {
    id: "soc_banner_recruit",
    zones: ["street", "guild"],
    once: false,
    stranger:
      "A young Broken Banner recruit sits on a crate, rewrapping a hand wound with practiced efficiency. They look up. 'You been down there yet?' They mean the sewer.",
    options: [
      { label: "Yes.", response: "Then you know. Most don't come back the same." },
      { label: "Not yet.", response: "You will. Everyone does eventually." },
      {
        label: "What happened to your hand?",
        response:
          "Something with teeth. Don't worry about the teeth. Worry about what sent it.",
      },
    ],
    ignore_text: "You leave them to their wound. Everyone in this city has one.",
    effects: null,
  },
  {
    id: "soc_gautrorn_cameo",
    zones: ["street"],
    requires_flag: "first_meeting_thalara",
    once: false,
    stranger:
      "Gautrorn Haargoth is moving through the market with a crate of goods, talking to no one in particular about tide patterns. He spots you, raises a hand. 'Still standing. Good.'",
    options: [
      {
        label: "Stop and talk.",
        response:
          "He sets the crate down. 'City's been quiet today. I don't trust quiet.' He picks it up and moves on.",
      },
      {
        label: "Wave back and keep moving.",
        response:
          "He nods. The crate keeps moving. The tide commentary continues.",
      },
    ],
    ignore_text: "You hear him behind you. Still talking about tides.",
    effects: null,
  },
  {
    id: "soc_seris_watching",
    zones: ["street", "guild"],
    requires_flag: "first_meeting_thalara",
    once: false,
    stranger:
      "Seris Vantrel stands at the edge of the square, watching something you can't identify. She doesn't look at you. But she knows you're there.",
    options: [
      {
        label: "Approach her.",
        response:
          "'Not now,' she says, without turning. 'Come to the market if you have something worth saying.'",
      },
      {
        label: "Watch what she's watching.",
        response:
          "There's nothing there. A wall. A shadow. She keeps watching it.",
      },
    ],
    ignore_text:
      "You feel her awareness follow you until you're out of sight.",
    effects: { set_flag: "seen_seris_watching" },
  },
];

// ── TIER 3 — LORE (rare, flag-gated, consequence) ─────────────

export const LORE_ENCOUNTERS = [
  {
    id: "lore_ledger_stranger",
    zones: ["street"],
    requires_flag: "ledger_gautrorn_confirmed",
    requires_flag_not: "encountered_ledger_stranger",
    once: true,
    stranger:
      "Do you ever get the feeling this place was waiting for you? Like your name was written down somewhere before you walked in?",
    options: [
      { label: "Sometimes.", response: "Then I'm not losing my mind." },
      {
        label: "Why do you ask?",
        response:
          "Because I swear I heard my name whispered. Before I arrived.",
      },
      {
        label: "The city chooses who it wants.",
        response: "That's unsettling.",
      },
      {
        label: "If it's watching you, don't let it see fear.",
        response: "I'll try.",
      },
    ],
    ignore_text: "You walk past. The question stays with you.",
    effects: { set_flag: "encountered_ledger_stranger" },
  },
  {
    id: "lore_city_whisper",
    zones: ["street"],
    once: false,
    chance_modifier: 0.3,
    stranger:
      "Did you hear it? The whisper when you crossed the threshold? It said — 'another one.' I swear it did.",
    options: [
      {
        label: "I heard it.",
        response: "Then we both know. That's worse somehow.",
      },
      {
        label: "I didn't hear anything.",
        response: "You will. Next time you cross somewhere new.",
      },
    ],
    ignore_text: "You keep walking. The city does not confirm or deny.",
    effects: null,
  },
  {
    id: "lore_darmerian_sailor_gautrorn",
    zones: ["street"],
    requires_flag: "gautrorn_name_revealed",
    requires_flag_not: "encountered_darmerian_sailor",
    once: true,
    stranger:
      "By the tides. I was on a ship. A real one. Haargoth's Run, if you know it. Then the sea just — stopped. And here I am.",
    options: [
      {
        label: "I know someone who might want to meet you.",
        response: "Who? A sailor? Gods, please. Someone who speaks tide.",
      },
      {
        label: "Haargoth's Run. Where is that?",
        response:
          "South of the drowned reef. Best route from the coast to the interior. Or it was. Before it wasn't.",
      },
      {
        label: "Stay away from a man called Gautrorn Haargoth.",
        response: "Never heard of him. Why?",
      },
    ],
    ignore_text:
      "You walk on. The route he named doesn't exist. You're fairly sure of that now.",
    effects: { set_flag: "encountered_darmerian_sailor" },
  },
];
