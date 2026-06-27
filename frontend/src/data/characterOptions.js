// Roll hint keys: attrs = attribute keys, skills = skill keys that trigger a reminder.
// 'any' in attrs means show on every roll for that attribute.

export const TALENTS = [
  { name: 'Ambidextrous', cost: 2, rank: false, effect: 'Reduce multi-action penalty by 1 for hand-related actions (one action per hand).', hints: { attrs: ['agility'], note: 'Reduce multi-action penalty by 1 (hand-related actions)' } },
  { name: 'Combat Sense', cost: 3, rank: false, effect: 'Cannot be surprised; always act first in initiative. Contested Perception roll if opponent also has this.', hints: { attrs: ['perception'], note: 'Act first in initiative (cannot be surprised)' } },
  { name: 'Endurance', cost: 1, rank: true, effect: '+3D per rank to Brawn checks for taxing physical activities (breath-holding, distance running, etc.).', hints: { attrs: ['brawn'], skills: ['stamina', 'athletics'], note: '+3D/rank to taxing physical Brawn checks' } },
  { name: 'Enhanced Sense', cost: 3, rank: true, effect: 'One sense heightened. Bonus per rank: sight +1, hearing +2, touch/taste/smell +3 to related skill rolls.', hints: { attrs: ['perception'], note: 'Enhanced Sense bonus to related Perception rolls' } },
  { name: 'Environmental Resistance', cost: 1, rank: true, effect: '+3D per rank to Brawn checks resisting environmental extremes (heat, cold, pressure). Does not protect vs. attacks.', hints: { attrs: ['brawn'], skills: ['stamina'], note: '+3D/rank to resist environmental extremes' } },
  { name: 'Fast Reactions', cost: 3, rank: true, effect: '+1 additional action per rank per round (with multi-action penalties). Once per adventure per rank.' },
  { name: 'Good Luck', cost: 2, rank: true, effect: 'Once per rank per adventure, reroll a single roll and keep the better result. +1 Hero Point per session.', hints: { attrs: ['any'], note: 'Good Luck: reroll and keep better (1/rank/adventure)' } },
  { name: 'Hardiness', cost: 2, rank: true, effect: '+1 per rank to Brawn damage resistance rolls. Max ranks cannot exceed Brawn die code.', hints: { attrs: ['brawn'], note: '+1/rank to Brawn damage resistance' } },
  { name: 'Increased Attribute', cost: 2, rank: true, effect: '+1 per rank to all rolled totals for one attribute. Brawn includes damage resistance and melee damage.', hints: { attrs: ['any'], note: '+1/rank to all totals for chosen attribute (check which)' } },
  { name: 'Iron Will', cost: 2, rank: false, effect: '+2D to Knowledge rolls to resist social manipulation, mental attacks, mind-altering influences, and psionic attacks.', hints: { attrs: ['knowledge'], skills: ['willpower'], note: '+2D to resist mental/social manipulation' } },
  { name: 'Longevity', cost: 3, rank: false, effect: 'Character lives longer than normal. Peripheral bonuses from longer outlook.' },
  { name: 'Master of Disguise', cost: 3, rank: false, effect: '+2D bonus to disguise, hide, deceive, and mislead social rolls.', hints: { attrs: ['charm', 'perception'], skills: ['deceive', 'stealth'], note: '+2D to disguise, hide, deceive, mislead' } },
  { name: 'Poison & Disease Resistance', cost: 1, rank: true, effect: '+1D per rank to Brawn checks vs. illness and poison contraction.', hints: { attrs: ['brawn'], skills: ['stamina'], note: '+1D/rank to resist poison/disease' } },
  { name: 'Sense of Direction', cost: 2, rank: true, effect: '+1D per rank to navigation and search rolls.', hints: { attrs: ['mechanical', 'perception'], skills: ['navigation', 'investigation'], note: '+1D/rank to navigation and search' } },
  { name: 'Skill Bonus', cost: 1, rank: true, effect: '+1 per rank to totals for a group of 3 related skills.' },
  { name: 'Skill Minimum', cost: 4, rank: false, effect: 'Minimum result of 3× die code number for 3 related skills (e.g., 4D = minimum 12).' },
  { name: 'Stealthy', cost: 3, rank: true, effect: '+2D per rank to sneak checks, +1D per rank when attacking unaware opponents.', hints: { attrs: ['perception', 'agility'], skills: ['stealth'], note: '+2D/rank to sneak, +1D/rank attacking unaware' } },
  { name: 'Uncanny Aptitude', cost: 3, rank: false, effect: '+1 bonus to certain actions in specific circumstances (define trigger when taken).' },
  { name: 'Ventriloquism', cost: 3, rank: true, effect: 'Throw voice up to 3m per rank. +2D per rank to trick-related rolls.', hints: { attrs: ['charm'], skills: ['deceive', 'persuasion'], note: '+2D/rank to trick-related rolls' } },
  { name: 'Youthful Appearance', cost: 1, rank: true, effect: '+1D per rank to appropriate social rolls. Appear 10-20 years younger.', hints: { attrs: ['charm'], note: '+1D/rank to social rolls (youthful appearance)' } },
];

