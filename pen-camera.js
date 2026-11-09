const penCamera = (() => {
  const get = id => document.getElementById(id);
  const selector = get('camera-source');
  const panel = get('camera-panel');
  const stage = get('feed-stage');
  const start = get('start-feed');
  const message = get('feed-message');
  let sources = [];
  let media = null;
  let request = 0;

  function stop() {
    request++;
    if (media) {
      media.onerror = media.onloadeddata = media.onload = null;
      if (media instanceof HTMLVideoElement) {
        media.pause();
        media.srcObject?.getTracks().forEach(track => track.stop());
        media.srcObject = null;
      }
      media.removeAttribute('src');
      if (media instanceof HTMLVideoElement) media.load();
      media.remove();
      media = null;
    }
    get('stop-feed').hidden = true;
    get('snapshot').disabled = get('fullscreen').disabled = true;
    start.hidden = false;
    message.hidden = false;
  }

  function selected() { return sources.find(source => source.id === selector.value); }
  function ready() {
    stop();
    const camera = selected();
    start.disabled = !camera || !(camera.local || camera.url);
    message.textContent = !camera ? 'No camera assigned to this pen.' : camera.local
      ? 'Start the local camera to see its feed.' : camera.url
      ? 'Ready to open ' + camera.name + '.' : 'Add a stream URL for this camera in Device Management.';
  }

  async function play() {
    stop();
    const camera = selected();
    if (!camera || !(camera.local || camera.url)) return ready();
    const token = request;
    start.hidden = true;
    get('stop-feed').hidden = false;
    message.textContent = 'Connecting to camera…';
    const isImage = !camera.local && camera.format === 'mjpeg';
    const player = document.createElement(isImage ? 'img' : 'video');
    media = player;
    player.hidden = true;
    stage.prepend(player);
    player.setAttribute('aria-label', camera.name + ' feed');
    const loaded = () => {
      if (request !== token) return;
      player.hidden = false;
      message.hidden = true;
      get('snapshot').disabled = false;
      get('fullscreen').disabled = !document.fullscreenEnabled;
    };
    const failed = reason => {
      if (request !== token) return;
      stop();
      message.textContent = reason;
    };
    player.onerror = () => failed('Feed unavailable. Check the stream address, format, and network connection.');
    if (isImage) {
      player.alt = camera.name;
      player.onload = loaded;
      player.src = camera.url;
      return;
    }
    player.muted = true;
    player.playsInline = true;
    player.autoplay = true;
    player.controls = true;
    player.onloadeddata = loaded;
    try {
      if (camera.local) {
        const video = camera.deviceId ? {deviceId: {exact: camera.deviceId}} : true;
        const stream = await navigator.mediaDevices.getUserMedia({video, audio: false});
        if (token !== request) { stream.getTracks().forEach(track => track.stop()); return; }
        player.srcObject = stream;
        stream.getVideoTracks()[0]?.addEventListener('ended', () => failed('Camera disconnected.'));
      } else player.src = camera.url;
      await player.play();
    } catch (error) {
      failed(error.name === 'NotAllowedError' ? 'Camera access was blocked. Allow camera access in your browser to try again.'
        : 'Could not open this feed. Check the camera connection or choose another source.');
    }
  }

  function show(cameras) {
    const old = selector.value;
    sources = [...cameras];
    if (navigator.mediaDevices?.getUserMedia && !sources.some(camera => camera.local)) {
      sources.push({id: 'local-preview', name: 'This device’s camera (preview)', local: true});
    }
    selector.replaceChildren(...sources.map(camera => new Option(camera.name, camera.id)));
    if (sources.some(camera => camera.id === old) && old !== 'local-preview') selector.value = old;
    selector.disabled = !sources.length;
    ready();
  }
  selector.addEventListener('change', ready);
  start.addEventListener('click', play);
  get('stop-feed').addEventListener('click', ready);
  panel.addEventListener('toggle', () => { if (!panel.open) ready(); });
  window.addEventListener('pagehide', ready);
  get('fullscreen').addEventListener('click', () => stage.requestFullscreen().catch(() => {}));
  get('snapshot').addEventListener('click', () => {
    if (!media) return;
    const canvas = document.createElement('canvas');
    canvas.width = media.videoWidth || media.naturalWidth;
    canvas.height = media.videoHeight || media.naturalHeight;
    try {
      canvas.getContext('2d').drawImage(media, 0, 0);
      const link = document.createElement('a');
      link.download = 'hogwatch-camera-snapshot.png';
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      message.hidden = false;
      message.textContent = 'This camera allows viewing but blocks exporting frames in the browser.';
    }
  });
  return {show};
})();
