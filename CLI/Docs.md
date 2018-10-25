Autoroll: Dungeons and Dragons encounter automation tool

# Purpose
D&D combat mechanics are complex, involving countless different dice types, modifiers, ACs, and DCs. This complexity interrupts the flow of the game and makes combat a slow, boring affair. Autoroll tracks the statistics and health of every player and monster, instantly determines the results of attacks and saving throws, and calculates and assess any damage suffered. Autoroll takes care of the rules, so you can get back to having fun with your friends!

# Functionality
- Autoroll is a command-line interface operated by (and only visible to) the DM.
- The DM creates YAML (a simple markup language) files describing the stats, attacks, and spells of players and monsters.
- Autoroll rolls initiative for each combatant and determines the turn order.
- For each combatant, the DM enters which attack(s) and spell(s) they use, and at which target(s). Autoroll determines and records the outcome of the attack/spell.


# Combatant markup

## Required fields
name: [string] (must be UNIQUE for all combatants)
type: [string] (player | monster)
hp: [int]
ac: [int]
init: [int] (the initiative modifier)
saves: (the combatant's SAVING THROW modifiers must be subfields of this field)
  str, dex, con, int, wis, cha: [int]
actions: (the attacks, spells, and other effects should be subfields of this field)
  [action1Name]:
    type: [string]
    [...otherActionFields]

## Action types and required fields
damage: [string] (must be of the form MdX+NdY+...+K)
options: [array of strings] (optional)
### attack
modifier: [int]
### save
dc: [int]
save_type: [string] (must be one of str, dex, con, int, wis, cha)
options:
- half_on_succeed

# Commands

## next
End the current combatant's turn, proceeding to the next combatant.

## hp [targetName] [newHpAmount OR +hpToAdd OR -hpToSubtract]
Set or modify the hp of a target combatant.

## status
Print the combat status message (turn order, health of combatants, etc.).

## reorder [target] [newPosition]
Change the positions of a given combatant (position indeces start at 1).

## turn [target]
Advances combat to the turn of the target combatant.

## remove [target]
Remove a combatant from combat.

## restore [target] [hp?]
Return a removed combatant to combat with the given amount of hp. If the hp argument is omitted, the target will have 1 hp.

## [actionName] [targetName] [...otherTargetNames] [...options]
Use an attack/spell of the active combatant against the given target(s).
### Options
adv/dis: advantage or disadvantage
res/vul: resistance or vulnerability to effect damage
xN: repeat the action N times (against the same targets with the same options)

## resume()
If the program crashes or stops for any reason, enter 'resume()' to resume combat in the same state.