export const PERKS = [
  { name: 'Authority', rank: true, effect: 'Legal, social, or religious power over others. Higher ranks = wider jurisdiction and more influence.', hints: { attrs: ['charm'], skills: ['command', 'persuasion', 'intimidation'], note: 'Authority may grant bonuses to social/command rolls' } },
  { name: 'Contacts', rank: true, effect: 'Know someone who will help. R1-R2 = limited contacts; R3 = far-reaching group; R4 = guardian-angel force.' },
  { name: 'Equipment', rank: true, effect: 'Rare, expensive, or unavailable equipment. Higher ranks = more powerful/bizarre items.' },
  { name: 'Fame', rank: true, effect: 'Well-known. Roll 3D+rank, 15+ = recognized. +1D on social rolls when recognized. Higher ranks = wider recognition.', hints: { attrs: ['charm'], note: '+1D to social rolls if recognized (Fame)' } },
  { name: 'Patron', rank: true, effect: 'Financial backing. R1 = funded expedition; R2 = expenses covered; R3 = stipend + expenses.' },
  { name: 'Size', rank: true, effect: 'Larger: +1D per rank to push/shove/grapple. Smaller: +1 per rank to Dodge defense and Stealth.', hints: { attrs: ['brawn', 'perception'], skills: ['athletics', 'stealth'], note: 'Size bonus may apply (larger: +1D/rank grapple; smaller: +1 Dodge/Stealth)' } },
  { name: 'Trademark Specialization', rank: false, effect: '+2D bonus (instead of +1D) when using one specific specialization. Max 2 per character.', hints: { attrs: ['any'], note: '+2D if using your Trademark Specialization' } },
  { name: 'Wealth', rank: true, effect: '+1D per rank to purchase rolls and social rolls with wealthy people.', hints: { attrs: ['charm'], note: '+1D/rank to purchase and social rolls with wealthy' } },
];

export const FLAWS = [
  { name: 'Achilles\' Heel', rank: true, effect: 'Serious weakness (allergy, vulnerability, metabolic difference). Severity increases with rank.' },
  { name: 'Age', rank: true, effect: 'Too young or too old. -1D per rank on age-inappropriate actions.' },
  { name: 'Bad Luck', rank: true, effect: 'GM can force reroll of successful rolls X times per session (X = rank). Spend Hero Points equal to rank to avoid.', hints: { attrs: ['any'], note: 'Bad Luck: GM may force a reroll', isWarning: true } },
  { name: 'Burnout', rank: true, effect: 'A perk permanently goes away under specific circumstances.' },
  { name: 'Debt', rank: true, effect: 'Owes money/favors. R1 = difficult credit; R2 = dangerous obligation; R3 = owes almost everything.' },
  { name: 'Devotion', rank: true, effect: 'Compelled to act on loyalty, honor code, or duty. Higher ranks = more all-consuming devotion.' },
  { name: 'Employed', rank: true, effect: 'Job with responsibilities that may conflict with adventures. Higher rank = less freedom.' },
  { name: 'Enemy', rank: true, effect: 'Individual or group opposed to you. Higher rank = more powerful/frequent enemy.' },
  { name: 'Hindrance', rank: true, effect: 'Minor drawback: -1 per rank to affected rolls. Can reduce movement by 2m per rank.', hints: { attrs: ['any'], note: 'Hindrance: -1/rank to affected rolls', isWarning: true } },
  { name: 'Infamy', rank: true, effect: 'Known for negative reasons. -1D per rank on social rolls. Higher ranks = hostility, violence.', hints: { attrs: ['charm'], note: 'Infamy: -1D/rank on social rolls if recognized', isWarning: true } },
  { name: 'Language Problems', rank: false, effect: '+6 difficulty to communication. Max 1 pip in local language at start; +2 improvement cost.' },
  { name: 'Learning Problems', rank: true, effect: '+2 per rank to cost for improving skills under one attribute.' },
  { name: 'Poverty', rank: false, effect: 'Start with minimal possessions. Only at R1.' },
  { name: 'Perk Flaw', rank: true, effect: 'Negative modifier or complication linked to a specific perk. R3 = perk negated.' },
  { name: 'Price', rank: true, effect: 'Cost attached to using a perk — must be paid multiple times per adventure or perk goes away.' },
  { name: 'Quirk', rank: true, effect: 'Personality quirk (dependency, kleptomania, indecision, etc.) that makes interactions harder.' },
  { name: 'Reduced Attribute', rank: false, effect: 'One attribute permanently set at 1D; cannot be increased through normal advancement.' },
];

