(() => {
  const byId = id => document.getElementById(id);
  const list = byId('controller-list');
  const dialog = byId('controller-dialog');
  const form = byId('controller-form');
  const message = byId('climate-message');
  const decimal = new Intl.NumberFormat(undefined, {maximumFractionDigits: 2});
  let editing = null;
  let controllers = [];
  let registeredDevices = [];

  function sprinklerState(device, now = Date.now()) {
    const elapsed = device.startedAt == null ? 0 : Math.min(device.seconds, Math.max(0, (now - device.startedAt) / 1000));
    const water = Math.max(0, device.water - elapsed * device.flow / 60);
    const remaining = device.startedAt == null || water <= 0 ? 0 : Math.ceil(device.seconds - elapsed);
    return {water, remaining};
  }
  function clock(seconds) {
    return Math.floor(seconds / 60) + 'm ' + String(seconds % 60).padStart(2, '0') + 's';
  }
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(label, action, className = 'btn-secondary') {
    const node = element('button', label, className);
    node.type = 'button';
    node.dataset.action = action;
    return node;
  }
  function draw() {
    const inventory = farmInventory.read();
    registeredDevices = inventory.devices.filter(d => d.type === 'sensor' || d.type === 'camera');
    controllers = inventory.devices.filter(d => d.type === 'fan' || d.type === 'sprinkler');
    list.replaceChildren(...controllers.map(device => {
      const card = element('article', null, 'controller-card');
      card.dataset.id = device.id;
      const header = element('header');
      const title = element('div');
      title.append(element('h3', device.name), element('small', (device.type === 'fan' ? 'Ventilation fan' : 'Sprinkler') + ' · ' + farmInventory.locationName(device)));
      const state = element('span', '', 'controller-state');
      header.append(title, state);
      card.append(header, element('small', '', 'controller-watts'));
      if (device.type === 'sprinkler') {
        const water = element('strong', '', 'water-level');
        const meter = element('progress');
        meter.max = device.capacity;
        meter.setAttribute('aria-label', 'Water remaining');
        const timing = element('small', '', 'water-time');
        const duration = element('label', 'Spray duration (seconds)', 'spray-duration');
        const input = element('input');
        input.type = 'number';
        input.min = 1;
        input.step = 1;
        input.required = true;
        input.value = device.seconds;
        duration.append(input);
        card.append(water, meter, timing, duration);
      }
      const actions = element('div', null, 'controller-actions');
      actions.append(button('', 'toggle', 'btn-primary'), button('Configure', 'edit'), button('Remove', 'remove', 'controller-remove'));
      card.append(actions);
      return card;
    }));
    if (!controllers.length) list.append(element('p', 'No environmental controllers registered.'));
    tick();
  }
  function tick() {
    let load = registeredDevices.reduce((total, device) => total + (device.watts ?? 0), 0);
    let unknown = registeredDevices.filter(device => device.watts == null).length;
    for (const [i, device] of controllers.entries()) {
      const card = list.children[i];
      let running = !!device.on;
      if (device.type === 'sprinkler') {
        const {water, remaining} = sprinklerState(device);
        running = remaining > 0;
        card.querySelector('.water-level').textContent = decimal.format(water) + ' / ' + decimal.format(device.capacity) + ' L remaining';
        card.querySelector('progress').value = water;
        const available = Math.floor(water * 60 / device.flow);
        card.querySelector('.water-time').textContent = running
          ? 'Time left · ' + clock(remaining)
          : 'Water available for ' + clock(available) + ' at ' + decimal.format(device.flow) + ' L/min';
        card.querySelector('input').disabled = running;
        card.querySelector('[data-action=toggle]').disabled = !running && available < 1;
      }
      const watts = running ? device.watts : 0;
      if (watts == null) unknown++;
      else load += watts;
      card.querySelector('.controller-watts').textContent = 'Power draw · ' + (watts == null ? 'Not set' : decimal.format(watts) + ' W');
      card.querySelector('.controller-state').textContent = running ? 'Running' : 'Off';
      card.querySelector('.controller-state').classList.toggle('running', running);
      card.querySelector('[data-action=toggle]').textContent = (running ? 'Stop ' : 'Start ') + (device.type === 'fan' ? 'fan' : 'sprinkler');
      card.querySelector('[data-action=edit]').disabled = device.type === 'sprinkler' && running;
    }
    byId('device-load').textContent = (unknown ? '≥ ' : '') + decimal.format(load) + ' W';
    byId('load-note').textContent = unknown ? unknown + ' missing wattage' : 'Estimated from configured wattages';
    const net = Number(byId('solar-watts').dataset.watts) - load;
    const netLabel = byId('net-watts');
    netLabel.textContent = unknown ? '—' : (net > 0 ? '+' : '') + decimal.format(net) + ' W';
    netLabel.classList.toggle('text-crit', !unknown && net < 0);
    netLabel.classList.toggle('text-green', !unknown && net >= 0);
    byId('net-note').textContent = unknown ? 'Waiting for device wattages' : 'Generation minus device load';
  }
  function toggleTankFields() {
    const show = byId('controller-type').value === 'sprinkler';
    byId('tank-fields').hidden = !show;
    byId('tank-fields').disabled = !show;
  }
  function openEditor(device) {
    editing = device?.id || null;
    form.reset();
    byId('controller-title').textContent = editing ? 'Configure controller' : 'Add controller';
    byId('controller-type').value = device?.type || 'fan';
    byId('controller-type').disabled = !!device;
    byId('controller-name').value = device?.name || '';
    byId('controller-watts').value = device?.watts ?? '';
    const locations = byId('controller-pen');
    locations.replaceChildren(new Option('Unassigned', ''));
    for (const pen of farmInventory.monitoringPens()) locations.add(new Option(pen.name, pen.id));
    locations.value = device?.pens[0] || '';
    byId('tank-capacity').value = device?.capacity ?? 100;
    byId('tank-water').value = device?.type === 'sprinkler' ? Number(sprinklerState(device).water.toFixed(3)) : 0;
    byId('tank-flow').value = device?.flow ?? 5;
    byId('controller-error').textContent = '';
    toggleTankFields();
    dialog.showModal();
  }
  byId('controller-type').addEventListener('change', toggleTankFields);
  byId('add-controller').addEventListener('click', () => openEditor(null));
  byId('cancel-controller').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      farmInventory.change(state => {
        const device = editing ? state.devices.find(item => item.id === editing) : {
          id: 'CTRL-' + Array.from(crypto.getRandomValues(new Uint32Array(2))).join('-'),
          type: byId('controller-type').value, on: false, seconds: 60
        };
        if (!device) throw Error('This controller was removed.');
        const pen = Number(byId('controller-pen').value);
        if (pen && !state.pens.some(item => item.id === pen)) throw Error('This pen is no longer available.');
        device.pens = pen ? [pen] : [];
        device.name = byId('controller-name').value.trim();
        const watts = byId('controller-watts');
        device.watts = watts.value === '' ? null : watts.valueAsNumber;
        if (!device.name) throw Error('Enter a controller name.');
        if (device.type === 'sprinkler') {
          if (editing && sprinklerState(device).remaining) throw Error('Stop the sprinkler before changing its tank settings.');
          device.capacity = byId('tank-capacity').valueAsNumber;
          device.water = byId('tank-water').valueAsNumber;
          device.flow = byId('tank-flow').valueAsNumber;
          if (device.water > device.capacity) throw Error('Water remaining cannot exceed tank capacity.');
          device.startedAt = null;
        }
        if (!editing) state.devices.push(device);
      });
      dialog.close();
      message.textContent = 'Controller saved.';
      draw();
    } catch (error) { byId('controller-error').textContent = error.message; }
  });
  list.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control) return;
    const card = control.closest('article');
    const id = card.dataset.id;
    const device = farmInventory.read().devices.find(item => item.id === id);
    if (!device) { draw(); return; }
    const action = control.dataset.action;
    if (action === 'edit') { openEditor(device); return; }
    if (action === 'remove' && !confirm('Remove ' + device.name + '?')) return;
    try {
      farmInventory.change(state => {
        const current = state.devices.find(item => item.id === id);
        if (!current) throw Error('This controller was removed.');
        if (action === 'remove') { state.devices = state.devices.filter(item => item.id !== id); return; }
        if (current.type === 'fan') { current.on = !current.on; return; }
        const {water, remaining} = sprinklerState(current);
        current.water = water;
        current.startedAt = null;
        if (remaining) return;
        const input = card.querySelector('input');
        const seconds = input.valueAsNumber;
        if (!Number.isSafeInteger(seconds) || seconds < 1) throw Error('Enter a duration of at least one whole second.');
        if (seconds > Math.floor(water * 60 / current.flow)) throw Error('There is not enough water for this duration. Shorten the run or update the tank level.');
        current.seconds = seconds;
        current.startedAt = Date.now();
      });
      draw();
      message.textContent = action === 'remove' ? 'Controller removed.' : '';
    } catch (error) { message.textContent = error.message; }
  });
  document.addEventListener('device-register-updated', () => {
    registeredDevices = farmInventory.read().devices.filter(d => d.type === 'sensor' || d.type === 'camera');
    tick();
  });
  byId('refresh-power').addEventListener('click', draw);
  window.addEventListener('storage', event => { if (event.key === farmInventory.key) draw(); });
  window.addEventListener('pageshow', event => { if (event.persisted) draw(); });
  draw();
  setInterval(tick, 1000);
})();
