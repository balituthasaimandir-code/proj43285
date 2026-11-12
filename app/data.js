// Emergency contacts should be checked against the local authorities before release.
export const CONTACTS = [
  { label: "National emergency", number: "112", note: "Police, fire and medical", primary: true },
  { label: "Ambulance", number: "108" },
  { label: "Fire department", number: "101" },
  { label: "Police", number: "100" },
];

export const GUIDES = {
  Earthquake: { icon: "〰️", art: "earthquake", tagline: "DROP · COVER · HOLD ON", steps: [["Drop", "Get down on your hands and knees before the shaking knocks you down."], ["Cover", "Protect your head and neck under a sturdy table or desk. Cover your whole body if you can."], ["Hold on", "Hold your shelter and move with it until the shaking stops."], ["If you are outdoors", "Move away from buildings, streetlights and power lines."]] },
  Flood: { icon: "🌊", art: "flood", tagline: "MOVE TO HIGHER GROUND", steps: [["Move to higher ground", "Leave low-lying areas and basements right away."], ["Avoid moving water", "Do not walk, swim or drive through floodwater."], ["Turn off utilities", "Switch off electricity and gas only if you have been told to and it is safe."], ["Drink safe water", "Skip tap water. Use sealed bottled water."]] },
  Fire: { icon: "🔥", art: "fire", tagline: "GET LOW · GET OUT", steps: [["Stay low", "Crawl under the smoke, where the air is cleaner and cooler."], ["Check doors", "Touch a door with the back of your hand. If it is hot, use another exit."], ["Stop, drop and roll", "If your clothes catch fire, drop to the ground and roll to smother the flames."], ["Meet at your assembly point", "Regroup at the safe zone your household agreed on."]] },
  Tsunami: { icon: "🌊", art: "tsunami", tagline: "AFTER STRONG SHAKING, GO INLAND", steps: [["Move immediately", "After a strong or long coastal earthquake, move to high ground or inland without waiting for a warning."], ["Follow marked routes", "Walk inland and uphill. Avoid river mouths and the shore."], ["Stay away", "Do not return until authorities say it is safe; multiple waves may arrive."], ["Use official updates", "Listen to local emergency broadcasts and alerts."]] },
  "Forest fire": { icon: "🌲", art: "forest", tagline: "LEAVE EARLY", steps: [["Follow evacuation orders", "Leave as soon as officials direct you, using the route they recommend."], ["Take essentials", "Bring people, pets, medicines and your go-bag. Close windows and doors if time allows."], ["Avoid smoke", "Stay indoors with windows closed if told to shelter. Keep smoke out of your car."], ["Call for help", "Report immediate danger to emergency services."]] },
  Cyclone: { icon: "🌀", art: "cyclone", tagline: "SHELTER · LISTEN · PREPARE", steps: [["Stay indoors", "Keep away from windows, glass partitions and open balconies."], ["Secure your surroundings", "Bring in outdoor objects that could be blown around."], ["Protect electronics", "Unplug sensitive devices to avoid surge damage."], ["Follow official updates", "Keep a phone or radio ready for emergency broadcasts."]] },
};

export const KIT = ["Drinking water (1 gallon per person per day)", "Non-perishable food (3 days minimum)", "First aid kit and prescription medicines", "Flashlight with spare batteries", "Battery-powered or hand-crank radio", "Emergency whistle", "Waterproof copies of IDs and records", "Multi-purpose tool or pocket knife", "Emergency cash and small change", "Charged power bank"];
