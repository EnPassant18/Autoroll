# REQUIRED
# on hit effects
# repeating saving throws
# prompt for filenames
# special traits (lucky, improved critical)

# EXTRA
# automatic resistance
# help command
# history, undo, redo
# ignore caps
# multiple combatants with same name
# unit tests

import yaml
import random
import re
import copy

def validateCombatant(combatant):
    try:
        for field in ['name', 'type', 'hp', 'ac', 'init', 'saves', 'actions']:
            assert field in combatant, f'Missing field: {field}'
        assert isinstance(combatant['name'], str), 'Invalid field value: name'
        assert combatant['type'] in ['player', 'monster'], 'Invalid field value: type'
        assert isinstance(combatant['hp'], int), 'Invalid field value: hp'
        assert isinstance(combatant['ac'], int), 'Invalid field value: ac'
        assert isinstance(combatant['init'], int), 'Invalid field value: init'
        assert isinstance(combatant['saves'], dict), 'Invalid field value: saves'
        assert isinstance(combatant['actions'], dict), 'Invalid field value: saves'
        for field in ['str', 'dex', 'con', 'int', 'wis', 'cha']:
            assert field in combatant['saves'], f'Missing subfield: saves-{field}'
            assert isinstance(combatant['saves'][field], int), f'Invalid subfield: saves-{field}'
        for actionName, action in combatant['actions'].items():
            assert 'type' in action, f'Missing subfield: actions-{actionName}-type'
            assert 'damage' in action, f'Missing subfield: actions-{actionName}-damage'
            action['damage'] = parseDiceString(str(action['damage']))
            assert action['damage'], f'Invalid subfield: actions-{actionName}-damage'
            if 'options' in action:
                assert isinstance(action['options'], list), f'Invalid subfield: actions-{actionName}-options'
            else:
                action['options'] = []
            if action['type'] == 'attack':
                assert 'modifier' in action, f'Missing subfield: actions-{actionName}-modifier'
                assert isinstance(action['modifier'], int), f'Invalid subfield: actions-{actionName}-modifier'
            elif action['type'] == 'save':
                for field in ['dc', 'save_type']:
                    assert field in action, f'Missing subfield: actions-{actionName}-{field}'
                assert isinstance(action['dc'], int), f'Invalid subfield: actions-{actionName}-dc'
                assert action['save_type'] in ['str', 'dex', 'con', 'int', 'wis', 'cha'], f'Invalid subfield: actions-{actionName}-save_type'
        return 'valid'
    except AssertionError as e:
        return e
        
def rollDice(sides, quantity):
    return sum([random.randint(1, sides) for i in range(quantity)])

def rollDiceArray(array, critical=False):
    if critical:
        if array[-1][0] == 1:
            return sum([rollDice(dice[0], dice[1]) for dice in array[:-1] + array[:-1]]) + array[-1][1]
        else:
            return sum([rollDice(dice[0], dice[1]) for dice in array + array])
    else:
        return sum([rollDice(dice[0], dice[1]) for dice in array])

def d20(adv = False, dis = False):
    assert not (adv and dis)
    if adv: return max(random.randint(1, 20), random.randint(1, 20))
    elif dis: return min(random.randint(1, 20), random.randint(1, 20))
    else: return random.randint(1, 20)

def printState(space):
    output = '\n\n\n\n\n' if space else ''
    output += '----------------------------------------------------\n'
    for i in range(len(order)):
        name = order[i]
        hp = str(combatants[name]['hp'])
        spaces = 50 - len(name + hp)
        conditions = '' if len(combatants[name]['conditions']) == 0 else str(combatants[name]['conditions'])
        if i == turn:
            output += 'NOW UP: '
            spaces -= 8
        output += name + (' ' * spaces) + hp + 'hp ' + conditions + '\n'
    output += '----------------------------------------------------\n'
    output += 'It is now ' + order[turn] + '\'s turn. '
    if len(combatants[order[turn]]['conditions']) != 0:
        output += order[turn] + ' has the following conditions: ' + str(combatants[order[turn]]['conditions'])
    output += '\nAvailable actions: ' + str([action for action in combatants[order[turn]]['actions']]) 
    print(output)