export const CYBERNETICS = [
  { name: 'Accelerated Healing', cost: 4, rank: false, effect: '+3D to Medicine rolls on this character. Can roll Brawn+3D vs 20 to downgrade wound level at end of turn.', hints: { attrs: ['brawn'], skills: ['stamina'], note: '+3D to healing rolls; Brawn+3D vs 20 to downgrade wounds' } },
  { name: 'Animal Control', cost: 3, rank: true, effect: '+3D to Survival for one species. Successful roll = animal follows orders for minutes equal to Survival die×10.', hints: { attrs: ['perception'], skills: ['survival'], note: '+3D to Survival for controlled species' } },
  { name: 'Armor Piercing Attack', cost: 2, rank: true, effect: 'Natural/built-in weapon negates up to +1D per rank of target\'s armor on damage resistance.' },
  { name: 'Atmospheric Tolerance', cost: 2, rank: false, effect: 'Breathe one specific non-standard atmosphere (toxic gas, underwater, etc.).' },
  { name: 'Attack Resistance', cost: 2, rank: true, effect: '+1D per rank to resist one damage type: Energy, Mystical, or Mental attacks.', hints: { attrs: ['brawn'], note: '+1D/rank to resist specific damage type' } },
  { name: 'Blur', cost: 3, rank: false, effect: 'Appear indistinct. +1 Dodge/Parry defense, -1D penalty on Perception rolls against you. -1D to your social rolls while active.', hints: { attrs: ['agility', 'charm'], note: 'Blur: +1 Dodge/Parry, but -1D social rolls if active' } },
  { name: 'Confusion', cost: 4, rank: true, effect: 'On touch: target confused for 2×rank rounds (-1D all rolls, no Hero Points, no rerolls). Opposed by Knowledge.' },
  { name: 'Darkness', cost: 3, rank: true, effect: 'Project darkness field: -1D per rank to ranged attacks and sight-based Perception. Radius 1m per rank, lasts 1 min per rank.' },
  { name: 'Elasticity', cost: 1, rank: true, effect: 'Stretch/compress body through small openings. +1 per rank to Dodge, +1D per rank to disguise.', hints: { attrs: ['agility'], note: '+1/rank to Dodge; +1D/rank to disguise' } },
  { name: 'Energy Ranged Weapon', cost: 3, rank: true, effect: 'Built-in energy weapon. Range 20×rank×Brawn meters. Damage 3D + 1D per rank.' },
  { name: 'Extra Body Part', cost: 0, rank: false, effect: 'Extra limb or organ. Nonfunctional unless enhanced by other abilities.' },
  { name: 'Extra Sense', cost: 1, rank: true, effect: 'Detect something humans can\'t (radiation, seismic, pressure). +1D per rank to search/investigation for that stimulus.', hints: { attrs: ['perception'], skills: ['investigation'], note: '+1D/rank to search/investigation for detected stimulus' } },
  { name: 'Fear', cost: 2, rank: true, effect: 'Provoke fear in 10m per rank radius. Targets fail Knowledge vs 15: -1 per rank penalty to all rolls for rank rounds.', hints: { attrs: ['charm'], skills: ['intimidation'], note: 'Fear: targets in range -1/rank to all rolls on failed Knowledge vs 15' } },
  { name: 'Flight', cost: 6, rank: true, effect: 'Fly at Move×2×rank speed. Gain 1D Flying skill.' },
  { name: 'Glider Wings', cost: 3, rank: false, effect: 'Glide on air currents. Speed depends on wind. Gain 1D Flying skill.' },
  { name: 'Immortality', cost: 7, rank: false, effect: 'Cannot die from mortal wounds (exist in pain). One specific method causes permanent death.' },
  { name: 'Infravision/Ultravision', cost: 1, rank: true, effect: '+2 per rank to sight-based Perception in dim/dark conditions.', hints: { attrs: ['perception'], note: '+2/rank to sight-based Perception in dim/dark' } },
  { name: 'Intangibility', cost: 5, rank: true, effect: 'Reduce density for 1 min per rank. +3D per rank damage resistance vs physical/energy. Half movement. Pass through solids.', hints: { attrs: ['brawn'], note: '+3D/rank damage resistance if intangible' } },
  { name: 'Invisibility', cost: 3, rank: true, effect: '+1 per rank to Dodge, Sneak, Hide totals. +1 per rank to difficulties for others to detect you.', hints: { attrs: ['agility', 'perception'], skills: ['stealth'], note: '+1/rank to Dodge, Sneak, Hide if invisible' } },
  { name: 'Life Drain', cost: 5, rank: false, effect: 'Drain attribute pips from target on hit (1 pip per rank per 4 over defense). Gain +1D per 3 pips drained.' },
  { name: 'Mental Defense', cost: 3, rank: true, effect: '+1D per rank to resist mental manipulation, possession, mind control.', hints: { attrs: ['knowledge'], skills: ['willpower'], note: '+1D/rank to resist mental manipulation/mind control' } },
  { name: 'Mental Suggestion', cost: 3, rank: true, effect: '+3D per rank to social manipulation rolls (deception, persuasion, intimidation).', hints: { attrs: ['charm'], skills: ['deceive', 'persuasion', 'intimidation'], note: '+3D/rank to social manipulation (deception, persuasion, intimidation)' } },
  { name: 'Multiple Abilities', cost: 1, rank: true, effect: 'Multiple minor bonuses to skill/attribute totals. Max +4 total bonus per rank spread across uses.' },
  { name: 'Natural Armor', cost: 3, rank: true, effect: '+1D per rank to damage resistance vs physical attacks, contact poisons, corrosives.', hints: { attrs: ['brawn'], note: '+1D/rank to damage resistance vs physical' } },
  { name: 'Natural Hand-to-Hand Weapon', cost: 2, rank: true, effect: '+1D per rank to Brawn damage in melee (claws, spikes, etc.).', hints: { attrs: ['brawn', 'agility'], skills: ['melee'], note: '+1D/rank to melee Brawn damage' } },
  { name: 'Natural Ranged Weapon', cost: 3, rank: true, effect: 'Ranged attack: range 20×rank×Brawn meters, damage Brawn + 1D per rank.', hints: { attrs: ['agility'], skills: ['shooting'], note: 'Natural Ranged Weapon: Brawn + 1D/rank damage' } },
  { name: 'Omnivorous', cost: 2, rank: false, effect: 'Gain nourishment from any organic substance. Can chew through any organic material.' },
  { name: 'Paralyzing Touch', cost: 4, rank: false, effect: 'On brawling hit: paralyze target until they succeed Knowledge/Willpower vs your brawling total.', hints: { attrs: ['agility', 'brawn'], skills: ['melee'], note: 'Paralyzing Touch: on brawling hit, target paralyzed' } },
  { name: 'Super-Speed', cost: 1, rank: true, effect: '+2m per rank to Move rate. +1 to Dodge/Parry per 3 ranks.', hints: { attrs: ['agility'], note: '+1 Dodge/Parry per 3 ranks (Super-Speed)' } },
  { name: 'Teleportation', cost: 3, rank: true, effect: 'Instantly move up to 10m per rank. Must see destination. Takes full round in combat.' },
  { name: 'Transmutation', cost: 5, rank: true, effect: 'Shift into one specific substance. Gain up to 4 points in other abilities per rank while transformed.' },
  { name: 'Water Breathing', cost: 2, rank: true, effect: '+1D per rank to swim rolls. Cannot drown.', hints: { attrs: ['brawn'], skills: ['athletics', 'stamina'], note: '+1D/rank to swim rolls' } },
];

