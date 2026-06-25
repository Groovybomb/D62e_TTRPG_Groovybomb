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
