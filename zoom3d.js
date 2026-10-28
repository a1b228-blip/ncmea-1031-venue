// 3D 頁面專用：放大縮小只作用在 3D 相機，不讓整個網頁（含上方分頁按鈕）跟著放大。
// 攔下觸控板捏合（Ctrl＋滾輪／Safari 手勢）與 ⌘＋、⌘－、⌘0，並在右下角放 ＋／－／重設 按鈕。
// 另有「✋ 平移／⟳ 旋轉」切換：平移模式下左鍵（或單指）拖曳就是抓著畫面移動。
export function installZoom({ cam, render, reset, controls, pan = false }) {
  controls.zoomToCursor = true;                                          // 滾輪以游標位置為中心縮放
  const zoomBy = f => {
    cam.zoom = Math.min(10, Math.max(0.3, cam.zoom * f));
    cam.updateProjectionMatrix(); render();
  };

  // 觸控板捏合會送出帶 ctrlKey 的 wheel；OrbitControls 會處理畫布上的縮放，這裡只負責擋掉整頁縮放
  addEventListener('wheel', e => { e.preventDefault(); }, { passive: false });
  const snapX = () => { if (scrollX !== 0) scrollTo(0, scrollY); };      // 網頁不左右偏移
  addEventListener('scroll', snapX, { passive: true }); snapX();
  // 觸控板雙指滑動（沒按 Ctrl）＝上下左右平移相機；捏合與滑鼠滾輪仍交給 OrbitControls 縮放
  const isTrackpad = e => e.deltaMode === 0 && (e.deltaX !== 0 || Math.abs(e.deltaY) < 50 || !Number.isInteger(e.deltaY));
  controls.domElement.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey || !isTrackpad(e)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const el = controls.domElement, perPx = (cam.right - cam.left) / cam.zoom / el.clientWidth;
    const right = new cam.position.constructor().setFromMatrixColumn(cam.matrix, 0);
    const up = new cam.position.constructor().setFromMatrixColumn(cam.matrix, 1);
    const move = right.multiplyScalar(e.deltaX * perPx).add(up.multiplyScalar(-e.deltaY * perPx));
    cam.position.add(move); controls.target.add(move); controls.update(); render();
  }, { passive: false, capture: true });
  let g0 = 1;                                                            // Safari 手勢
  addEventListener('gesturestart', e => { e.preventDefault(); g0 = e.scale; });
  addEventListener('gesturechange', e => { e.preventDefault(); zoomBy(e.scale / g0); g0 = e.scale; });
  addEventListener('gestureend', e => e.preventDefault());
  addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomBy(1.2); }
    else if (e.key === '-') { e.preventDefault(); zoomBy(1 / 1.2); }
    else if (e.key === '0') reset();                                     // 不攔 ⌘0，瀏覽器縮放也一起回到 100%
  });

  const css = document.createElement('style');
  css.textContent = `#zoom3d{position:absolute;right:2vw;bottom:1.5vw;display:flex;gap:6px;z-index:5}
    #zoom3d button{width:38px;height:38px;border:0;border-radius:10px;background:#fff;color:#1f2a37;font:600 20px/1 sans-serif;
      cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.15)}
    #zoom3d button:hover{background:#1f2a37;color:#fff}
    body.shot #zoom3d{display:none}
    @media (max-width:700px){
      #zoom3d{right:8px;bottom:8px;gap:4px}
      body:has(#view) #zoom3d{bottom:52px}
      #zoom3d button{width:36px;height:36px;font-size:18px}
      #zoom3d .lbl{display:none}
    }`;
  document.head.append(css);
  const bar = document.createElement('div');
  bar.id = 'zoom3d';
  bar.innerHTML = '<button title="切換左鍵：平移／旋轉" data-z="mode" style="width:auto;padding:0 12px;font-size:15px"></button><button title="放大 3D" data-z="in">＋</button><button title="縮小 3D" data-z="out">－</button><button title="重設視角" data-z="reset">⟲</button>';
  bar.addEventListener('click', e => {
    const z = e.target.closest('button')?.dataset.z;
    if (z === 'mode') setPan(!panOn);
    else if (z === 'in') zoomBy(1.25); else if (z === 'out') zoomBy(1 / 1.25); else if (z === 'reset') reset();
  });
  document.body.append(bar);

  let panOn = false;
  const modeBtn = bar.querySelector('[data-z="mode"]');
  function setPan(on) {
    panOn = on;
    controls.mouseButtons.LEFT = on ? 2 : 0;                             // 2＝PAN、0＝ROTATE
    controls.mouseButtons.RIGHT = on ? 0 : 2;
    controls.touches.ONE = on ? 1 : 0;                                   // 1＝PAN、0＝ROTATE
    modeBtn.innerHTML = on ? '✋<span class="lbl"> 平移中</span>' : '⟳<span class="lbl"> 旋轉中</span>';
    setCursor(on);
  }
  function setCursor(on) { const c = document.querySelector('canvas'); if (c) c.style.cursor = on ? 'grab' : ''; }
  setPan(pan);
  return { setPan };
}
