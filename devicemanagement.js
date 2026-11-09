document.addEventListener('DOMContentLoaded', () => {
  const byId = id => document.getElementById(id);
  const table = byId('devicesTableBody');
  const deviceTemplate = byId('device-row').content.firstElementChild;
  let selectedId;
  let toastTimer;

  function notify(message, error = false) {
    const toast = byId('customAlert');
    byId('alertMessage').textContent = message;
    toast.className = 'custom-alert show-alert ' + (error ? 'error' : 'success');
    byId('alertIcon').className = error ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show-alert'), 4000);
  }

  function render() {
    const rows = farmInventory.read().devices.filter(device => device.type === 'sensor' || device.type === 'camera').map(device => {
      const row = deviceTemplate.cloneNode(true);
      row.dataset.id = device.id;
      row.dataset.category = device.type;
      row.querySelector('.device-name').textContent = device.name;
      row.querySelector('.device-id').textContent = 'ID: ' + device.id;
      row.cells[1].textContent = device.type === 'camera' ? 'Camera' : farmInventory.sensorLabel(device) + ' sensor';
      row.cells[2].textContent = farmInventory.locationName(device);
      const sampleSignal = {'HW-SENS-001': 'Strong', 'HW-SENS-009': 'Weak', 'HW-CAM-101': 'Ethernet'};
      row.cells[3].textContent = device.watts == null ? 'Not set' : device.watts.toFixed(2) + ' W';
      row.cells[4].textContent = sampleSignal[device.id] || '—';
      const badge = row.cells[5].firstElementChild;
      badge.textContent = sampleSignal[device.id] ? 'Online' : 'Registered';
      badge.classList.add(sampleSignal[device.id] ? 'badge-ok' : 'badge-offline');
      return row;
    });
    table.replaceChildren(...rows);
    document.dispatchEvent(new Event('device-register-updated'));
  }

  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.add('hidden'));
  }
  function save(edit, message, revealNewDevice = false) {
    try { farmInventory.change(edit); }
    catch (error) { notify(error.message, true); return; }
    closeModals();
    render();
    if (revealNewDevice) {
      byId('list-search').value = '';
      document.querySelector('.filter-pill[data-filter="all"]').click();
      table.lastElementChild?.scrollIntoView({block: 'nearest'});
    }
    notify(message);
  }
  function locations(select, type, device) {
    const pens = farmInventory.monitoringPens();
    const ids = pens.map(pen => pen.id);
    select.replaceChildren(new Option('Unassigned', 'unassigned'));
    for (const pen of pens) {
      const standard = 'Pen ' + pen.id;
      select.add(new Option(pen.name === standard ? standard : pen.name + ' · ' + standard, String(pen.id)));
    }
    if (type === 'camera') {
      if (ids.includes(1) && ids.includes(2)) select.add(new Option('Pens 1 & 2', '1,2'));
      if (ids.includes(3) && ids.includes(4)) select.add(new Option('Pens 3 & 4', '3,4'));
      select.add(new Option('Main Hallway', 'hallway'));
    }
    const value = device?.area ? 'hallway' : device?.pens.join(',') || 'unassigned';
    if (value && ![...select.options].some(option => option.value === value)) {
      select.add(new Option(farmInventory.locationName(device), value));
    }
    select.value = value;
  }
  function setLocation(state, device, value) {
    device.area = value === 'hallway' ? 'Main Hallway' : '';
    device.pens = value !== 'unassigned' && !device.area ? value.split(',').map(Number) : [];
    if (device.pens.some(id => !state.pens.some(pen => pen.id === id))) {
      throw Error('A selected pen was removed. Reopen the form to choose a current location.');
    }
  }
  function streamUrl(input) {
    let text = input.trim();
    if (!text) return '';
    if (!text.includes('://')) text = 'http://' + text;
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw Error('Use an HTTP or HTTPS video or MJPEG stream URL.');
    return url.href;
  }

  for (const id of ['sensor-kind', 'edit-sensor-kind']) {
    const select = byId(id);
    select.add(new Option('Choose sensor type', ''));
    for (const [value, label] of Object.entries(farmInventory.sensorTypes)) select.add(new Option(label, value));
  }

  const assignmentDialog = byId('assignment-dialog');
  byId('assign-sensors').addEventListener('click', () => {
    const sensors = farmInventory.read().devices.filter(device => device.type === 'sensor');
    const destination = byId('destination-pen');
    locations(destination, 'sensor');
    destination.selectedIndex = -1;
    const list = byId('assignment-list');
    list.replaceChildren();
    for (const sensor of sensors) {
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.value = sensor.id;
      const text = document.createElement('span');
      text.textContent = sensor.name;
      const detail = document.createElement('small');
      detail.textContent = [farmInventory.sensorLabel(sensor), sensor.id, farmInventory.locationName(sensor)].join(' · ');
      text.append(detail);
      label.append(box, text);
      list.append(label);
    }
    if (!sensors.length) list.textContent = 'Register a sensor to assign it to a pen.';
    byId('assignment-error').textContent = '';
    assignmentDialog.showModal();
  });
  byId('cancel-assignment').addEventListener('click', () => assignmentDialog.close());
  byId('assignment-form').addEventListener('submit', event => {
    event.preventDefault();
    const ids = [...byId('assignment-list').querySelectorAll(':checked')].map(box => box.value);
    const destination = byId('destination-pen').value;
    if (!ids.length || !destination) {
      byId('assignment-error').textContent = 'Choose a destination and at least one sensor.';
      return;
    }
    try {
      farmInventory.change(state => {
        for (const id of ids) {
          const sensor = state.devices.find(device => device.id === id && device.type === 'sensor');
          if (!sensor) throw Error('A sensor was removed. Reopen assignments to refresh the list.');
          setLocation(state, sensor, destination);
        }
      });
    } catch (error) {
      byId('assignment-error').textContent = error.message;
      return;
    }
    assignmentDialog.close();
    render();
    notify('Sensor assignments saved.');
  });

  for (const type of ['Sensor', 'Camera']) {
    const form = byId('add' + type + 'Form');
    const locationSelect = form.querySelector('.form-group:last-child select');
    byId('openAdd' + type + 'Btn').addEventListener('click', () => {
      form.reset();
      locations(locationSelect, type.toLowerCase());
      byId('add' + type + 'Modal').classList.remove('hidden');
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const [name, address] = form.querySelectorAll('input');
      save(state => {
        const device = {name: name.value.trim(), type: type.toLowerCase()};
        if (!device.name) throw Error('Enter a device name.');
        if (type === 'Camera') {
          device.id = 'CAM-' + Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(16)).join('-');
          device.url = streamUrl(address.value);
          if (!device.url) throw Error('Enter a stream URL.');
          device.format = byId('add-camera-format').value;
        } else {
          device.measurement = byId('sensor-kind').value;
          device.id = address.value.trim();
          if (!device.id || state.devices.some(item => item.id.toLowerCase() === device.id.toLowerCase())) throw Error('Enter a unique sensor ID.');
        }
        const watts = byId('add-' + type + '-watts');
        device.watts = watts.value === '' ? null : watts.valueAsNumber;
        setLocation(state, device, locationSelect.value);
        state.devices.push(device);
      }, type + ' saved to this browser.', true);
    });
  }
  document.querySelectorAll('.close-modal-btn, .cancel-modal-btn').forEach(button => button.addEventListener('click', closeModals));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModals(); });
  const editForm = byId('editDeviceForm');
  const editLocation = byId('edit-location');
  table.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    selectedId = button.closest('tr').dataset.id;
    const device = farmInventory.read().devices.find(item => item.id === selectedId);
    if (!device) { render(); return; }
    if (button.classList.contains('edit-btn')) {
      byId('editDeviceName').value = device.name;
      byId('edit-watts').value = device.watts ?? '';
      byId('edit-sensor-fields').hidden = device.type !== 'sensor';
      byId('edit-sensor-kind').disabled = device.type !== 'sensor';
      byId('edit-sensor-kind').required = device.type === 'sensor';
      byId('edit-sensor-kind').value = device.measurement || '';
      locations(editLocation, device.type, device);
      byId('edit-camera-fields').hidden = device.type !== 'camera' || device.local;
      byId('edit-camera-url').value = device.url || '';
      byId('edit-camera-format').value = device.format || 'video';
      byId('editDeviceModal').classList.remove('hidden');
      byId('editDeviceName').focus();
    } else {
      byId('deleteDeviceName').textContent = device.name;
      byId('deleteDeviceModal').classList.remove('hidden');
    }
  });
  editForm.addEventListener('submit', event => {
    event.preventDefault();
    save(state => {
      const device = state.devices.find(item => item.id === selectedId);
      if (!device) throw Error('This device has been removed.');
      device.name = byId('editDeviceName').value.trim();
      const watts = byId('edit-watts');
      device.watts = watts.value === '' ? null : watts.valueAsNumber;
      if (!device.name) throw Error('Enter a device name.');
      setLocation(state, device, editLocation.value);
      if (device.type === 'sensor') device.measurement = byId('edit-sensor-kind').value;
      if (device.type === 'camera' && !device.local) {
        device.url = streamUrl(byId('edit-camera-url').value);
        device.format = byId('edit-camera-format').value;
      }
    }, 'Device updated.');
  });
  byId('confirmDeleteBtn').addEventListener('click', () => save(state => {
    state.devices = state.devices.filter(item => item.id !== selectedId);
  }, 'Device removed.'));
  window.addEventListener('storage', event => { if (event.key === farmInventory.key) render(); });
  render();
});
