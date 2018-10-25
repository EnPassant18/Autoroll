import renderer, { onSelectAttackType } from './renderer.js';
import { createId } from './random.js';
import { startEncounter } from './encounter.js';

let players, monsters, editingId, editingType;
let encounter = {};

$(document).ready(() => {
  players = JSON.parse(localStorage.getItem('players') || '[]');
  monsters = JSON.parse(localStorage.getItem('monsters') || '[]');
  for (let player of players) {
    renderer.appendPlayer(player.id, player.name);
  }
  for (let monster of monsters) {
    renderer.appendMonster(monster.id, monster.name);
  }
  $('#form').submit(submitForm);
  $('#add-player').click(() => addPlayerOrMonster('player'));
  $('#add-monster').click(() => addPlayerOrMonster('monster'));
  $('#player-list').on('click', '.to-encounter-button', event => addPlayerToEncounter(event.target.parentElement.id));
  $('#player-list').on('click', '.edit-button', event => editPlayerOrMonster(event.target.parentElement.id, 'player'));
  $('#player-list').on('click', '.delete-button', event => deletePlayer(event.target.parentElement.id));
  $('#monster-list').on('click', '.to-encounter-button', event => addMonsterToEncounter(event.target.parentElement.id));
  $('#monster-list').on('click', '.edit-button', event => editPlayerOrMonster(event.target.parentElement.id, 'monster'));
  $('#monster-list').on('click', '.delete-button', event => deleteMonster(event.target.parentElement.id));
  $('#add-attack').click(() => renderer.addAttack());
  $('#attack-list').on('change', '.attack-type-select', event =>
    onSelectAttackType(event.target.value, event.target.id.substring(7, 19)));
  $('#attack-list').on('click', '.attack-delete-button', event => event.currentTarget.parentElement.parentElement.remove());
  $('#encounter-list').on('click', '.encounter-plus-button', event => editMonsterInEncounter(event.currentTarget.parentElement.id.substring(10), true, console.log(event)));
  $('#encounter-list').on('click', '.encounter-minus-button', event => editMonsterInEncounter(event.currentTarget.parentElement.id.substring(10), false));
  $('#encounter-list').on('click', '.encounter-delete-button', event => deleteFromEncounter(event.target.parentElement.id.substring(10)));
  $('#encounter-start').click(() => startEncounter(encounter));
});

function submitForm(event) {
  event.preventDefault();

  const values = { attacks: {}, id: editingId || createId() };
  const rawValues = event.target;
  for (let rawValue of rawValues) {
    if ((rawValue.tagName === 'INPUT' || rawValue.tagName === 'SELECT') && rawValue.value !== '') {
      if (rawValue.id.startsWith('attack')) {
        const attackId = rawValue.id.substring(7, 19);
        const prop = rawValue.id.substring(20);
        if (values.attacks[attackId]) {
          values.attacks[attackId][prop] = rawValue.value;
        } else {
          values.attacks[attackId] = { [prop]: rawValue.value };
        }
      } else {
        values[rawValue.id] = rawValue.value;
      }
    }
  }

  if (editingType === 'player') {
    if (!editingId) {
      players.splice(0, 0, values);
      renderer.prependPlayer(values.id, values.name);
    } else {
      players[players.findIndex(p => p.id === editingId)] = values;
      renderer.editPlayer(values.id, values.name);
    }
    localStorage.setItem('players', JSON.stringify(players));
  } else {
    if (!editingId) {
      monsters.splice(0, 0, values);
      renderer.prependMonster(values.id, values.name);
    } else {
      monsters[monsters.findIndex(m => m.id === editingId)] = values;
      renderer.editMonster(values.id, values.name);
    }
    localStorage.setItem('monsters', JSON.stringify(monsters));
  }

  renderer.hideForm();
}

/*
Input: 1d6 + 2d10 + 3
Output: [[6, 1], [10, 2], [1, 3]]
*/
function parseDiceString(string) {
  const subStrings = string.replace('/\s/g', '').split('+');
  const result = [];
  for (let subString of subStrings) {
    const numbers = subString.split('d');
    result.push([parseInt(numbers[1] || '1'), parseInt(numbers[0])]);
  }
  return result;
}

function addPlayerOrMonster(type) {
  editingId = null;
  editingType = type;
  renderer.showForm(type);
}

function editPlayerOrMonster(id, type) {
  editingId = id;
  editingType = type;
  const oldValues = type === 'player' ? (
    players.find(p => p.id === id)
  ) : (
    monsters.find(m => m.id === id)
  );
  renderer.showForm(type, oldValues);
}

function deletePlayer(id) {
  const indexToDelete = players.findIndex(p => p.id === id);
  players.splice(indexToDelete, 1);
  localStorage.setItem('players', JSON.stringify(players));
  renderer.deletePlayer(id);
}

function deleteMonster(id) {
  const indexToDelete = monsters.findIndex(m => m.id === id);
  monsters.splice(indexToDelete, 1);
  localStorage.setItem('monsters', JSON.stringify(monsters));
  renderer.deleteMonster(id);
}

function addPlayerToEncounter(id) {
  if (!encounter[id]) {
    encounter[id] = players.find(p => p.id === id);
    renderer.addPlayerToEncounter(id, $(`#${id} .name`).html());
    if (Object.keys(encounter).length === 1) renderer.toggleEncounterStart();
  }
}

function addMonsterToEncounter(id) {
  if (!encounter[id]) {
    encounter[id] = { quantity: 1, ...monsters.find(m => m.id === id) };
    renderer.addMonsterToEncounter(id, $(`#${id} .name`).html());
    if (Object.keys(encounter).length === 1) renderer.toggleEncounterStart();
  } else {
    editMonsterInEncounter(id, true);
  }
}

function editMonsterInEncounter(id, increase) {
  if (increase) {
    const newQuantity = encounter[id].quantity + 1;
    encounter[id].quantity = newQuantity;
    renderer.editMonsterInEncounter(id, newQuantity);
  } else {
    const newQuantity = encounter[id].quantity - 1;
    if (newQuantity === 0) {
      deleteFromEncounter(id);
    } else {
      encounter[id].quantity = newQuantity;
      renderer.editMonsterInEncounter(id, newQuantity);
    }
  }
}

function deleteFromEncounter(id) {
  delete encounter[id];
  renderer.deleteFromEncounter(id);
  if (Object.keys(encounter).length === 0) renderer.toggleEncounterStart();
}
