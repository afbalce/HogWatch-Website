const metrics = [
  {name: 'Temperature', unit: '°C', target: 'Target 22–28 °C', low: 22, high: 28, limit: 30},
  {name: 'Humidity', unit: '%', target: 'Target 50–70%', low: 50, high: 70, limit: 80},
  {name: 'Ammonia', unit: 'ppm', target: 'Target up to 20 ppm', low: 0, high: 20, limit: 25}
];

const byId = id => document.getElementById(id);
const picker = byId('pen-picker');
const acknowledged = new Set();
let activePen;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function addChoice(pen) {
  const button = element('button', undefined, 'pen-choice');
  button.type = 'button';
  button.dataset.pen = pen.id;
  button.dataset.state = pen.status;
  button.append(element('strong', pen.name), element('small', pen.status));
  button.addEventListener('click', () => selectPen(pen, true));
  picker.append(button);
}

function metricCard(metric, value) {
  const card = element('div', undefined, 'metric');
  const offline = value === undefined;
  let state = 'OK';
  if (offline) state = 'Offline';
  else if (value > metric.limit) state = 'Critical';
  else if (value < metric.low || value > metric.high) state = 'Warning';
  card.dataset.state = state;
  const number = offline ? '—' : metric.name === 'Temperature' ? value.toFixed(1) : String(value);
  const reading = element('output', number);
  if (!offline) reading.append(element('small', ' ' + metric.unit));
  const detail = element('p');
  detail.append(element('span', offline ? 'No reading' : state, 'metric-state'), ' · ' + metric.target);
  card.append(element('h3', metric.name), reading, detail);
  return card;
}

function alertRow(pen, alert) {
  const [status, title, detail] = alert;
  const row = element('div', undefined, 'alert-row');
  row.dataset.state = status;
  const message = element('div');
  message.append(element('strong', title), element('p', detail));
  const key = pen.id + ':' + title;
  const button = element('button', undefined, 'secondary');
  button.type = 'button';
  function showState() {
    button.disabled = acknowledged.has(key);
    button.textContent = button.disabled ? 'Acknowledged' : 'Acknowledge';
    button.setAttribute('aria-label', button.textContent + ' · ' + title);
  }
  button.addEventListener('click', () => { acknowledged.add(key); showState(); });
  showState();
  row.append(element('span', status, 'badge'), message, button);
  return row;
}

function selectPen(pen, updateUrl = false) {
  for (const button of picker.children) button.setAttribute('aria-pressed', Number(button.dataset.pen) === pen.id);
  byId('selected-name').textContent = pen.name;
  byId('pen-status').dataset.state = pen.status;
  byId('pen-status').textContent = pen.status;
  byId('reading-time').textContent = pen.readings ? 'Latest readings · 2 min ago' : 'Waiting for sensor readings';
  byId('metrics').replaceChildren(...metrics.map((metric, i) => metricCard(metric, pen.readings?.[i])));
  const alerts = pen.alerts || [];
  byId('alert-count').textContent = alerts.length;
  byId('pen-alerts').replaceChildren(...alerts.map(alert => alertRow(pen, alert)));
  if (!alerts.length) byId('pen-alerts').append(element('p', 'No active alerts for this pen.', 'empty'));

  activePen = pen;
  const assigned = farmInventory.read().devices.filter(device => device.pens.includes(pen.id));
  const sensors = assigned.filter(device => device.type === 'sensor');
  byId('assigned-sensors').textContent = sensors.length ? 'Sensors · ' + sensors.map(device => device.name).join(', ') : '';
  byId('assigned-sensors').hidden = !sensors.length;
  penCamera.show(assigned.filter(device => device.type === 'camera'));
  const hasSample = pen.sample === 4;
  byId('trend').hidden = !hasSample;
  byId('no-trend').hidden = hasSample;
  byId('no-trend').textContent = 'No temperature history available for Pen ' + pen.id + '.';
  byId('sample-behavior').hidden = !hasSample;
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('pen', pen.id);
    try { history.replaceState(null, '', url); } catch { /* File URLs can restrict history updates. */ }
  }
}

function refreshPens() {
  const pens = farmInventory.monitoringPens();
  picker.replaceChildren();
  pens.forEach(addChoice);
  const requested = Number(new URLSearchParams(location.search).get('pen'));
  const selected = pens.find(pen => pen.id === (activePen?.id || requested)) || pens.find(pen => pen.sample === 4) || pens[0];
  byId('no-pens').hidden = !!selected;
  for (const section of document.querySelectorAll('.readings, .alert-panel, .support-panels')) section.hidden = !selected;
  if (selected) selectPen(selected);
  else { activePen = null; penCamera.show([]); }
}
refreshPens();
window.addEventListener('storage', event => { if (event.key === farmInventory.key) refreshPens(); });
window.addEventListener('pageshow', event => { if (event.persisted) refreshPens(); });
