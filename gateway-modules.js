// Gateway module configuration is kept alongside this browser's farm inventory.
(() => {
  const byId = id => document.getElementById(id);
  const dialog = byId('gateway-dialog');
  const cards = document.querySelectorAll('.gateway-link');
  const modules = {
    wifi: {name: 'Wi-Fi adapter', network: 'Network name (SSID)', maxLength: 32},
    sms: {name: 'SMS modem', network: 'Mobile carrier', maxLength: 80}
  };
  let editing;

  function render() {
    const settings = farmInventory.read().gatewayModules || {};
    for (const card of cards) {
      const type = card.dataset.module;
      const saved = settings[type];
      const badge = card.querySelector('.badge');
      badge.textContent = saved ? (saved.enabled ? 'Enabled' : 'Disabled') : 'Not configured';
      badge.className = 'badge ' + (saved?.enabled ? 'badge-ok' : 'badge-offline');
      card.querySelector('.module-detail').textContent = saved
        ? saved.name + ' · ' + saved.network
        : modules[type].network + ' not set';
    }
  }

  for (const card of cards) {
    card.querySelector('button').addEventListener('click', () => {
      editing = card.dataset.module;
      const module = modules[editing];
      const saved = farmInventory.read().gatewayModules?.[editing];
      byId('gateway-dialog-title').textContent = 'Configure ' + module.name;
      byId('gateway-device').value = saved?.name || module.name;
      byId('gateway-network-label').textContent = module.network;
      byId('gateway-network').maxLength = module.maxLength;
      byId('gateway-network').value = saved?.network || '';
      byId('gateway-enabled').checked = saved?.enabled ?? true;
      byId('gateway-error').textContent = '';
      dialog.showModal();
      byId('gateway-network').focus();
    });
  }
  byId('gateway-cancel').addEventListener('click', () => dialog.close());
  byId('gateway-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = byId('gateway-device').value.trim();
    const network = byId('gateway-network').value;
    if (!name || !network.trim()) {
      byId('gateway-error').textContent = 'Enter a device name and ' + modules[editing].network.toLowerCase() + '.';
      return;
    }
    if (editing === 'wifi' && new TextEncoder().encode(network).length > 32) {
      byId('gateway-error').textContent = 'The network name must fit within 32 bytes.';
      return;
    }
    try {
      farmInventory.change(state => {
        state.gatewayModules ??= {};
        state.gatewayModules[editing] = {name, network, enabled: byId('gateway-enabled').checked};
      });
    } catch {
      byId('gateway-error').textContent = 'The configuration could not be saved in this browser.';
      return;
    }
    dialog.close();
    render();
  });
  window.addEventListener('storage', event => { if (event.key === farmInventory.key) render(); });
  byId('refresh-power').addEventListener('click', render);
  window.addEventListener('pageshow', render);
  render();
})();
