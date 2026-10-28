// 圖片／SVG 專用的放大與抓取平移：只縮放框內的圖，不影響網頁其他內容。
// 用法：panZoom(容器, { wheelZoom })；容器內第一個元素就是要縮放的圖。
//   wheelZoom=true：一般滾輪就縮放（整頁只有這張圖時用）；false：要按 Ctrl/⌘ 或捏合才縮放，一般滾輪照常捲動頁面。
// 每個容器各自記住自己的縮放狀態，彼此獨立。
// 觸控板的 wheel 有水平分量或細碎的位移量；滑鼠滾輪通常是整格（±100 左右）
window.isTrackpad = e => e.deltaMode === 0 && (e.deltaX !== 0 || Math.abs(e.deltaY) < 50 || !Number.isInteger(e.deltaY));

window.panZoom = function (box, { wheelZoom = false } = {}) {
  const el = box.firstElementChild;
  let s = 1, x = 0, y = 0;
  const MIN = 1, MAX = 8;
  if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
  Object.assign(box.style, { overflow: 'hidden', touchAction: 'none' });
  Object.assign(el.style, { transformOrigin: '0 0', willChange: 'transform', userSelect: 'none' });
  el.draggable = false;

  const apply = () => {
    // 放大後不讓圖被拖出框外
    const w = box.clientWidth, h = box.clientHeight;
    x = Math.min(0, Math.max(w - w * s, x)); y = Math.min(0, Math.max(h - h * s, y));
    el.style.transform = `translate(${x}px,${y}px) scale(${s})`;
    box.style.cursor = s > 1 ? 'grab' : '';
    hud.textContent = `${Math.round(s * 100)}%`;
  };
  const zoomAt = (k, px, py) => {                    // 以 (px,py) 為中心縮放
    const ns = Math.min(MAX, Math.max(MIN, s * k)); k = ns / s;
    x = px - (px - x) * k; y = py - (py - y) * k; s = ns; apply();
  };
  const center = () => [box.clientWidth / 2, box.clientHeight / 2];
  const reset = () => { s = 1; x = 0; y = 0; apply(); };

  // 捏合（帶 Ctrl 的 wheel）＝縮放；觸控板雙指滑動＝上下左右平移；滑鼠滾輪＝縮放（wheelZoom 時）
  box.addEventListener('wheel', e => {
    const r = box.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.01), px, py); return; }
    if (isTrackpad(e)) {
      if (s > 1) { e.preventDefault(); x -= e.deltaX; y -= e.deltaY; apply(); }
      else if (wheelZoom) e.preventDefault();                          // 整頁只有這張圖時，不讓手勢帶動網頁
      return;
    }
    if (wheelZoom) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), px, py); }
  }, { passive: false });
  let g0 = 1;                                         // Safari 捏合手勢
  box.addEventListener('gesturestart', e => { e.preventDefault(); g0 = e.scale; });
  box.addEventListener('gesturechange', e => { e.preventDefault(); zoomAt(e.scale / g0, ...center()); g0 = e.scale; });

  // 抓取平移（滑鼠或單指），雙指捏合縮放
  const pts = new Map(); let last = null, pinch = null;
  box.addEventListener('pointerdown', e => {
    if (e.target.closest('.pz-ctl')) return;
    box.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    last = [e.clientX, e.clientY]; if (s > 1) box.style.cursor = 'grabbing';
  });
  box.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const r = box.getBoundingClientRect();
      if (pinch) zoomAt(d / pinch, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top);
      pinch = d; return;
    }
    if (s > 1 && last) { x += e.clientX - last[0]; y += e.clientY - last[1]; apply(); }
    last = [e.clientX, e.clientY];
  });
  const up = e => { pts.delete(e.pointerId); pinch = null; last = null; if (s > 1) box.style.cursor = 'grab'; };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('dblclick', reset);
  new ResizeObserver(apply).observe(box);

  // 右下角控制鈕
  const ctl = document.createElement('div');
  ctl.className = 'pz-ctl';
  ctl.innerHTML = '<span class="pz-hud"></span><button data-z="in" title="放大">＋</button><button data-z="out" title="縮小">－</button><button data-z="reset" title="還原（也可雙擊圖片）">⟲</button>';
  const hud = ctl.querySelector('.pz-hud');
  ctl.addEventListener('click', e => {
    const z = e.target.closest('button')?.dataset.z;
    if (z === 'in') zoomAt(1.3, ...center()); else if (z === 'out') zoomAt(1 / 1.3, ...center()); else if (z === 'reset') reset();
  });
  box.append(ctl);
  if (!document.getElementById('pz-css')) {
    const css = document.createElement('style'); css.id = 'pz-css';
    css.textContent = `.pz-ctl{position:absolute;right:10px;bottom:10px;display:flex;gap:6px;align-items:center;z-index:3}
      .pz-ctl button{width:34px;height:34px;border:0;border-radius:9px;background:#fff;color:#1f2a37;font:600 18px/1 sans-serif;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.18)}
      .pz-ctl button:hover{background:#1f2a37;color:#fff}
      .pz-hud{font:600 12px/1 sans-serif;color:#4b5563;background:rgba(255,255,255,.9);border-radius:6px;padding:4px 6px}`;
    document.head.append(css);
  }
  apply();
  return { reset };
};
