// 急救情境預案：3D 實景動畫（含語音）。
// 每個狀況卡片直接內嵌 er3d_s1.html（方案跟著 emergency.html?plan=… 同步）；
// 在 3D 畫面按「下一步」一步一步看，語音從第一次按下才開始。
// 焦點在本頁時，鍵盤 → ← 轉給畫面上最中間那個 3D 動畫。
// 依賴 emergency.html 的全域：plan、SCN。
(() => {
  const url3d = id => `er3d_s1.html?scene=${id}&plan=${plan}`;
  for (const { id } of SCN) {
    const fig = document.querySelector(`#${id} + .scn .fig`);
    const bar = document.createElement('div');
    bar.className = 'anim-bar';
    bar.innerHTML = `<a class="anim-link full" href="${url3d(id)}" target="_blank" rel="noopener">⛶ 全螢幕開啟 3D 動畫</a>` +
      `<a class="anim-link char" href="character_select.html" target="_blank" rel="noopener">🎨 人物造型 3 選 1</a>` +
      `<span class="anim-tip">在 3D 畫面按「下一步」一步一步看；鍵盤 → 前進、← 退回</span>`;
    fig.append(bar);
  }

  const frameInView = () => {
    let best = null, bestD = Infinity;
    for (const f of document.querySelectorAll('iframe.er3d')) {
      const r = f.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const d = Math.abs((r.top + r.bottom) / 2 - innerHeight / 2);
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  };
  addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const btn = frameInView()?.contentDocument?.getElementById(e.key === 'ArrowRight' ? 'btnNext' : 'btnPrev');
    if (!btn) return;
    e.preventDefault();
    if (!btn.disabled) btn.click();
  });
})();
