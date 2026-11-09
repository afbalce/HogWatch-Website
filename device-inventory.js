// Shared browser inventory for the device register and monitoring pens.
const farmInventory = (() => {
  const key = 'hogwatch.farmInventory.v1';
  const sensorTypes = {co2: 'CO₂', ammonia: 'Ammonia', temperature: 'Temperature', humidity: 'Humidity'};
  const samples = [
    {id: 1, status: 'OK', readings: [26.8, 62, 12]},
    {id: 2, status: 'Warning', readings: [29.1, 70, 17], alerts: [
      ['Warning', 'Temperature above target', '29.1 °C · target up to 28 °C · 38 min ago']
    ]},
    {id: 3, status: 'OK', readings: [27.0, 60, 11]},
    {id: 4, status: 'Critical', readings: [28.4, 74, 27], alerts: [
      ['Critical', 'Ammonia above limit', '27 ppm · limit 25 ppm · 12 min ago'],
      ['Warning', 'Sensor S-09 battery low', '14% remaining · threshold 15% · 1 h ago']
    ]},
    {id: 5, status: 'OK', readings: [26.2, 58, 10]},
    {id: 6, status: 'Offline', alerts: [['Offline', 'Sensor S-11 offline', 'Last reported 2 h ago']]}
  ];
  // Nominal wattages supplied with the demo inventory.
  const sampleWatts = {'HW-SENS-001': 0.12, 'HW-SENS-009': 0.15, 'HW-CAM-101': 3.5,
    'HW-SENS-CO2': 0.35, 'HW-SENS-RH': 0.08, 'HW-FAN-01': 30, 'HW-SPR-01': 24};
  const initial = {
    pens: [],
    devices: [
      {id: 'HW-SENS-001', name: 'S-01 Env Sensor', type: 'sensor', measurement: 'temperature', pens: [1]},
      {id: 'HW-CAM-101', name: 'Cam-01 Overhead', type: 'camera', pens: [1, 2]},
      {id: 'HW-SENS-009', name: 'S-09 Env Sensor', type: 'sensor', measurement: 'ammonia', pens: [4]},
      {id: 'HW-SENS-CO2', name: 'CO₂ probe', type: 'sensor', measurement: 'co2', pens: []},
      {id: 'HW-SENS-RH', name: 'Humidity probe', type: 'sensor', measurement: 'humidity', pens: []}
    ]
  };
  function read() {
    const stored = localStorage.getItem(key);
    const state = stored ? JSON.parse(stored) : structuredClone(initial);
    if (state.version !== 2) {
      const ids = new Set(state.pens);
      try {
        const older = JSON.parse(sessionStorage.getItem('hogwatch.extraMonitoringPens') || '[]');
        if (Array.isArray(older)) older.forEach(id => ids.add(id));
      } catch { /* The session store is optional. */ }
      state.pens = samples.map(({id}) => ({id, sample: id}));
      for (const id of ids) {
        if (Number.isInteger(id) && id > 6 && id <= 9999) state.pens.push({id});
      }
      state.version = 2;
    }
    // Earlier inventories did not store the measurement for the two demo probes.
    for (const device of state.devices) {
      if (device.type === 'sensor' && !device.measurement) {
        const sample = initial.devices.find(item => item.id === device.id && item.type === 'sensor');
        if (sample) device.measurement = sample.measurement;
      }
    }
    if (!state.climateInitialized) {
      const defaults = [
        {id: 'HW-FAN-01', type: 'fan', name: 'Ventilation fan', pens: [], on: false},
        {id: 'HW-SPR-01', type: 'sprinkler', name: 'Sprinkler', pens: [], capacity: 100, water: 75, flow: 5, seconds: 60}
      ];
      for (const device of defaults) {
        while (state.devices.some(item => item.id === device.id)) device.id += '-demo';
        state.devices.push(device);
      }
      state.climateInitialized = true;
    }
    for (const device of state.devices) {
      if (device.watts === undefined) device.watts = Object.hasOwn(sampleWatts, device.id) ? sampleWatts[device.id] : null;
    }
    return state;
  }
  function change(edit) {
    const state = read();
    edit(state);
    localStorage.setItem(key, JSON.stringify(state));
    return state;
  }
  function locationName(device) {
    return device.pens.length ? 'Pen ' + device.pens.join(' & ') : device.area || 'Unassigned';
  }
  function monitoringPens(state = read()) {
    return state.pens.map(pen => ({
      status: 'Offline', ...samples.find(sample => sample.id === pen.sample), ...pen,
      name: pen.name || 'Pen ' + pen.id
    })).sort((a, b) => a.id - b.id);
  }
  function sensorLabel(device) {
    return sensorTypes[device.measurement] || "Unspecified";
  }
  return {read, change, locationName, monitoringPens, sensorTypes, sensorLabel, key};
})();
