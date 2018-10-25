import { rollDice } from './random.js';

let combatants = [];

export function startEncounter(encounter) {
  Object.entries(encounter).forEach(([combatantId, combatantStats]) => {
    if (combatantStats.quantity) {
      for (let i = 0; i < combatantStats.quantity; i++) {
        combatants.push({
          id: combatantId + `-${i}`,
          name: combatantStats.name +  ` #${i+1}`,
          currentHp: combatantStats.hp,
          order: rollDice(20, 1) + combatantStats.init + Math.random(),
          ...combatantStats
        })
      }
    } else {
      combatants.push({
        id: combatantId,
        currentHp: combatantStats.hp,
        order: rollDice(20, 1) + combatantStats.init + Math.random(),
        ...combatantStats
      })
    }
  });
  combatants.sort((a, b) => b.order - a.order);
}
