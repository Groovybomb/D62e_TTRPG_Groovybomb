export const ATTRIBUTE_DEFINITIONS = {
  agility: {
    label: 'Agility',
    skills: {
      acrobatics: 'Acrobatics',
      shooting: 'Shooting',
      melee: 'Melee',
      slightOfHand: 'Slight of Hand',
    },
  },
  brawn: {
    label: 'Brawn',
    skills: {
      athletics: 'Athletics',
      intimidation: 'Intimidation',
      stamina: 'Stamina',
      throwing: 'Throwing',
    },
  },
  knowledge: {
    label: 'Knowledge',
    skills: {
      languages: 'Languages',
      medicine: 'Medicine',
      scholar: 'Scholar',
      sciences: 'Sciences',
    },
  },
  perception: {
    label: 'Perception',
    skills: {
      driving: 'Driving',
      investigation: 'Investigation',
      stealth: 'Stealth',
      survival: 'Survival',
      gunnery: 'Gunnery',
      streetwise: 'Streetwise',
    },
  },
  charm: {
    label: 'Charm',
    skills: {
      command: 'Command',
      deceive: 'Deceive',
      persuasion: 'Persuasion',
      willpower: 'Willpower',
    },
  },
  mechanical: {
    label: 'Mechanical',
    skills: {
      communication: 'Communication',
      navigation: 'Navigation',
      piloting: 'Piloting',
      useRepairMech: 'Use/Repair',
    },
  },
  technical: {
    label: 'Technical',
    skills: {
      computers: 'Computers',
      demolition: 'Demolition',
      upgrade: 'Upgrade',
      useRepairTech: 'Use/Repair',
    },
  },
};

export const DIFFICULTY_TABLE = [
  { dn: 5, label: 'Very Easy' },
  { dn: 10, label: 'Easy' },
  { dn: 15, label: 'Average' },
  { dn: 20, label: 'Difficult' },
  { dn: 25, label: 'Very Difficult' },
  { dn: 30, label: 'Extremely Difficult' },
  { dn: 35, label: 'Near Impossible' },
  { dn: 40, label: 'Mythical' },
];

export function getAllSkills() {
  const skills = [];
  for (const [attrKey, attr] of Object.entries(ATTRIBUTE_DEFINITIONS)) {
    for (const [skillKey, skillLabel] of Object.entries(attr.skills)) {
      skills.push({ attrKey, attrLabel: attr.label, skillKey, skillLabel });
    }
  }
  return skills;
}

export function getDicePool(character, attrKey, skillKey) {
  const attr = character.attributes[attrKey];
  if (!attr) return 0;
  const attrDice = attr.dice || 0;
  const skillDice = attr.skills[skillKey] || 0;
  return attrDice + skillDice;
}