def parseDiceString(string):
    if not re.match("^(([0-9]+)d([0-9]+) *\\+ *)*([0-9]+)(d([0-9]+))?$", string):
        return False
    parsedGroups = []
    for group in string.replace(' ', '').split('+'):
        splitGroup = group.split('d')
        if len(splitGroup) == 1:
            parsedGroups.append([1, int(splitGroup[0])])
        else:
            parsedGroups.append([int(splitGroup[1]), int(splitGroup[0])])
    return parsedGroups

def onChangeHp(target, amount):
    target['hp'] += amount
    if target['hp'] <= 0:
        if target['type'] == 'player':
            target['conditions'].add('dying')
            print(target['name'] + ' is dying!')
        else:
            removed.append(order.pop(order.index(target['name'])))
            print(target['name'] + ' has been slain!')
    elif 'dying' in target['conditions']:
        target['conditions'].remove('dying')
        print(target['name'] + ' is no longer dying!')

def execAction(command):
    action = combatants[order[turn]]['actions'][command[0]]
    targets = []
    options = []
    repetitions = 1
    for arg in command[1:]:
        if arg in order:
            targets.append(combatants[arg])
        elif arg in ['adv', 'dis', 'res', 'vul']:
            options.append(arg)
        elif re.match('^x[0-9]+$', arg):
            repetitions = int(arg[1:])
        else:
            print(f'ERROR - invalid argument: {arg}. Correct usage: [actionName] [targetName] [...otherTargetNames] [...options]')
            return
    if len(targets) == 0:
        print('ERROR. No targets supplied.')
        return
    if len(command) != len(set(command)):
        print('ERROR. Multiple copies of an argument are not allowed.')
        return
    if ('adv' in options) and ('dis' in options):
        print("ERROR. Options 'adv' and 'dis' not allowed together.")
        return
    if ('res' in options) and ('vul' in options):
        print("ERROR. Options 'res' and 'vul' not allowed together.")
        return

    for i in range(repetitions):
        for target in targets:
            if target['name'] in order:
                damage = 0
                if action['type'] == 'attack':
                    toHit = d20('adv' in options, 'dis' in options)
                    if toHit == 20:
                        damage = rollDiceArray(action['damage'], True)
                        print('CRITICAL HIT! ' + target['name'] + f' was dealt {damage} damage by the {command[0]}!')
                    elif toHit + action['modifier'] >= target['ac']:
                        damage = rollDiceArray(action['damage'])
                        print(target['name'] + f' was dealt {damage} damage by the {command[0]}!')
                    else:
                        print(f'The {command[0]} missed!')
                elif action['type'] == 'save':
                    if d20('adv' in options, 'dis' in options) + target['saves'][action['save_type']] < action['dc']:
                        damage = rollDiceArray(action['damage'])
                        print(target['name'] + f' failed the saving throw and was dealt {damage} damage by the {command[0]}!')
                    elif 'half_on_succeed' in action['options']:
                        damage = rollDiceArray(action['damage']) // 2
                        print(target['name'] + f' passed the saving throw but was still dealt {damage} damage by the {command[0]}!')
                    else:
                        print(target['name'] + f' passed the saving throw!')
                if ('res' in options): damage //= 2
                elif ('vul' in options): damage *= 2
                onChangeHp(target, -damage)

def nextTurn(_):
    global turn
    turn += 1
    if turn == len(combatants): turn = 0
    printState(True)

