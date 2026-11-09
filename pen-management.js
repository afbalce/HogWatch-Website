function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

const detectedCameras = new Map();
let choiceVersion = 0;

function checkbox(device, disabled = false) {
  const label = element('label', undefined, 'device-choice');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.value = device.id;
  box.disabled = disabled;
  box.checked = device.pens.includes(editingId);
  const detail = element('span', device.name);
  const location = farmInventory.locationName(device);
  const subtitle = device.type === 'sensor' ? farmInventory.sensorLabel(device) + ' · ' + location : location;
  detail.append(element('small', device.local ? 'Local camera' : subtitle));
  label.append(box, detail);
  return label;
}

async function refreshChoices(note) {
  const version = ++choiceVersion;
  detectedCameras.clear();
  const devices = farmInventory.read().devices;
  const cameras = byId('camera-choices');
  const sensors = byId('sensor-choices');
  cameras.replaceChildren(...devices.filter(device => device.type === 'camera').map(device => checkbox(device)));
  const sensorList = devices.filter(device => device.type === 'sensor');
  sensors.replaceChildren(...sensorList.map(device => checkbox(device, device.pens.some(id => id !== editingId))));
  if (!sensorList.some(device => !device.pens.length || device.pens.includes(editingId))) sensors.append(element('small', 'Register an unassigned sensor in Device Management to select it here.'));
  byId('pen-form-note').textContent = note || '';
  try {
    const inputs = await navigator.mediaDevices?.enumerateDevices() || [];
    if (version !== choiceVersion) return;
    for (const input of inputs.filter(input => input.kind === 'videoinput')) {
      const id = 'local:' + (input.deviceId || 'default');
      if (devices.some(device => device.id === id) || detectedCameras.has(id)) continue;
      const device = {id, name: input.label || 'Local camera', type: 'camera', local: true, deviceId: input.deviceId, pens: []};
      detectedCameras.set(id, device);
      cameras.append(checkbox(device));
    }
  } catch { /* Registered cameras remain available when enumeration is restricted. */ }
  if (!cameras.children.length) cameras.append(element('small', 'No registered or local cameras found.'));
}

const byId = id => document.getElementById(id);
const dialog = byId('pen-dialog');
const numberInput = byId('pen-number');
let editingId = null;

function render() {
  const state = farmInventory.read();
  const pens = farmInventory.monitoringPens(state);
  const term = byId('search-input').value.trim().toLowerCase();
  const status = document.querySelector('.filter-pill.active').dataset.status;
  const rows = [];
  let withSensors = 0;
  let withCameras = 0;
  for (const pen of pens) {
    const assigned = state.devices.filter(device => device.pens.includes(pen.id));
    const names = type => assigned.filter(device => device.type === type).map(device => device.type === 'sensor' ? device.name + ' (' + farmInventory.sensorLabel(device) + ')' : device.name).join(', ');
    const sensors = names('sensor');
    const cameras = names('camera');
    if (sensors) withSensors++;
    if (cameras) withCameras++;
    if (status && pen.status !== status) continue;
    if (![pen.name, 'Pen ' + pen.id, sensors, cameras].join(' ').toLowerCase().includes(term)) continue;
    const row = byId('pen-row').content.firstElementChild.cloneNode(true);
    row.dataset.id = pen.id;
    const link = row.querySelector('.pen-link');
    link.href = 'pen-monitoring.html?pen=' + pen.id;
    link.textContent = pen.name;
    if (pen.name !== 'Pen ' + pen.id) row.querySelector('.pen-id').textContent = 'Pen ' + pen.id;
    row.cells[1].textContent = sensors || 'Unassigned';
    row.cells[2].textContent = cameras || 'Unassigned';
    const badge = row.querySelector('.status');
    badge.dataset.state = pen.status;
    badge.textContent = pen.status;
    for (const button of row.querySelectorAll('.btn-icon')) {
      const label = (button.classList.contains('edit') ? 'Edit ' : 'Remove ') + pen.name;
      button.setAttribute('aria-label', label);
      button.title = label;
    }
    rows.push(row);
  }
  byId('pen-rows').replaceChildren(...rows);
  byId('total-count').textContent = pens.length;
  byId('active-count').textContent = withSensors;
  byId('free-count').textContent = state.devices.filter(device => device.type === 'sensor' && !device.pens.length).length;
  byId('invited-count').textContent = withCameras;
  byId('empty').textContent = pens.length ? 'No pens match your search or filter.' : 'No pens yet. Add a pen to get started.';
  byId('empty').hidden = rows.length > 0;
}

