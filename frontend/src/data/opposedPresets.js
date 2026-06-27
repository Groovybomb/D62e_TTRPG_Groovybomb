import { ATTRIBUTE_DEFINITIONS, getDicePool } from './attributes';

export const OPPOSED_PRESETS = [
  // Combat — vs Static Defense
  {
    key: 'melee_attack',
    label: 'Melee Attack vs. Parry',
    category: 'Combat',
    attacker: { attr: 'agility', skill: 'melee' },
    defender: { type: 'static', stat: 'parry' },
  },
  {
    key: 'ranged_shooting',
    label: 'Shooting vs. Dodge',
    category: 'Combat',
    attacker: { attr: 'agility', skill: 'shooting' },
    defender: { type: 'static', stat: 'dodge' },
  },
  {
    key: 'ranged_throwing',
    label: 'Throwing vs. Dodge',
    category: 'Combat',
    attacker: { attr: 'brawn', skill: 'throwing' },
    defender: { type: 'static', stat: 'dodge' },
  },
  {
    key: 'ranged_gunnery',
    label: 'Gunnery vs. Dodge',
    category: 'Combat',
    attacker: { attr: 'perception', skill: 'gunnery' },
    defender: { type: 'static', stat: 'dodge' },
  },
  {
    key: 'damage_vs_resist',
    label: 'Damage vs. Resistance',
    category: 'Combat',
    attacker: { type: 'damage' },
    defender: { attr: 'brawn', skill: 'resistance' },
  },

  // Social
  {
    key: 'intimidate',
    label: 'Intimidation vs. Willpower',
    category: 'Social',
    attacker: { attr: 'brawn', skill: 'intimidation' },
    defender: { attr: 'charm', skill: 'willpower' },
  },
  {
    key: 'deceive',
    label: 'Deceive vs. Investigation',
    category: 'Social',
    attacker: { attr: 'charm', skill: 'deceive' },
    defender: { attr: 'perception', skill: 'investigation' },
  },
  {
    key: 'persuade',
    label: 'Persuasion vs. Willpower',
    category: 'Social',
    attacker: { attr: 'charm', skill: 'persuasion' },
    defender: { attr: 'charm', skill: 'willpower' },
  },
  {
    key: 'command',
    label: 'Command vs. Willpower',
    category: 'Social',
    attacker: { attr: 'charm', skill: 'command' },
    defender: { attr: 'charm', skill: 'willpower' },
  },

  // Skill vs. Skill
  {
    key: 'stealth',
    label: 'Stealth vs. Investigation',
    category: 'Skill',
    attacker: { attr: 'perception', skill: 'stealth' },
    defender: { attr: 'perception', skill: 'investigation' },
  },
  {
    key: 'sleight',
    label: 'Sleight of Hand vs. Investigation',
    category: 'Skill',
    attacker: { attr: 'agility', skill: 'slightOfHand' },
    defender: { attr: 'perception', skill: 'investigation' },
  },
  {
    key: 'grapple',
    label: 'Athletics vs. Athletics',
    category: 'Skill',
    attacker: { attr: 'brawn', skill: 'athletics' },
    defender: { attr: 'brawn', skill: 'athletics' },
  },
];

export function getStaticDefense(character, stat) {
  if (stat === 'dodge') {
    const percDice = character.attributes?.perception?.dice || 2;
    let dodge = percDice * 5;
    if (character.stunState === 'prone') dodge = percDice * 5 + 10;
    return { value: dodge, label: 'Dodge' };
  }
  if (stat === 'parry') {
    const agiDice = character.attributes?.agility?.dice || 2;
    let parry = agiDice * 5;
    if (character.stunState === 'prone') parry = Math.min(parry, 10);
    return { value: parry, label: 'Parry' };
  }
  return { value: 0, label: stat };
}

export function getSkillLabel(attrKey, skillKey) {
  const attr = ATTRIBUTE_DEFINITIONS[attrKey];
  if (!attr) return skillKey;
  return `${attr.skills[skillKey] || skillKey} (${attr.label})`;
}

export function getDefenderDicePool(character, attrKey, skillKey) {
  return getDicePool(character, attrKey, skillKey);
}

export function determineWinner(initiatorTotal, defenderTotal, initiatorIsNPC, defenderIsNPC) {
  if (initiatorTotal > defenderTotal) return 'initiator';
  if (defenderTotal > initiatorTotal) return 'defender';
  // Tie: PC wins over NPC
  if (!initiatorIsNPC && defenderIsNPC) return 'initiator';
  if (initiatorIsNPC && !defenderIsNPC) return 'defender';
  return 'tie';
}
