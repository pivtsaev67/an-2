/*
 * 360°-просмотр по серии фотографий (turntable): 24–36 кадров по кругу.
 * Перетаскивание мышью/пальцем, инерция, автоповорот, колесо — зум.
 */
export function createFrameViewer(container, frames, opts = {}) {
  const { autoRotate = true, fps = 18 } = opts;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  container.appendChild(canvas);

  const imgs = frames.map(src => { const i = new Image(); i.decoding = 'async'; i.src = src; return i; });
  let loaded = 0;
  const progress = document.createElement('div');
  progress.className = 'v360-progress';
  container.appendChild(progress);
  imgs.forEach(i => {
    const done = () => { loaded++; progress.style.setProperty('--p', loaded / imgs.length); if (loaded === imgs.length) progress.remove(); draw(); };
    i.onload = done; i.onerror = done;
  });

  let pos = 0, vel = 0, dragging = false, lastX = 0, auto = autoRotate, idle = 0, zoom = 1, raf = 0;
  const n = frames.length;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = container.clientWidth * dpr; canvas.height = container.clientHeight * dpr;
    draw();
  }
  function draw() {
    const i = ((Math.round(pos) % n) + n) % n;
    const img = imgs[i];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img || !img.complete || !img.naturalWidth) return;
    const s = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight) * zoom;
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  }
  function tick(t) {
    if (!dragging) {
      if (Math.abs(vel) > .01) { pos += vel; vel *= .94; }
      else if (auto && performance.now() - idle > 2500) pos += fps / 60;
    }
    draw();
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  const px = e => (e.touches ? e.touches[0].clientX : e.clientX);
  const down = e => { dragging = true; lastX = px(e); vel = 0; container.classList.add('is-dragging'); };
  const move = e => {
    if (!dragging) return;
    const x = px(e), dx = x - lastX; lastX = x;
    const step = dx / (container.clientWidth / n) * 1.2;
    pos -= step; vel = -step;
  };
  const up = () => { if (!dragging) return; dragging = false; idle = performance.now(); container.classList.remove('is-dragging'); };
  const wheel = e => { e.preventDefault(); zoom = Math.min(2.2, Math.max(1, zoom - e.deltaY * .001)); };

  canvas.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  canvas.addEventListener('wheel', wheel, { passive: false });
  const ro = new ResizeObserver(resize); ro.observe(container);

  return {
    setAutoRotate(v) { auto = v; },
    resetView() { zoom = 1; },
    setColor() {}, setProduct() {},
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      canvas.remove(); progress.remove();
    }
  };
}