function openEditor(id = null) {
  const pens = farmInventory.read().pens;
  const pen = pens.find(item => item.id === id);
  if (id !== null && !pen) { render(); return; }
  editingId = id;
  byId('pen-form').reset();
  byId('dialog-title').textContent = pen ? 'Edit pen' : 'Add pen';
  numberInput.value = id ?? Math.max(0, ...pens.map(item => item.id)) + 1;
  byId('pen-name').value = pen?.name || '';
  numberInput.setCustomValidity('');
  refreshChoices();
  dialog.showModal();
  numberInput.select();
}
byId('add-pen').addEventListener('click', () => openEditor());
byId('search-input').addEventListener('input', render);
const filters = document.querySelectorAll('.filter-pill');
for (const button of filters) {
  button.addEventListener('click', () => {
    for (const filter of filters) {
      filter.classList.toggle('active', filter === button);
      filter.setAttribute('aria-pressed', filter === button);
    }
    render();
  });
}
byId('cancel').addEventListener('click', () => dialog.close());
numberInput.addEventListener('input', () => numberInput.setCustomValidity(''));
byId('pen-rows').addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const id = Number(button.closest('tr').dataset.id);
  if (button.classList.contains('edit')) { openEditor(id); return; }
  const pen = farmInventory.monitoringPens().find(item => item.id === id);
  if (!pen || !confirm('Remove ' + pen.name + '? Its sensors and cameras will be unassigned from this pen.')) return;
  farmInventory.change(state => {
    state.pens = state.pens.filter(item => item.id !== id);
    for (const device of state.devices) device.pens = device.pens.filter(assigned => assigned !== id);
  });
  render();
});
byId('pen-form').addEventListener('submit', event => {
  event.preventDefault();
  const id = numberInput.valueAsNumber;
  const selected = new Set([...dialog.querySelectorAll('input:checked')].map(box => box.value));
  try {
    farmInventory.change(state => {
      const record = state.pens.find(pen => pen.id === editingId);
      if (editingId !== null && !record) throw Error('This pen was removed. Close the editor to refresh the directory.');
      if (editingId !== id && state.pens.some(pen => pen.id === id)) throw Error('That pen number is already in use.');
      for (const key of selected) {
        let device = state.devices.find(item => item.id === key);
        if (!device && detectedCameras.has(key)) {
          device = {...detectedCameras.get(key), pens: []};
          state.devices.push(device);
        }
        if (!device || (device.type === 'sensor' && device.pens.some(pen => pen !== editingId))) {
          throw Error('A device is no longer available. Reopen the editor to review assignments.');
        }
      }
      for (const device of state.devices) {
        if (device.type !== 'sensor' && device.type !== 'camera') {
          device.pens = device.pens.map(pen => pen === editingId ? id : pen);
          continue;
        }
        device.pens = device.pens.filter(pen => pen !== editingId);
        if (selected.has(device.id)) device.pens.push(id);
      }
      const pen = record || {};
      pen.id = id;
      pen.name = byId('pen-name').value.trim();
      if (!record) state.pens.push(pen);
    });
  } catch (error) {
    byId('pen-form-note').textContent = error.message;
    return;
  }
  dialog.close();
  render();
});
window.addEventListener('storage', event => { if (event.key === farmInventory.key) render(); });
window.addEventListener('pageshow', render);
render();
