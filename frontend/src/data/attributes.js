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
      resistance: 'Resistance',
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

export const ADVANCED_SKILL_DEFINITIONS = {
  jupiterDrive: {
    label: 'Jupiter Drive',
    baseAttribute: 'mechanical',
    baseSkill: 'navigation',
  },
  surgery: {
    label: 'Surgery',
    baseAttribute: 'knowledge',
    baseSkill: 'medicine',
  },
  perform: {
    label: 'Perform',
    baseAttribute: 'charm',
    baseSkill: 'persuasion',
  },
  cryptography: {
    label: 'Cryptography',
    baseAttribute: 'technical',
    baseSkill: 'computers',
  },
};

export function getAdvancedDicePool(character, advancedKey) {
  const def = ADVANCED_SKILL_DEFINITIONS[advancedKey];
  if (!def) return 0;
  const advancedDice = character.advancedSkills?.[advancedKey] || 0;
  if (advancedDice === 0) return 0;
  const attr = character.attributes[def.baseAttribute];
  if (!attr) return 0;
  const baseSkill = parseSkillValue(attr.skills[def.baseSkill]);
  return advancedDice + baseSkill.dice + baseSkill.bonusDice + (attr.dice || 0);
}

export function getAllSkills() {
  const skills = [];
  for (const [attrKey, attr] of Object.entries(ATTRIBUTE_DEFINITIONS)) {
    for (const [skillKey, skillLabel] of Object.entries(attr.skills)) {
      skills.push({ attrKey, attrLabel: attr.label, skillKey, skillLabel });
    }
  }
  return skills;
}

export const SPECIAL_SKILLS = {
  resistance: { sourceField: 'armor', sourceLabel: 'Armor', skipWoundPenalty: true },
};

export function parseSkillValue(val) {
  if (typeof val === 'object' && val !== null) {
    return { dice: val.dice || 0, bonusDice: val.bonusDice || 0, bonusPips: val.bonusPips || 0 };
  }
  return { dice: val || 0, bonusDice: 0, bonusPips: 0 };
}

export function getSkillBonusPips(character, attrKey, skillKey) {
  const attr = character.attributes?.[attrKey];
  if (!attr) return 0;
  if (SPECIAL_SKILLS[skillKey]) return 0;
  return parseSkillValue(attr.skills?.[skillKey]).bonusPips;
}

export function getDicePool(character, attrKey, skillKey) {
  const attr = character.attributes[attrKey];
  if (!attr) return 0;
  const attrDice = attr.dice || 0;
  const special = SPECIAL_SKILLS[skillKey];
  if (special) {
    return attrDice + (character[special.sourceField] || 0);
  }
  const skill = parseSkillValue(attr.skills[skillKey]);
  return attrDice + skill.dice + skill.bonusDice;
}
