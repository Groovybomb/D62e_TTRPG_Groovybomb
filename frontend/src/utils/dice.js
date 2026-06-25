export function rollDice(count) {
  const results = [];

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // Wild die - can explode on 6
      const wildRolls = [];
      let roll = Math.floor(Math.random() * 6) + 1;
      wildRolls.push(roll);
      while (roll === 6) {
        roll = Math.floor(Math.random() * 6) + 1;
        wildRolls.push(roll);
      }
      results.push({ value: wildRolls.reduce((a, b) => a + b, 0), isWild: true, rolls: wildRolls, exploded: wildRolls.length > 1, rawFirst: wildRolls[0] });
    } else {
      const roll = Math.floor(Math.random() * 6) + 1;
      results.push({ value: roll, isWild: false, rolls: [roll], exploded: false, rawFirst: roll });
    }
  }

  return results;
}

export function rollPlainDice(count) {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * 6) + 1);
  }
  return results;
}

export function evaluateGMRollOutcome(total, wildDie, dcValue) {
  const beat = total > dcValue;
  const rawFirst = wildDie?.rawFirst;
  const exploded = wildDie?.exploded || false;

  let neededExplosion = false;
  if (exploded && beat) {
    const explosionBonus = wildDie.value - 6;
    const totalWithout = total - explosionBonus;
    neededExplosion = totalWithout <= dcValue;
  }

  if (beat && rawFirst === 1) {
    return {
      outcome: 'PARTIAL_SUCCESS',
      heroPointDelta: 1,
      hasChoice: true,
      choiceType: 'wild1_beat',
      neededExplosion: false,
      complication: true,
    };
  }

  if (beat && rawFirst === 6) {
    return {
      outcome: 'PENDING_CHOICE',
      heroPointDelta: 0,
      hasChoice: true,
      choiceType: 'wild6_beat',
      neededExplosion,
      complication: false,
    };
  }

  if (beat) {
    return {
      outcome: 'SUCCESS',
      heroPointDelta: 0,
      hasChoice: false,
      choiceType: null,
      neededExplosion: false,
      complication: false,
    };
  }

  if (!beat && rawFirst === 1) {
    return {
      outcome: 'CRITICAL_FAIL',
      heroPointDelta: 1,
      hasChoice: false,
      choiceType: null,
      neededExplosion: false,
      complication: true,
    };
  }

  return {
    outcome: 'FAIL',
    heroPointDelta: 0,
    hasChoice: false,
    choiceType: null,
    neededExplosion: false,
    complication: false,
  };
}

export function calculateTotal(diceResults) {
  const wildDie = diceResults[0];
  const otherDice = diceResults.slice(1);

  if (wildDie && wildDie.rawFirst === 1) {
    // Wild die rolled 1: complication
    // Wild die counts as 0, remove highest other die
    const sorted = [...otherDice].sort((a, b) => b.value - a.value);
    const removed = sorted.length > 0 ? sorted[0].value : 0;
    const otherTotal = otherDice.reduce((sum, d) => sum + d.value, 0) - removed;
    return { total: Math.max(0, otherTotal), complication: true, removedDie: removed };
  }

  const total = diceResults.reduce((sum, d) => sum + d.value, 0);
  return { total, complication: false, removedDie: null };
}