def hp(command):
    if len(command) < 3:
        print('ERROR. Correct usage: hp [targetName] [newHpAmount OR +hpToAdd OR -hpToSubtract]')
        return
    if not command[1] in order:
        print('ERROR. Invalid target: ' + command[1])
        return
    target = combatants[command[1]]
    if re.match("^[0-9]+$", command[2]):
        hpChange = int(command[2]) - target['hp']
    elif re.match("^(\+|-)[0-9]+$", command[2]):
        hpChange = int(command[2])
    else:
        print('ERROR. Hp amount must be positive integer or of the form +X or -X')
        return
    print(target['name'] + "'s hp set to " + str(target['hp'] + hpChange))
    onChangeHp(target, hpChange)

def status(_):
    printState(False)

def reorder(command):
    try:
        fromIndex = order.index(command[1])
        toIndex = int(command[2]) - 1
        assert 0 <= toIndex < len(order)
        order.insert(toIndex, order.pop(fromIndex))
        printState(True)
    except (IndexError, ValueError):
        print('ERROR. Correct usage: swap [target] [newPosition]. (Positions start from 1.)')
    except AssertionError:
        print('ERROR. Position out of bounds. (Positions start from 1).')
        
def setTurn(command):
    global turn
    try:
        turn = order.index(command[1])
        print(turn)
        printState(True)
    except ValueError:
        print('ERROR. Invalid target: ' + command[1])
    except IndexError:
        print('ERROR. Correct usage: turn [target]')

def remove(command):
    if len(command) < 2:
        print('ERROR. Correct usage: remove [target]')
        return
    if not command[1] in order:
        print('ERROR. Invalid target: ' + command[1])
        return
    removed.append(order.pop(order.index(command[1])))
    printState(True)

def restore(command):
    try:
        order.append(removed.pop(removed.index(command[1])))
        order.sort(key = lambda n: -combatants[n]['order'])
        combatants[command[1]]['hp'] = int(command[2]) if len(command) > 2 else 1
        printState(True)
    except Exception:
        print('ERROR. Correct usage: restore [target] [hp?]')

def condition(command):
    try:
        conditions = combatants[command[1]]['conditions']
        if command[2] in conditions:
            conditions.remove(command[2])
            print(f'{command[1]} is no longer {command[2]}!')
        else:
            conditions.add(command[2])
            print(f'{command[1]} is now {command[2]}!')
    except Exception:
        print('ERROR. Correct usage: condition [target] [condition]')




# EXECUTION STARTS HERE

combatantFiles = {"monsters/monster.yaml": 3, "players/player.yaml": 1}
combatants = {}
filesAreValid = True
turn = 0
commands = {
    'next': nextTurn, 'hp': hp, 'status': status,
    'reorder': reorder, 'remove': remove, 'restore': restore,
    'condition': condition, 'turn': setTurn
}
removed = []

# Read in player, monster stats
for combatantFile, quantity in combatantFiles.items():
    combatant = yaml.load(open(combatantFile).read())
    combatant['conditions'] = set()
    validationMessage = validateCombatant(combatant)
    if not validationMessage == 'valid':
        print(f'Error in file {combatantFile}: {validationMessage}')
        filesAreValid = False
        break
    if quantity == 1:
        combatants[combatant['name']] = combatant
    else:
        for i in range(quantity):
            combatantI = copy.deepcopy(combatant)
            combatantI['name'] += f'_{i+1}'
            combatants[combatantI['name']] = combatantI

def resume():
    printState(True)
    while True:
        command = input('Action: ').split(' ')
        try:
            if command[0] in combatants[order[turn]]['actions']:
                execAction(command)
            elif command[0] in commands:
                commands[command[0]](command)
            else:
                print('ERROR - invalid command: ' + command[0])
        except Exception as e:
            raise e #print('ERROR executing command: ' + str(e))
        
if filesAreValid:
    # Roll initiative
    for combatant in combatants.values():
        combatant['order'] = d20() + combatant['init'] + random.random()
    order = [name for name in combatants]
    order.sort(key = lambda n: -combatants[n]['order'])
    # Start combat loop
    resume()
    
