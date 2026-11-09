document.addEventListener("DOMContentLoaded", () => {

  // --- 2. Toast Notification System ---
  const customAlertToast = document.getElementById('customAlertToast') || document.getElementById('customAlert');
  const alertMessage = document.getElementById('alertMessage');
  const alertIcon = document.getElementById('alertIcon');
  let alertTimeout;

  function showToast(message, type = 'success') {
    if (!customAlertToast) return;
    
    customAlertToast.className = 'custom-alert';
    alertMessage.textContent = message;
    customAlertToast.classList.add(type);
    
    if (type === 'success') alertIcon.className = 'fa-solid fa-circle-check';
    else if (type === 'error') alertIcon.className = 'fa-solid fa-circle-exclamation';

    customAlertToast.classList.add('show-alert');
    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      customAlertToast.classList.remove('show-alert');
    }, 4000);
  }

  // --- 3. Custom Alert Builder Logic (settings-alerts.html) ---
  const addAlertModal = document.getElementById('addCustomAlertModal');
  const customAlertForm = document.getElementById('customAlertForm');
  
  if (addAlertModal && customAlertForm) {
    
    const list = document.getElementById('customAlertsList');
    const template = document.getElementById('alert-level-row');
    const byId = id => document.getElementById(id);
    const checks = [...customAlertForm.querySelectorAll('.trigger-check')];
    const fields = [...customAlertForm.querySelectorAll('.inline-input')];
    const metrics = ['Temp', 'Humidity', 'Ammonia'];
    const units = ['°C', '%', 'ppm'];
    const rules = new WeakMap();
    let editing = null;

    function renderRule(rule, row) {
      if (!row) {
        row = template.content.firstElementChild.cloneNode(true);
        list.append(row);
      }
      rules.set(row, rule);
      row.querySelector('.rule-name').textContent = rule.name;
      row.querySelector('.color-dot').style.backgroundColor = rule.color;
      const conditions = rule.thresholds.flatMap((value, i) =>
        value === null ? [] : [metrics[i] + ' > ' + value + units[i]]);
      const actions = [];
      if (rule.snapshot) actions.push('Take Snapshot');
      if (rule.record) actions.push('Start Recording');

      function fillCell(cell, target, lines) {
        const heading = document.createElement('strong');
        heading.textContent = 'Target: ' + target;
        cell.replaceChildren(heading);
        for (const line of lines.length ? lines : ['None']) {
          cell.append(document.createElement('br'), line);
        }
      }
      fillCell(row.cells[1], rule.sensors, conditions);
      fillCell(row.cells[2], rule.cameras, actions);
      if (rule.snapshot) row.cells[2].append(document.createElement('br'),
        'Limit: ' + rule.limit + ' snaps (' + rule.interval + 's apart)');
      byId('no-levels').hidden = true;
    }

    renderRule({name: 'Warning', color: '#f59e0b', sensors: 'All Sensors', cameras: 'Triggered Pen Camera',
      thresholds: ['28', null, '20'], snapshot: true, record: false, limit: '3', interval: '5'});
    renderRule({name: 'Critical', color: '#ef4444', sensors: 'All Sensors', cameras: 'All Cameras',
      thresholds: ['32', null, '25'], snapshot: true, record: true, limit: '5', interval: '2'});

    function openRule(row = null) {
      editing = row;
      customAlertForm.reset();
      if (row) {
        const rule = rules.get(row);
        byId('alertNameInput').value = rule.name;
        byId('alertColorInput').value = rule.color;
        byId('targetSensorsInput').value = rule.sensors;
        byId('targetCamerasInput').value = rule.cameras;
        byId('actionSnapshot').checked = rule.snapshot;
        byId('actionRecord').checked = rule.record;
        byId('snapLimitInput').value = rule.limit;
        byId('snapIntervalInput').value = rule.interval;
        rule.thresholds.forEach((value, i) => {
          checks[i].checked = value !== null;
          fields[i].value = value ?? '';
        });
      }
      fields.forEach((field, i) => field.required = checks[i].checked);
      byId('hexDisplay').textContent = byId('alertColorInput').value.toUpperCase();
      addAlertModal.classList.remove('hidden');
      byId('alertNameInput').focus();
    }
    const closeRule = () => addAlertModal.classList.add('hidden');
    byId('openAddAlertModalBtn').addEventListener('click', () => openRule());
    addAlertModal.querySelectorAll('.close-modal-btn, .cancel-modal-btn').forEach(button =>
      button.addEventListener('click', closeRule));
    byId('alertColorInput').addEventListener('input', event =>
      byId('hexDisplay').textContent = event.target.value.toUpperCase());
    checks.forEach((check, i) => check.addEventListener('change', () => fields[i].required = check.checked));

    list.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      const row = button.closest('tr');
      if (button.classList.contains('edit-btn')) openRule(row);
      else if (button.classList.contains('delete-btn') && confirm('Remove the ' + rules.get(row).name + ' alert level?')) {
        row.remove();
        byId('no-levels').hidden = list.rows.length > 0;
      }
    });

    customAlertForm.addEventListener('submit', event => {
      event.preventDefault();
      renderRule({
        name: byId('alertNameInput').value, color: byId('alertColorInput').value,
        sensors: byId('targetSensorsInput').value, cameras: byId('targetCamerasInput').value,
        thresholds: fields.map((field, i) => checks[i].checked ? field.value : null),
        snapshot: byId('actionSnapshot').checked, record: byId('actionRecord').checked,
        limit: byId('snapLimitInput').value, interval: byId('snapIntervalInput').value
      }, editing);
      closeRule();
      showToast('Alert level saved.');
    });

    document.getElementById('saveGlobalBtn')?.addEventListener('click', () => {
      showToast("Global settings saved.");
    });
  }

  // --- 4. Other Standard Forms (Account, Security, Cameras) ---
  const accountForm = document.getElementById('accountForm');
  if (accountForm) {
    accountForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast("Account profile updated successfully!");
    });
  }

  const passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = passwordForm.querySelectorAll('input[type="password"]');
      if (inputs[1].value !== inputs[2].value) {
        showToast("New passwords do not match.", "error");
      } else {
        showToast("Password updated successfully!");
        passwordForm.reset();
      }
    });
  }

  const cameraSettingsForm = document.getElementById('cameraSettingsForm');
  if (cameraSettingsForm) {
    cameraSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast("Camera and recording settings updated successfully!");
    });
  }

});