export const WEAPONS = {
  'Blaster Weapons': [
    { name: 'Blaster Pocketgun', damage: '3D', ammo: '6', shortRange: '4m', mediumRange: '8m', longRange: '12m' },
    { name: 'Blaster Pistol', damage: '5D', ammo: '12', shortRange: '50m', mediumRange: '50m', longRange: '150m' },
    { name: 'Blaster Rifle', damage: '7D', ammo: '30', shortRange: '150m', mediumRange: '150m', longRange: '300m' },
  ],
  'Energy Weapons': [
    { name: 'Energy Pistol', damage: '5D', ammo: '20', shortRange: '25m', mediumRange: '25m', longRange: '40m' },
    { name: 'Energy Rifle', damage: '5D', ammo: '50', shortRange: '150m', mediumRange: '150m', longRange: '300m' },
  ],
  'Laser Weapons': [
    { name: 'Laser Pistol', damage: '4D', ammo: '15', shortRange: '90m', mediumRange: '90m', longRange: '180m' },
    { name: 'Laser Rifle', damage: '5D', ammo: '20', shortRange: '125m', mediumRange: '125m', longRange: '250m' },
  ],
  'Melee Weapons': [
    { name: 'Energized Longblade', damage: '+4D', ammo: '', shortRange: '', mediumRange: '', longRange: '2m reach, throwable' },
    { name: 'Nanoknife', damage: '+2D', ammo: '', shortRange: '', mediumRange: '', longRange: 'Throwable' },
    { name: 'Shockbaton', damage: '+2D', ammo: '', shortRange: '', mediumRange: '', longRange: 'Stun (staggers→stunned)' },
  ],
};

