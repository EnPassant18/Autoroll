import { createId } from './random.js';

const renderPlayer = (id, name) =>
  `<li id="${id}" class="player list-group-item">
    <span class="name align-middle">${name}</span>
    <button class="delete-button btn btn-outline-danger btn-sm float-right ml-2">Delete</Button>
    <button class="edit-button btn btn-outline-secondary btn-sm float-right ml-2">Edit</Button>
    <button class="to-encounter-button btn btn-outline-primary btn-sm float-right">Add to Encounter</Button>
  </li>`

const renderMonster = (id, name) =>
  `<li id="${id}" class="monster list-group-item">
    <span class="name align-middle">${name}</span>
    <button class="delete-button btn btn-outline-danger btn-sm float-right ml-2">Delete</Button>
    <button class="edit-button btn btn-outline-secondary btn-sm float-right ml-2">Edit</Button>
    <button class="to-encounter-button btn btn-outline-primary btn-sm float-right">Add to Encounter</Button>
  </li>`

const renderPlayerInEncounter = (id, name) =>
  `<li id="encounter-${id}" class="encounter list-group-item">
    <span class="align-middle">${name}</span>
    <button class="encounter-delete-button btn btn-outline-danger btn-sm float-right">Remove</Button>
  </li>`

const renderMonsterInEncounter = (id, name, quantity) =>
  `<li id="encounter-${id}" class="encounter list-group-item">
    <span class="align-middle font-weight-bold">(<span id="encounter-${id}-quantity">${quantity || 1}</span>)</span>
    <span class="align-middle">${name}</span>
    <button class="encounter-plus-button btn btn-outline-primary btn-sm float-right ml-2">
      <i class="fas fa-plus"></i>
    </Button>
    <button class="encounter-minus-button btn btn-outline-danger btn-sm float-right">
      <i class="fas fa-minus"></i>
    </Button>
  </li>`

const renderAttack = (id, values) =>
  `<li id="attack-${id}" class="list-group-item">
    <div class="form-group-item row">
      <span class="col-6"><input id="attack-${id}-name" class="form-control" placeholder="Spell/Attack Name" value="${values.name || ''}" required></span>
      <span class="col-5"><select id="attack-${id}-type" class="attack-type-select form-control col" required>
        <option value="" disabled>Effect Type</option>
        <option value="attack">Attack</option>
        <option value="save">Saving Throw</option>
        <option value="both">Attack, and on hit, Saving Throw</option>
      </select></span>
      <span class="attack-delete-button col-1 col-form-label"><button type="button" class="close">&times</button></span>
    </div>
    <div class="form-group-item row mt-2 d-none">
      <span class="col-2 col-form-label">Modifier:</span>
      <span class="col-4"><input id="attack-${id}-modifier" class="form-control" placeholder="5" type="number" value="${values.modifier || ''}"></span>
      <span class="col-2 col-form-label">Damage:</span>
      <span class="col-4"><input id="attack-${id}-damage" class="form-control" placeholder="MdX+...+K" value="${values.damage || ''}" pattern="^(([0-9]+)d([0-9]+) *\\+ *)*([0-9]+)(d([0-9]+))?$"></span>
    </div>
    <div class="form-group-item row mt-2 d-none">
      <span class="col-1 col-form-label">DC:</span>
      <span class="col-2"><input id="attack-${id}-save-dc" class="form-control" placeholder="14" value="${values['save-dc'] || ''}"></span>
      <span class="col-3"><select id="attack-${id}-save-type" class="form-control col">
        <option value="" disabled>Type</option>
        <option value="str">STR</option>
        <option value="dex">DEX</option>
        <option value="con">CON</option>
      </select></span>
      <span class="col-2 col-form-label">Damage:</span>
      <span class="col-4"><input id="attack-${id}-save-damage" class="form-control" placeholder="MdX+...+K" value="${values['save-damage'] || ''}"  pattern="^(([0-9]+)d([0-9]+) *\\+ *)*([0-9]+)(d([0-9]+))?$"></span>
    </div>
  </li>`

export function onSelectAttackType(newValue, attackId) {
  switch (newValue) {
    case 'attack':
      $(`#attack-${attackId} div:eq(1)`).removeClass('d-none');
      $(`#attack-${attackId} div:eq(1) input`).attr('required', 'required');
      $(`#attack-${attackId} div:eq(2)`).addClass('d-none');
      $(`#attack-${attackId} div:eq(2) input`).removeAttr('required');
      break;
    case 'save':
      $(`#attack-${attackId} div:eq(1)`).addClass('d-none');
      $(`#attack-${attackId} div:eq(1) input`).removeAttr('required');
      $(`#attack-${attackId} div:eq(2)`).removeClass('d-none');
      $(`#attack-${attackId} div:eq(2) input`).attr('required', 'required');
      break;
    case 'both':
      $(`#attack-${attackId} div:eq(1)`).removeClass('d-none');
      $(`#attack-${attackId} div:eq(1) input`).attr('required', 'required');
      $(`#attack-${attackId} div:eq(2)`).removeClass('d-none');
      $(`#attack-${attackId} div:eq(2) input`).attr('required', 'required');
      break;
  }
}

function showForm(editingType, oldValues) {
  $('#attack-list li').remove();
  if (oldValues) {
    Object.entries(oldValues).forEach(([key, value]) => {
      if (key !== 'attacks') $(`#${key}`).val(value);
    })
    Object.entries(oldValues.attacks).forEach(([id, props]) => {
      $('#attack-list').append(renderAttack(id, props));
      $(`#attack-${id}-type`).val(props.type);
      onSelectAttackType(props.type, id);
      if (props['save-type']) $(`#attack-${id}-save-type`).val(props['save-type']);
    })
  } else {
    document.getElementById('form').reset();
  }
  $('#form-header').html(`${oldValues ? 'Edit' : 'Create New'} ${editingType === 'player' ? 'Player' : 'Monster'}`);
  $('#form-modal').modal('show');
}

function toggleEncounterStart() {
  if ($('#encounter-start').hasClass('d-none')) {
    $('#encounter-blank').addClass('d-none');
    $('#encounter-start').removeClass('d-none');
  } else {
    $('#encounter-blank').removeClass('d-none');
    $('#encounter-start').addClass('d-none');
  }
}

export default {
  appendPlayer: (id, name) => $('#player-list').append(renderPlayer(id, name)),
  prependPlayer: (id, name) => $('#player-list').prepend(renderPlayer(id, name)),
  editPlayer: (id, name) => $(`#${id}`).replaceWith(renderPlayer(id, name)),
  deletePlayer: (id) => $(`#${id}`).remove(),

  appendMonster: (id, name) => $('#monster-list').append(renderMonster(id, name)),
  prependMonster: (id, name) => $('#monster-list').prepend(renderMonster(id, name)),
  editMonster: (id, name) => $(`#${id}`).replaceWith(renderMonster(id, name)),
  deleteMonster: (id) => $(`#${id}`).remove(),

  showForm,
  hideForm: () => $('#form-modal').modal('hide'),

  addAttack: () => $('#attack-list').prepend(renderAttack(createId(), {})),

  addPlayerToEncounter: (id, name) => $('#encounter-list').append(renderPlayerInEncounter(id, name)),
  addMonsterToEncounter: (id, name) => $('#encounter-list').append(renderMonsterInEncounter(id, name)),
  deleteFromEncounter: (id) => $(`#encounter-${id}`).remove(),
  editMonsterInEncounter: (id, newQuantity) => $(`#encounter-${id}-quantity`).html(newQuantity),
  toggleEncounterStart,
}