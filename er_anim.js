// 急救情境預案：3D 實景動畫（含語音）。
// 點狀況卡片的 3D 封面或「▶ 動畫講解」→ 在卡片內嵌 er3d_s1.html，並自動放大成整列寬；
// 方案跟著急救預案頁（emergency.html?plan=…）同步。鍵盤 → 前進、← 退回、Esc 結束。
// 依賴 emergency.html 的全域：plan、SCN。
(() => {
  let cur = null;                                        // 目前播放中的狀況 { goTo, exit }

  const url3d = (id, embed) => `er3d_s1.html?scene=${id}&plan=${plan}${embed ? '&embed=1' : ''}`;
  const extraLinks = id => `<a class="anim-link full" href="${url3d(id)}" target="_blank" rel="noopener">⛶ 全螢幕開啟 3D 動畫</a>` +
    `<a class="anim-link char" href="character_select.html" target="_blank" rel="noopener">🎨 人物造型 3 選 1</a>`;
  const startButton = id => `<button class="anim-start" data-id="${id}">▶ 動畫講解（含語音）</button>` + extraLinks(id) +
    `<span class="anim-tip">按「下一步」或鍵盤 → 前進、← 退回</span>`;

  function mount3d(id) {
    const card = document.querySelector(`#${id} + .scn .fig`);
    const poster = card.querySelector('.poster'), bar = card.querySelector('.anim-bar');
    card.parentElement.classList.add('playing');
    poster.hidden = true;
    const frame = document.createElement('iframe');
    frame.className = 'er3d';
    frame.title = '3D 實景急救動畫';
    frame.allow = 'autoplay; fullscreen';
    frame.src = url3d(id, true);
    poster.after(frame);
    bar.innerHTML = `<div class="anim-ctl"><button data-a="exit">✕ 結束 3D 動畫</button>${extraLinks(id)}</div>`;
    const press = btnId => frame.contentDocument?.getElementById(btnId)?.click();
    function exit() {
      frame.remove(); poster.hidden = false; cur = null;
      card.parentElement.classList.remove('playing');
      bar.innerHTML = startButton(id);
    }
    bar.onclick = e => { if (e.target.closest('button')?.dataset.a === 'exit') exit(); };
    cur = { goTo: d => press(d > 0 ? 'btnNext' : 'btnPrev'), exit };
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const start = id => { if (cur) cur.exit(); mount3d(id); };

  for (const { id } of SCN) {
    const fig = document.querySelector(`#${id} + .scn .fig`);
    const bar = document.createElement('div');
    bar.className = 'anim-bar';
    bar.innerHTML = startButton(id);
    fig.append(bar);
    bar.addEventListener('click', e => { if (e.target.closest('.anim-start')) start(id); });
    const poster = fig.querySelector('.poster');
    poster.addEventListener('click', () => start(id));
    poster.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(id); } });
  }
  addEventListener('keydown', e => {
    if (!cur) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); cur.goTo(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); cur.goTo(-1); }
    else if (e.key === 'Escape') cur.exit();
  });
})();