export const ITEMS = {
  'Armor': [
    { name: 'Nanoleather', description: '+1D armor protection', armorValue: 1 },
    { name: 'Nanomesh', description: '+1D+2 armor protection', armorValue: 1 },
    { name: 'EDA (Energy Dissipation Armor)', description: '+2D armor protection', armorValue: 2 },
    { name: 'Synthweave', description: '+3D armor protection', armorValue: 3 },
    { name: 'Plasarmor', description: '+3D armor protection', armorValue: 3 },
    { name: 'Heavy Synthweave', description: '+4D armor protection', armorValue: 4 },
  ],
  'Gear & Equipment': [
    { name: 'Enviro-suit', description: 'Sealed bodysuit + helmet; +2D Stamina vs. environment, counts as gas mask' },
    { name: 'Handcomp', description: 'Portable computer; +1D to Knowledge, Technical, or Mechanical skills' },
    { name: 'Binoculars', description: '+1D to sight-based rolls for distant objects' },
    { name: 'Cold Weather Gear', description: '+1D to Stamina vs. cold effects' },
    { name: 'Flashlight', description: 'Reduces darkness difficulty by 5-10' },
    { name: 'Gas Mask', description: '+2D to Stamina vs. gas attacks' },
    { name: 'Telescope', description: '+2D to sight-based rolls (3m+); 2 rounds to set up' },
    { name: 'Tool Kit', description: '+1D to repair/upgrade/construction rolls (requires appropriate skill)' },
    { name: 'Comlink / Headset', description: 'Hands-free communication; ~10km range' },
    { name: 'Medpac', description: 'First aid supplies; required for Medicine skill checks in the field' },
    { name: 'Crowbar', description: '+1D to prying open doors; doubles as club in combat' },
    { name: 'Shovel', description: '+1D to digging; doubles as club in combat' },
  ],
};

// Utility: get roll hints for a character given the attribute and skill being rolled
export function getRollHints(character, attrKey, skillKey) {
  const hints = [];
  const allSources = [
    ...(character.talents || []).map(t => ({ ...t, source: 'Talent', type: 'talents' })),
    ...(character.perks || []).map(p => ({ ...p, source: 'Perk', type: 'perks' })),
    ...(character.flaws || []).map(f => ({ ...f, source: 'Flaw', type: 'flaws' })),
    ...(character.cybernetics || []).map(c => ({ ...c, source: 'Cybernetic', type: 'cybernetics' })),
  ];

  const ALL_REFS = { talents: TALENTS, perks: PERKS, flaws: FLAWS, cybernetics: CYBERNETICS };

  for (const item of allSources) {
    const refList = ALL_REFS[item.type];
    const ref = refList?.find(r => r.name.toLowerCase() === item.name?.toLowerCase());
    if (!ref?.hints) continue;

    const h = ref.hints;
    const attrMatch = h.attrs?.includes('any') || h.attrs?.includes(attrKey);
    const skillMatch = h.skills?.includes(skillKey);

    if (attrMatch || skillMatch) {
      const rankStr = item.rank ? ` (Rank ${item.rank})` : '';
      hints.push({
        name: item.name + rankStr,
        source: item.source,
        note: h.note,
        isWarning: !!h.isWarning,
      });
    }
  }
  return hints;
}
