// Edit emergency numbers here to match your country.
export const CONTACTS = [
  { label: "National emergency", number: "112", note: "Police, fire and medical", primary: true },
  { label: "Ambulance", number: "108" },
  { label: "Fire department", number: "101" },
  { label: "Police", number: "100" },
];

export const GUIDES = {
  Earthquake: {
    icon: "🌋",
    steps: [
      ["Drop", "Get down on your hands and knees before the shaking knocks you down."],
      ["Cover", "Protect your head and neck under a sturdy table or desk. Cover your whole body if you can."],
      ["Hold on", "Hold your shelter and move with it until the shaking stops."],
      ["If you are outdoors", "Move away from buildings, streetlights and power lines."],
    ],
  },
  Flood: {
    icon: "🌊",
    steps: [
      ["Move to higher ground", "Leave low-lying areas and basements right away."],
      ["Avoid moving water", "Six inches of fast water can knock an adult down. Two feet can carry a vehicle away."],
      ["Turn off utilities", "Switch off the electricity mains and gas valve if you have been told to and it is safe."],
      ["Drink safe water", "Skip tap water. Use sealed bottled water."],
    ],
  },
  Fire: {
    icon: "🔥",
    steps: [
      ["Stay low", "Crawl under the smoke, where the air is cleaner and cooler."],
      ["Check doors", "Touch a door with the back of your hand. If it is hot, use another exit."],
      ["Stop, drop and roll", "If your clothes catch fire, drop to the ground and roll to smother the flames."],
      ["Meet at your assembly point", "Regroup at the safe zone your household agreed on."],
    ],
  },
  Cyclone: {
    icon: "🌀",
    steps: [
      ["Stay indoors", "Keep away from windows, glass partitions and open balconies."],
      ["Secure your surroundings", "Bring in outdoor objects that could be blown around."],
      ["Protect electronics", "Unplug sensitive devices to avoid surge damage."],
      ["Follow official updates", "Keep a phone or radio ready for emergency broadcasts."],
    ],
  },
};

export const KIT = [
  "Drinking water (1 gallon per person per day)",
  "Non-perishable food (3 days minimum)",
  "First aid kit and prescription medicines",
  "Flashlight with spare batteries",
  "Battery-powered or hand-crank radio",
  "Emergency whistle",
  "Waterproof copies of IDs and records",
  "Multi-purpose tool or pocket knife",
  "Emergency cash and small change",
  "Charged power bank",
];
