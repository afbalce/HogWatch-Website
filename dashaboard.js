document.addEventListener('DOMContentLoaded', () => {
  const byId = id => document.getElementById(id);
  const metrics = [
    {name: 'Temperature', unit: '°C', target: 'Target 22–28 °C', scale: 30, precision: 1},
    {name: 'Humidity', unit: '%', target: 'Target 50–70%', scale: 100, precision: 0},
    {name: 'Ammonia', unit: 'ppm', target: 'Limit 25 ppm', scale: 25, precision: 0}
  ];
  let pens = [];
  let metricIndex = 0;
  let selectedId = null;
  let checkedAt = Date.now();

  function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function reading(value, metric) {
    return Number.isFinite(value) ? value.toFixed(metric.precision) + ' ' + metric.unit : '—';
  }
  function statusBadge(status) {
    const badge = el('span', status, 'status-label');
    badge.dataset.status = status;
    return badge;
  }
  function penUrl(pen) { return 'pen-monitoring.html?pen=' + pen.id; }

  function detail(pen) {
    byId('detail-content').hidden = !pen;
    byId('detail-status').hidden = !pen;
    byId('detail-empty').hidden = !!pen;
    if (!pen) return;
    byId('detail-status').textContent = pen.status;
    byId('detail-status').dataset.status = pen.status;
    byId('pen-title').textContent = pen.name;
    byId('pen-readings').replaceChildren(...metrics.map((metric, index) => {
      const row = el('div');
      row.append(el('dt', metric.name), el('dd', reading(pen.readings?.[index], metric)));
      return row;
    }));
    const alerts = pen.alerts || [];
    byId('pen-note').textContent = alerts.length ? alerts.map(alert => alert[1]).join(' · ')
      : pen.readings ? 'No active alerts for this pen.' : 'Waiting for sensor readings.';
    byId('open-pen').href = penUrl(pen);
  }

  function compare() {
    const term = byId('list-search').value.trim().toLowerCase();
    const status = byId('list-category').value;
    const visible = pens.filter(pen => (!status || pen.status === status) &&
      (pen.name + ' Pen ' + pen.id).toLowerCase().includes(term));
    const selected = visible.find(pen => pen.id === selectedId) || visible.find(pen => pen.status === 'Critical') || visible[0];
    if (selected) selectedId = selected.id;
    const metric = metrics[metricIndex];
    const max = Math.max(metric.scale, ...pens.map(pen => pen.readings?.[metricIndex] || 0));
    const lines = visible.map(pen => {
      const value = pen.readings?.[metricIndex];
      const button = el('button', null, 'pen-line');
      button.type = 'button';
      button.dataset.pen = pen.id;
      button.dataset.status = pen.status;
      button.setAttribute('aria-pressed', selectedId === pen.id);
      button.setAttribute('aria-controls', 'detail-content');
      const bar = el('span', null, 'bar');
      bar.setAttribute('aria-hidden', 'true');
      const fill = el('i');
      fill.style.width = (value || 0) / max * 100 + '%';
      bar.append(fill);
      button.append(el('strong', pen.name), bar, el('span', reading(value, metric), 'reading'), statusBadge(pen.status));
      return button;
    });
    byId('comparison').replaceChildren(...lines);
    if (!lines.length) byId('comparison').append(el('p', pens.length ? 'No pens match these filters.' : 'No pens configured.', 'no-results'));
    byId('comparison-count').textContent = visible.length + ' of ' + pens.length + ' pens';
    byId('metric-target').textContent = metric.target;
    detail(selected);
  }
  function switchMetric(index) {
    metricIndex = index;
    for (const button of document.querySelectorAll('[data-metric]')) {
      button.setAttribute('aria-pressed', Number(button.dataset.metric) === index);
    }
    compare();
  }
  function lastChecked() {
    const minutes = Math.max(0, Math.floor((Date.now() - checkedAt) / 60000));
    byId('overview-status').textContent = minutes ? 'Checked ' + minutes + ' min ago' : 'Checked just now';
  }
  function refresh() {
    const inventory = farmInventory.read();
    pens = farmInventory.monitoringPens(inventory);
    const online = pens.filter(pen => pen.readings);
    const alerts = pens.flatMap(pen => (pen.alerts || []).map(([status, title, info]) => ({pen, status, title, info})));
    const critical = alerts.filter(alert => alert.status === 'Critical').length;
    const warning = alerts.filter(alert => alert.status === 'Warning').length;
    byId('total-pens').textContent = pens.length;
    byId('online-count').textContent = online.length + ' online · ' + (pens.length - online.length) + ' offline';
    byId('total-alerts').textContent = critical + warning;
    byId('severity-count').textContent = critical + ' critical · ' + warning + ' warning';
    for (const [id, index] of [['average-temp', 0], ['average-ammonia', 2]]) {
      const mean = online.reduce((sum, pen) => sum + pen.readings[index], 0) / online.length;
      byId(id).textContent = reading(mean, metrics[index]);
    }
    const priority = {Critical: 0, Warning: 1, Offline: 2};
    alerts.sort((a,b) => priority[a.status] - priority[b.status]);
    const alertLinks = alerts.map(alert => {
      const link = el('a');
      link.href = penUrl(alert.pen);
      link.append(el('strong', alert.title), el('small', alert.pen.name + ' · ' + alert.info), statusBadge(alert.status));
      return link;
    });
    byId('alert-list').replaceChildren(...alertLinks);
    if (!alertLinks.length) byId('alert-list').append(el('p', 'No recent alerts.'));
    for (const key of ['wifi','sms']) {
      const module = inventory.gatewayModules?.[key];
      byId(key + '-status').textContent = module ? (module.enabled ? 'Enabled' : 'Disabled') : 'Not configured';
    }
    checkedAt = Date.now();
    lastChecked();
    compare();
  }

  byId('comparison').addEventListener('click', event => {
    const button = event.target.closest('button[data-pen]');
    if (!button) return;
    selectedId = Number(button.dataset.pen);
    for (const row of byId('comparison').children) row.setAttribute('aria-pressed', row === button);
    detail(pens.find(pen => pen.id === selectedId));
    const panel = document.querySelector('.detail-panel');
    if (panel.getBoundingClientRect().top >= innerHeight) panel.scrollIntoView({block: 'nearest'});
  });
  document.querySelectorAll('[data-metric]').forEach(button => {
    button.addEventListener('click', () => switchMetric(Number(button.dataset.metric)));
  });
  document.querySelectorAll('[data-show]').forEach(button => {
    button.addEventListener('click', () => {
      switchMetric(Number(button.dataset.show));
      document.querySelector('.metric-switch [aria-pressed=true]').focus();
    });
  });
  byId('list-search').addEventListener('input', compare);
  byId('list-category').addEventListener('change', compare);
  let feedbackTimer;
  byId('refresh').addEventListener('click', () => {
    refresh();
    byId('refresh').textContent = 'Refreshed ✓';
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { byId('refresh').textContent = 'Refresh'; }, 1200);
  });
  window.addEventListener('storage', event => { if (!event.key || event.key === farmInventory.key) refresh(); });
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  setInterval(lastChecked, 60000);
  refresh();
});
