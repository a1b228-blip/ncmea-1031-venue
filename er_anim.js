// 急救情境預案：分步動畫＋語音講解。
// 按「下一步」或鍵盤 → 前進、← 退回；每一步自動播放該步語音（預設開聲音，可靜音）。
// 「▶ 動畫講解」預設內嵌 3D 實景動畫（er3d_s1.html）；原 2D 平面動畫改為「2D 平面動畫」按鈕。
// 依賴 emergency.html 的全域：plan、ROOM、ZONE、pt、route、svgFor、annieIcon、nurseIcon、spIcon、C。
(() => {
  // ── 小工具 ────────────────────────────────────────
  let token = 0;                                         // 換步時遞增，舊動畫立刻停止
  const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const tween = (ms, fn) => new Promise(res => {
    const my = token;
    if (!ms) { fn(1); return res(); }
    const t0 = performance.now();
    const tick = now => {
      if (my !== token) return res();                    // 已換步：舊動畫直接停止，不再改動畫面
      const k = Math.min(1, (now - t0) / ms);
      fn(ease(k));
      k < 1 ? requestAnimationFrame(tick) : res();
    };
    requestAnimationFrame(tick);
  });
  const sleep = ms => tween(ms, () => {});
  function along(pts, k) {                               // 折線上比例 k 的位置
    const seg = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); total += d; }
    let t = k * total;
    for (let i = 0; i < seg.length; i++) {
      if (t <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, t / seg[i]) : 1; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; }
      t -= seg[i];
    }
    return pts[pts.length - 1];
  }
  const el = (tag, attrs = {}, html = '') => {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (html) e.innerHTML = html;
    return e;
  };

  // ── 角色外觀 ──────────────────────────────────────
  const circleRT = t => `<circle r="17" fill="${C.rt}" stroke="#fff" stroke-width="2.5"/><text y="6" font-size="17" font-weight="800" text-anchor="middle" fill="#fff">${t}</text>`;
  const LOOK = {
    mk: () => `<g transform="scale(1.2)">${annieIcon()}</g>`,
    rn: () => nurseIcon(18), sp: () => spIcon(18),
    rta: () => circleRT('A'), rtb: () => circleRT('B'), rtc: () => circleRT('C'),
    cart: () => `<rect x="-30" y="-15" width="60" height="30" rx="6" fill="${C.cart}" stroke="#7f1d1d" stroke-width="2"/><text y="5" font-size="14" font-weight="800" text-anchor="middle" fill="#fff">急救車</text>`,
    team: () => `<rect x="-34" y="-15" width="68" height="30" rx="8" fill="#047857" stroke="#fff" stroke-width="2"/><text y="5" font-size="13" font-weight="800" text-anchor="middle" fill="#fff">🩺急救小組</text>`,
    fam: () => `<circle r="16" fill="#e5e7eb" stroke="${C.fam}" stroke-width="2"/><text y="5" font-size="13" font-weight="700" text-anchor="middle" fill="#374151">家屬</text>`,
  };

  // ── 共用：房間內站位、門口位置、共同步驟 ──────────────────
  const DOOR = { A: [636, 223], B: [292, 267] };            // 等候區通往該房間的門口
  function layout(z) {
    const Z = ZONE[z], cx = Z.x + Z.w / 2, cy = Z.y + Z.h / 2;
    return {
      Z, M: [cx, cy + 6],
      compress: [cx - 8, cy + 58], airway: [cx - 84, cy + 6],
      nurseEnd: [cx + 84, cy + 56], nursePads: [cx + 40, cy + 44],
      cartEnd: [cx + 78, cy - 52], cartHome: [Z.x + Z.w - 46, Z.y + 62],
      o2: [Z.x + 36, Z.y + 26],
      bl: [Z.x + 40, Z.y + Z.h - 34], br: [Z.x + Z.w - 40, Z.y + Z.h - 34], mid: [cx, cy + 10],
    };
  }
  const off = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
  const WAIT_M = [272, 228];                                 // 等候區推床位置
  const WAIT_FAM = [430, 222];
  const stepD = L => ({ t: 'D 電擊', ph: 5, cap: '<b>護理師貼電擊片</b>、判讀心律，喊「<b>大家離開</b>」後放電；放電後<b>立刻接著壓胸</b>。', on: ['rn', 'mk', 'cart'],
    run: async S => {
      await S.move('rn', L.nursePads, 900); S.bubble('rn', '貼電擊片'); S.set({ pads: true, leader: 'rn', leadText: '隊長' });
      await sleep(S.instant ? 0 : 1200); S.clearBubbles();
      await S.move('rn', L.nurseEnd, 700);
      S.set({ cpr: false }); S.bubble('rn', '大家離開！'); await S.bolt(S.pos.mk); S.set({ cpr: true });
    } });
  const ENTRY = [711, 104], ENTRY_IN = [711, 196];            // 進出大門外、門內（檢查室 A）
  const stepEnd = (L, z, a, b, extra = '') => ({ t: '等待支援・ISBAR 交班', cap: `兩位放射師每 2 分鐘<b>換手壓胸</b>${extra}，等待<b>醫療支援（急救小組）</b>到場；由<b>護理師隊長用 ISBAR 交班</b>。`, on: ['rn', a, b, 'mk', 'team'],
    run: async S => {
      await Promise.all([S.move(a, L.compress, 1300), S.move(b, L.airway, 1300)]); S.set({ o2: [L.o2, L.airway] });
      const into = z === 'A' ? [ENTRY, ENTRY_IN, [L.nurseEnd[0] + 2, L.nurseEnd[1] - 74]] : [ENTRY, ENTRY_IN, ...route('A', z).slice(1), [L.nurseEnd[0] + 2, L.nurseEnd[1] - 74]];
      await S.path({ team: into }, 3200);
      S.set({ handover: true });                         // 護理師與急救小組之間：ISBAR 交班
    } });
  const stepCall0 = (who, label, L, spot) => ({ t: '叫：叫喚', ph: 0, cap: `${label}<b>拍肩、大聲呼喚</b>，10 秒內檢查<b>呼吸與頸動脈</b> → 沒有反應、沒有呼吸。`, on: [who, 'mk'],
    run: async S => { await S.move(who, spot, 1200); S.bubble(who, '先生！先生！'); } });
  const isolate = (who, z, back) => async S => {           // 到等候區請家屬在外等候、關門，再回房
    await S.path({ [who]: [[...S.pos[who]], ...route(z, 'wait').slice(1, -1), [WAIT_FAM[0] - 30, WAIT_FAM[1] + 6]] }, 1800);
    S.bubble(who, '請在外面稍候'); await sleep(S.instant ? 0 : 1100); S.clearBubbles();
    S.set({ door: DOOR[z] });
    await S.path({ [who]: [[...S.pos[who]], ...route('wait', z).slice(1, -1), back] }, 1800);
  };

  // ── 狀況二：假人在 X 光室，標準病人在 CT 室（依叫叫 CABD 流程）───────
  // ph：對應 CABD 進度條（0 叫喚、1 叫人、2 C、3 A、4 B、5 D）
  function scenario2() {
    const xr = ROOM.xray, ct = ROOM.ct;
    const Z = ZONE[xr], cx = Z.x + Z.w / 2, cy = Z.y + Z.h / 2;
    const M = [cx, cy + 6];                                // 假人在房間中央
    const at = {
      compress: [cx - 8, cy + 58],                         // 壓胸：在假人下方
      airway: [cx - 84, cy + 6],                           // 通氣：在假人頭側（左）
      nurseEnd: [cx + 84, cy + 56],                        // 護理師：右下
      nursePads: [cx + 40, cy + 44],                       // 貼電擊片時靠近假人胸口
      cartEnd: [cx + 78, cy - 52],                         // 急救車：右上角
      o2: [Z.x + 36, Z.y + 26],
      cEnd: [pt(ct, 0)[0] + 56, pt(ct, 0)[1] - 4],
    };
    const r = route(ct, xr);
    return {
      audio: i => `audio/s2_${i}.mp3`,
      start: { mk: M, rta: [Z.x + 40, Z.y + Z.h - 34], rtb: [Z.x + Z.w - 40, Z.y + Z.h - 34], rn: pt(ct, 3), cart: pt(ct, 4), rtc: pt(ct, 1), sp: pt(ct, 0) },
      steps: [
        { t: '開場', cap: '狀況二：模擬假人在 X 光室需要急救，標準病人在 CT 室。依<b>叫叫 CABD</b> 流程進行。', on: [], run: async () => {} },
        { t: '叫：叫喚', ph: 0, cap: 'X 光放射師 B <b>拍肩、大聲呼喚</b>，10 秒內檢查<b>呼吸與頸動脈</b> → 沒有反應、沒有呼吸。', on: ['rtb', 'mk'],
          run: async S => { await S.move('rtb', at.compress, 1200); S.bubble('rtb', '先生！先生！'); } },
        { t: '叫：叫人', ph: 1, cap: '<b>A 暫代隊長</b>，用控制台手機撥 <b>999</b>，說出地點「X 光室」。999 是<b>全院廣播</b>，所有人同時收到。', on: ['rta'],
          run: async S => { S.set({ leader: 'rta', leadText: '暫代隊長' }); await S.wave(S.pos.rta); S.set({ banner: '📢 999 全院廣播：X 光室急救' }); } },
        { t: 'C 胸外按壓', ph: 2, cap: '<b>B 立刻壓胸</b>：用力壓、快快壓，急救車到之前不能停。', on: ['rtb', 'mk'],
          run: async S => { S.set({ cpr: true }); } },
        { t: 'A 打開呼吸道', ph: 3, cap: 'A 走到病人頭側，<b>壓額抬下巴</b>打開呼吸道。<b>甦醒球在急救車上</b>，車到之前先維持呼吸道暢通，B 持續壓胸。', on: ['rta', 'mk'],
          run: async S => { await S.move('rta', at.airway, 1200); S.bubble('rta', '壓額抬下巴'); } },
        { t: '護理師推急救車', cap: '同時，CT 室護理師聽到廣播，<b>推著急救車（甦醒球在車上）</b>經走道、等候區趕到；<b>CT 放射師留守</b>照顧標準病人。', on: ['rn', 'cart', 'rtc', 'sp'],
          run: async S => { await Promise.all([S.path({ cart: [pt(ct, 4), ...r.slice(1), at.cartEnd], rn: [pt(ct, 3), ...r, at.nurseEnd] }, 4800), S.move('rtc', at.cEnd, 1000)]); } },
        { t: '交接指揮', cap: '護理師到場：「<b>由我指揮</b>」；A 用 <b>ISBAR</b> 簡短交班（倒下時間、壓胸幾分鐘、已撥 999）。', on: ['rn', 'rta'],
          run: async S => { S.bubble('rn', '由我指揮！'); await sleep(S.instant ? 0 : 900); S.bubble('rta', 'ISBAR 交班', true); await S.moveLeader('rn', '隊長', 1000); } },
        { t: 'B 人工呼吸', ph: 4, cap: '急救車到了，A 從急救車<b>拿出甦醒球</b>，接上<b>牆上氧氣</b>開始通氣；壓胸 30 下、通氣 2 次。', on: ['rta', 'mk', 'cart'],
          run: async S => {
            const from = [...S.pos.rta];
            await S.move('rta', [at.cartEnd[0] - 40, at.cartEnd[1] + 8], 900); S.bubble('rta', '拿甦醒球');   // 到急救車拿甦醒球
            await sleep(S.instant ? 0 : 700); S.clearBubbles();
            await S.move('rta', from, 900); S.set({ o2: [at.o2, at.airway] }); S.bubble('rta', '30：2');
          } },
        { t: 'D 電擊', ph: 5, cap: '<b>護理師貼電擊片</b>、判讀心律，喊「<b>大家離開</b>」後放電；放電後<b>立刻接著壓胸</b>。', on: ['rn', 'mk', 'cart'],
          run: async S => {
            await S.move('rn', at.nursePads, 900); S.bubble('rn', '貼電擊片'); S.set({ pads: true, leader: 'rn', leadText: '隊長' });
            await sleep(S.instant ? 0 : 1200); S.clearBubbles();
            await S.move('rn', at.nurseEnd, 700);                 // 放電前退開
            S.set({ cpr: false }); S.bubble('rn', '大家離開！'); await S.bolt(M); S.set({ cpr: true });
          } },
        stepEnd(layout(xr), xr, 'rta', 'rtb'),
      ],
    };
  }

  // ── 狀況一：假人在 CT 室，標準病人在 X 光室 ───────────────
  function scenario1() {
    const xr = ROOM.xray, ct = ROOM.ct, L = layout(ct), X = layout(xr);
    const sp = X.mid, spCare = [sp[0] + 52, sp[1] + 4];
    return {
      audio: i => `audio/s1_${i}.mp3`,
      start: { mk: L.M, rtc: L.bl, rn: L.br, cart: L.cartHome, rta: X.bl, rtb: X.br, sp },
      steps: [
        { t: '開場', cap: '狀況一：模擬假人在 CT 室需要急救，標準病人在 X 光室。<b>急救車和護理師都在現場</b>，最有利。', on: [], run: async () => {} },
        stepCall0('rtc', 'CT 放射師', L, L.compress),
        { t: '叫：叫人', ph: 1, cap: '<b>護理師擔任隊長</b>，用控制台手機撥 <b>999</b>，說出地點「CT 室」。全院廣播，X 光室也會收到。', on: ['rn'],
          run: async S => { S.set({ leader: 'rn', leadText: '隊長' }); await S.wave(S.pos.rn); S.set({ banner: '📢 999 全院廣播：CT 室急救' }); } },
        { t: 'C 胸外按壓', ph: 2, cap: 'CT 放射師先<b>口述「退床」</b>把病人移出機架，<b>立刻壓胸</b>。', on: ['rtc', 'mk'],
          run: async S => { S.bubble('rtc', '退床！'); S.set({ cpr: true }); } },
        { t: 'A 打開呼吸道', ph: 3, cap: '護理師把<b>急救車推到床邊</b>，在病人頭側<b>壓額抬下巴</b>。', on: ['rn', 'cart', 'mk'],
          run: async S => { await Promise.all([S.move('cart', L.cartEnd, 900), S.move('rn', L.airway, 1300)]); S.bubble('rn', '壓額抬下巴'); } },
        { t: 'B 人工呼吸', ph: 4, cap: '護理師從急救車<b>拿出甦醒球</b>，接上 CT 室<b>牆上氧氣</b>；壓胸 30 下、通氣 2 次。', on: ['rn', 'mk', 'cart'],
          run: async S => { S.set({ o2: [L.o2, L.airway] }); S.bubble('rn', '30：2'); } },
        { t: 'X 光室支援', cap: 'X 光放射師 <b>A 聽到廣播來支援</b>，接手甦醒球通氣；<b>B 留守 X 光室</b>照顧標準病人。', on: ['rta', 'rtb', 'sp', 'rn'],
          run: async S => { await Promise.all([S.path({ rta: [X.bl, ...route(xr, ct), L.airway] }, 4200), S.move('rtb', spCare, 900), S.move('rn', L.nurseEnd, 1200)]); S.bubble('rta', '接手通氣'); } },
        stepD(L),
        stepEnd(L, ct, 'rta', 'rtc', '（<b>對比劑過敏要停止注射、保留管路</b>）'),
      ],
    };
  }

  // ── 狀況三-A：假人在等候區，標準病人在 X 光室 → 推進 CT 室 ────────
  function scenario3a() {
    const xr = ROOM.xray, ct = ROOM.ct, L = layout(ct), X = layout(xr);
    const sp = X.mid, spCare = [sp[0] + 52, sp[1] + 4];
    const wSpot = [WAIT_M[0] + 6, WAIT_M[1] + 34];
    const push = [WAIT_M, ...route('wait', ct).slice(1, -1), L.M];
    return {
      audio: i => `audio/s3a_${i}.mp3`,
      start: { mk: WAIT_M, fam: WAIT_FAM, rtc: L.bl, rn: L.br, cart: L.cartHome, rta: X.bl, rtb: X.br, sp },
      steps: [
        { t: '開場', cap: '狀況三-A：假人在<b>等候區推床</b>上倒下，標準病人在 X 光室 → 推進<b>沒有 SP 的 CT 室</b>急救。', on: [], run: async () => {} },
        { ...stepCall0('rtc', 'CT 放射師發現病人倒下，', L, wSpot), run: async S => { await S.path({ rtc: [L.bl, ...route(ct, 'wait').slice(1, -1), wSpot] }, 1800); S.bubble('rtc', '先生！先生！'); } },
        { t: '叫：叫人', ph: 1, cap: 'CT 放射師大聲呼救；<b>護理師擔任隊長</b>，用 CT 室控制台手機撥 <b>999</b>，地點說「CT 室」。', on: ['rtc', 'rn'],
          run: async S => { S.bubble('rtc', '快來人！'); S.set({ leader: 'rn', leadText: '隊長' }); await S.wave(S.pos.rn); S.set({ banner: '📢 999 全院廣播：CT 室急救' }); } },
        { t: 'C 胸外按壓', ph: 2, cap: 'CT 放射師<b>在推床上立刻壓胸</b>。', on: ['rtc', 'mk'], run: async S => { S.set({ cpr: true }); } },
        { t: '推進 CT 室', cap: '護理師出來協助，<b>兩人把推床推進 CT 室</b>，中斷壓胸 <b>10 秒內</b>，進房立刻繼續壓胸。', on: ['rtc', 'rn', 'mk'],
          run: async S => {
            await S.path({ rn: [L.br, ...route(ct, 'wait').slice(1, -1), [WAIT_M[0] + 56, WAIT_M[1] - 4]] }, 1600);
            S.set({ cpr: false });
            await S.path({ mk: push, rtc: [...off(push.slice(0, -1), 6, 34), L.compress], rn: [...off(push.slice(0, -1), 56, -4), L.nurseEnd] }, 2600);
            S.set({ cpr: true });
          } },
        { t: 'A 打開呼吸道', ph: 3, cap: '護理師把<b>急救車推到床邊</b>，在病人頭側<b>壓額抬下巴</b>。', on: ['rn', 'cart', 'mk'],
          run: async S => { await Promise.all([S.move('cart', L.cartEnd, 900), S.move('rn', L.airway, 1300)]); S.bubble('rn', '壓額抬下巴'); } },
        { t: 'B 人工呼吸', ph: 4, cap: '護理師拿出急救車上的<b>甦醒球</b>，接上 CT 室<b>牆上氧氣</b>；壓胸 30 下、通氣 2 次。', on: ['rn', 'mk', 'cart'],
          run: async S => { S.set({ o2: [L.o2, L.airway] }); S.bubble('rn', '30：2'); } },
        { t: '隔離家屬・支援', cap: 'X 光放射師 <b>A 先請家屬在外稍候、關門</b>，再進 CT 室接手通氣；<b>B 留守 X 光室</b>照顧標準病人。', on: ['rta', 'fam', 'rtb', 'sp'],
          run: async S => {
            S.move('rtb', spCare, 900);
            await S.path({ rta: [X.bl, ...route(xr, 'wait').slice(1, -1), [WAIT_FAM[0] - 30, WAIT_FAM[1] + 6]] }, 2400);
            S.bubble('rta', '請在外面稍候'); await sleep(S.instant ? 0 : 1100); S.clearBubbles(); S.set({ door: DOOR[ct] });
            await Promise.all([S.path({ rta: [[...S.pos.rta], ...route('wait', ct).slice(1, -1), L.airway] }, 2000), S.move('rn', L.nurseEnd, 1200)]);
          } },
        stepD(L),
        stepEnd(L, ct, 'rta', 'rtc'),
      ],
    };
  }

  // ── 狀況三-B：假人在等候區，標準病人在 CT 室 → 推進 X 光室 ────────
  function scenario3b() {
    const xr = ROOM.xray, ct = ROOM.ct, L = layout(xr), T = layout(ct);
    const sp = T.mid, spCare = [sp[0] + 52, sp[1] + 4];
    const wSpot = [WAIT_M[0] + 6, WAIT_M[1] + 34];
    const push = [WAIT_M, ...route('wait', xr).slice(1, -1), L.M];
    return {
      audio: i => `audio/s3b_${i}.mp3`,
      start: { mk: WAIT_M, fam: WAIT_FAM, rta: L.bl, rtb: L.br, rn: T.br, cart: T.cartHome, rtc: T.bl, sp },
      steps: [
        { t: '開場', cap: '狀況三-B：假人在<b>等候區推床</b>上倒下，標準病人在 CT 室 → 推進<b>沒有 SP 的 X 光室</b>；急救車要從 CT 室推過來。', on: [], run: async () => {} },
        { ...stepCall0('rta', 'X 光放射師 A 發現病人倒下，', L, wSpot), run: async S => { await S.path({ rta: [L.bl, ...route(xr, 'wait').slice(1, -1), wSpot] }, 1800); S.bubble('rta', '先生！先生！'); } },
        { t: '叫：叫人', ph: 1, cap: '<b>A 大聲呼救、暫代隊長</b>；<b>B 用 X 光室控制台手機撥 999</b>，地點說「X 光室」（全院廣播）。', on: ['rta', 'rtb'],
          run: async S => { S.bubble('rta', '快來人！'); S.set({ leader: 'rta', leadText: '暫代隊長' }); await S.wave(S.pos.rtb); S.set({ banner: '📢 999 全院廣播：X 光室急救' }); } },
        { t: 'C 胸外按壓', ph: 2, cap: 'A <b>在推床上立刻壓胸</b>。', on: ['rta', 'mk'], run: async S => { S.set({ cpr: true }); } },
        { t: '推進 X 光室', cap: 'B 出來協助，<b>兩人把推床推進 X 光室</b>，中斷壓胸 <b>10 秒內</b>，進房立刻繼續壓胸。', on: ['rta', 'rtb', 'mk'],
          run: async S => {
            await S.path({ rtb: [L.br, ...route(xr, 'wait').slice(1, -1), [WAIT_M[0] + 56, WAIT_M[1] - 4]] }, 1600);
            S.set({ cpr: false });
            await S.path({ mk: push, rta: [...off(push.slice(0, -1), 6, 34), L.compress], rtb: [...off(push.slice(0, -1), 56, -4), L.airway] }, 2600);
            S.set({ cpr: true });
          } },
        { t: '隔離家屬', cap: '<b>B 請家屬在外面稍候、關門</b>保護隱私，再回到 X 光室。', on: ['rtb', 'fam'], run: async S => { await isolate('rtb', xr, L.airway)(S); } },
        { t: 'A 打開呼吸道', ph: 3, cap: 'B 在病人頭側<b>壓額抬下巴</b>。<b>甦醒球在急救車上</b>，車到之前先維持呼吸道暢通。', on: ['rtb', 'mk'],
          run: async S => { S.bubble('rtb', '壓額抬下巴'); } },
        { t: '護理師推急救車', cap: 'CT 室護理師聽到廣播，<b>推著急救車（甦醒球在車上）</b>趕到 X 光室；<b>CT 放射師留守</b>照顧標準病人。', on: ['rn', 'cart', 'rtc', 'sp'],
          run: async S => { await Promise.all([S.path({ cart: [T.cartHome, ...route(ct, xr).slice(1), L.cartEnd], rn: [T.br, ...route(ct, xr), L.nurseEnd] }, 4800), S.move('rtc', spCare, 1000)]); } },
        { t: '交接指揮', cap: '護理師到場：「<b>由我指揮</b>」；A 用 <b>ISBAR</b> 簡短交班（倒下時間、壓胸幾分鐘、已撥 999）。', on: ['rn', 'rta'],
          run: async S => { S.bubble('rn', '由我指揮！'); await sleep(S.instant ? 0 : 900); S.bubble('rta', 'ISBAR 交班', true); await S.moveLeader('rn', '隊長', 1000); } },
        { t: 'B 人工呼吸', ph: 4, cap: 'B 從急救車<b>拿出甦醒球</b>，接上 X 光室<b>牆上氧氣</b>；壓胸 30 下、通氣 2 次。', on: ['rtb', 'mk', 'cart'],
          run: async S => {
            await S.move('rtb', [L.cartEnd[0] - 40, L.cartEnd[1] + 8], 900); S.bubble('rtb', '拿甦醒球');
            await sleep(S.instant ? 0 : 700); S.clearBubbles();
            await S.move('rtb', L.airway, 900); S.set({ o2: [L.o2, L.airway] }); S.bubble('rtb', '30：2');
          } },
        stepD(L),
        stepEnd(L, xr, 'rtb', 'rta'),
      ],
    };
  }
  const SCENES = { s1: scenario1, s2: scenario2, s3a: scenario3a, s3b: scenario3b };

  // ── 播放器 ────────────────────────────────────────
  let cur = null;                                        // 目前播放中的狀況
  let muted = false;
  const audio = new Audio();

  function mount(id) {
    const card = document.querySelector(`#${id} + .scn .fig`);
    card.parentElement.classList.add('playing');
    const svg = card.querySelector('svg');
    const def = SCENES[id]();
    def.start.team = ENTRY;                                // 醫療支援一開始在大門外（畫面外）
    const original = svg.innerHTML;
    const tmp = document.createElement('div');
    tmp.innerHTML = svgFor({ id: `anim-${id}`, people: [], moves: [], carts: [], family: [] });
    svg.innerHTML = tmp.querySelector('svg').innerHTML;
    const layer = { fx: el('g'), actors: el('g'), top: el('g') };
    svg.append(layer.actors, layer.fx, layer.top);
    const nodes = {};
    for (const k of Object.keys(def.start)) { nodes[k] = el('g', { class: 'actor' }, LOOK[k]()); layer.actors.append(nodes[k]); }
    const leadRing = el('g', {}, '<circle r="25" fill="none" stroke="#f59e0b" stroke-width="4"/><text x="17" y="-15" font-size="18">⭐</text><text class="lt" y="42" font-size="13" font-weight="800" text-anchor="middle" fill="#92400e" paint-order="stroke" stroke="#fff" stroke-width="4"></text>');
    layer.top.append(leadRing);

    const S = { pos: {}, state: {} };
    S.render = () => {
      const on = new Set(S.active || []);
      for (const [k, n] of Object.entries(nodes)) {
        const [x, y] = S.pos[k];
        n.setAttribute('transform', `translate(${x},${y})`);
        n.setAttribute('opacity', !on.size || on.has(k) ? 1 : .35);
      }
      const L = S.state.leader;
      leadRing.style.display = L ? '' : 'none';
      if (L) { const [x, y] = S.pos[L]; leadRing.setAttribute('transform', `translate(${x},${y})`); leadRing.querySelector('.lt').textContent = S.state.leadText; }
      // 持續性的效果
      layer.fx.querySelectorAll('.keep').forEach(e => e.remove());
      if (S.state.cpr) layer.fx.append(el('circle', { class: 'keep', cx: S.pos.mk[0], cy: S.pos.mk[1], r: 30, fill: 'none', stroke: '#dc2626', 'stroke-width': 3 },
        '<animate attributeName="r" values="26;40;26" dur="0.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;.2;1" dur="0.6s" repeatCount="indefinite"/>'));
      if (S.state.o2) { const [[x1, y1], [x2, y2]] = S.state.o2;
        layer.fx.append(el('line', { class: 'keep', x1, y1, x2, y2, stroke: '#0ea5e9', 'stroke-width': 4, 'stroke-dasharray': '6 5' },
          '<animate attributeName="stroke-dashoffset" from="22" to="0" dur="0.8s" repeatCount="indefinite"/>')); }
      if (S.state.pads) { const [x, y] = S.pos.mk;
        layer.fx.append(el('g', { class: 'keep' }, `<rect x="${x - 10}" y="${y - 17}" width="17" height="12" rx="3" fill="#f97316" stroke="#7c2d12" stroke-width="1.5" transform="rotate(-20 ${x - 2} ${y - 11})"/><rect x="${x + 14}" y="${y + 3}" width="17" height="12" rx="3" fill="#f97316" stroke="#7c2d12" stroke-width="1.5" transform="rotate(20 ${x + 22} ${y + 9})"/>`)); }
      if (S.state.door) { const [x, y] = S.state.door;
        layer.fx.append(el('g', { class: 'keep' }, `<rect x="${x - 26}" y="${y - 12}" width="52" height="24" rx="6" fill="#92400e" stroke="#fff" stroke-width="2"/><text x="${x}" y="${y + 5}" font-size="13" font-weight="800" text-anchor="middle" fill="#fff">🚪關門</text>`)); }
      if (S.state.handover) { const [x1, y1] = S.pos.rn, [x2, y2] = S.pos.team, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        layer.fx.append(el('g', { class: 'keep' }, `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#f59e0b" stroke-width="3" stroke-dasharray="5 4"/><rect x="${mx - 46}" y="${my - 11}" width="92" height="22" rx="11" fill="#f59e0b" stroke="#fff" stroke-width="2"/><text x="${mx}" y="${my + 5}" font-size="13" font-weight="800" text-anchor="middle" fill="#1f2a37">ISBAR 交班</text>`)); }
      if (S.state.banner) layer.fx.append(el('g', { class: 'keep' },
        `<rect x="300" y="138" width="340" height="30" rx="8" fill="#b91c1c"/><text x="470" y="159" font-size="16" font-weight="800" text-anchor="middle" fill="#fff">${S.state.banner}</text>`));
    };
    S.set = o => { Object.assign(S.state, o); S.render(); };
    S.move = (k, to, ms) => { const from = [...S.pos[k]]; return tween(S.instant ? 0 : ms, f => { S.pos[k] = [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f]; S.render(); }); };
    S.path = (paths, ms) => tween(S.instant ? 0 : ms, f => { for (const [k, p] of Object.entries(paths)) S.pos[k] = along(p, f); S.render(); });
    S.moveLeader = async (k, text, ms) => {
      const from = S.state.leader ? [...S.pos[S.state.leader]] : [...S.pos[k]];
      leadRing.querySelector('.lt').textContent = '';
      if (!S.instant) await tween(ms, f => { const [x, y] = S.pos[k]; leadRing.setAttribute('transform', `translate(${from[0] + (x - from[0]) * f},${from[1] + (y - from[1]) * f})`); });
      S.set({ leader: k, leadText: text });
    };
    S.wave = async ([x, y]) => {                           // 999 廣播：從撥號的人向外擴散
      if (S.instant) return;
      const g = el('g', { class: 'tmp' });
      g.append(el('text', { x: x + 20, y: y - 22, 'font-size': 22 }, '📱'));
      for (let i = 0; i < 3; i++) g.append(el('circle', { cx: x, cy: y, r: 20, fill: 'none', stroke: '#b91c1c', 'stroke-width': 3, opacity: 0 },
        `<animate attributeName="r" from="20" to="560" dur="2.4s" begin="${i * .5}s" fill="freeze"/><animate attributeName="opacity" values="0;.9;0" dur="2.4s" begin="${i * .5}s" fill="freeze"/>`));
      layer.top.append(g); await sleep(S.instant ? 0 : 2600); g.remove();
    };
    S.bubble = (k, text, below = false) => {                // below：泡泡畫在人的下方，避免和別人的泡泡重疊
      if (S.instant) return;
      const [x, y0] = S.pos[k], w = text.length * 15 + 20, d = below ? -1 : 1, y = below ? y0 + 6 : y0;
      const top = below ? y + 38 : y - 70, tip = below ? `M${x - 6} ${y + 39} L${x} ${y + 28} L${x + 6} ${y + 39}Z` : `M${x - 6} ${y - 43} L${x} ${y - 32} L${x + 6} ${y - 43}Z`;
      const b = el('g', { class: 'tmp' }, `<rect x="${x - w / 2}" y="${top}" width="${w}" height="28" rx="10" fill="#fff" stroke="#1f2a37" stroke-width="2"/><path d="${tip}" fill="#fff" stroke="#1f2a37" stroke-width="2"/><text x="${x}" y="${top + 20}" font-size="15" font-weight="800" text-anchor="middle" fill="#1f2a37">${text}</text>`);
      layer.top.append(b);
    };
    S.clearBubbles = () => layer.top.querySelectorAll('.tmp').forEach(e => e.remove());
    S.bolt = async ([x, y]) => {
      if (S.instant) return;
      const b = el('text', { class: 'tmp', x: x + 26, y: y - 14, 'font-size': 34 }, '⚡');
      b.append(el('animate', { attributeName: 'opacity', values: '0;1;0;1;0;1', dur: '1.2s', fill: 'freeze' }));
      layer.top.append(b); await sleep(S.instant ? 0 : 1300);
    };

    // ── 控制列與字幕 ──
    const bar = card.querySelector('.anim-bar');
    bar.innerHTML = `<div class="anim-ctl">
        <button data-a="prev">◀ 上一步</button><span class="anim-no"></span><button data-a="next" class="pri">下一步 ▶</button>
        <button data-a="replay" title="重播這一步">↻ 重播</button><button data-a="mute" title="靜音／開聲音"></button><button data-a="exit">✕ 結束</button></div>
      <div class="cabd">${['叫<small>叫喚</small>', '叫<small>叫人</small>', 'C<small>壓胸</small>', 'A<small>呼吸道</small>', 'B<small>呼吸</small>', 'D<small>電擊</small>'].map((t, i) => `<span data-i="${i}">${t}</span>`).join('<i>→</i>')}</div>
      <div class="anim-cap"><b class="anim-t"></b><span class="anim-c"></span></div>`;
    const muteBtn = bar.querySelector('[data-a="mute"]');
    const syncMute = () => { muteBtn.textContent = muted ? '🔇 已靜音' : '🔊 聲音開'; audio.muted = muted; };
    syncMute();

    let n = 0;
    async function goTo(i) {
      n = Math.max(0, Math.min(def.steps.length - 1, i));
      token++; audio.pause();
      // 每次換步都換一代；舊一代還沒跑完的步驟，所有動作都變成空動作，不會殘留在畫面上
      const gen = S.gen = (S.gen || 0) + 1;
      const R = new Proxy(S, { get: (t, k) => typeof t[k] === 'function' && t.gen !== gen ? (() => Promise.resolve()) : t[k] });
      layer.top.querySelectorAll('.tmp').forEach(e => e.remove());
      S.pos = JSON.parse(JSON.stringify(def.start)); S.state = {}; S.active = []; S.instant = true;
      for (let k = 1; k < n; k++) { await def.steps[k].run(R); if (S.gen !== gen) return; }   // 先瞬間套用前面的步驟
      layer.top.querySelectorAll('.tmp').forEach(e => e.remove());
      S.instant = false; S.active = def.steps[n].on; S.render();
      bar.querySelector('.anim-no').textContent = n ? `第 ${n} 步／共 ${def.steps.length - 1} 步` : '開場';
      bar.querySelector('.anim-t').textContent = def.steps[n].t;
      const done = Math.max(-1, ...def.steps.slice(1, n + 1).map(x => x.ph ?? -1));
      bar.querySelectorAll('.cabd span').forEach(c => { const i = +c.dataset.i; c.className = i === def.steps[n].ph ? 'now' : i <= done ? 'done' : ''; });
      bar.querySelector('.anim-c').innerHTML = def.steps[n].cap;
      bar.querySelector('[data-a="prev"]').disabled = n === 0;
      bar.querySelector('[data-a="next"]').textContent = n === def.steps.length - 1 ? '✓ 完成' : '下一步 ▶';
      audio.src = def.audio(n); audio.currentTime = 0;
      audio.play().catch(() => {});
      await def.steps[n].run(R);
    }
    function exit() {
      token++; audio.pause(); svg.innerHTML = original; cur = null;
      card.parentElement.classList.remove('playing');
      bar.innerHTML = startButton(id);
    }
    bar.onclick = e => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'prev') goTo(n - 1);
      else if (a === 'next') n === def.steps.length - 1 ? exit() : goTo(n + 1);
      else if (a === 'replay') goTo(n);
      else if (a === 'mute') { muted = !muted; syncMute(); }
      else if (a === 'exit') exit();
    };
    cur = { goTo: d => goTo(n + d), exit };
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    goTo(0);
  }

  // 預設播放 3D 實景動畫（er3d_s1.html，內嵌在示意圖位置）；2D 平面動畫保留為次要選項
  const url3d = (id, embed) => `er3d_s1.html?scene=${id}&plan=${plan}${embed ? '&embed=1' : ''}`;
  const extraLinks = id => `<a class="anim-link full" href="${url3d(id)}" target="_blank" rel="noopener">⛶ 全螢幕開啟 3D 動畫</a>` +
    `<a class="anim-link char" href="character_select.html" target="_blank" rel="noopener">🎨 人物造型 3 選 1</a>`;
  const startButton = id => `<button class="anim-start" data-id="${id}">▶ 動畫講解（含語音）</button>` + extraLinks(id) +
    `<button class="anim-2d" data-id="${id}">2D 平面動畫</button>` +
    `<span class="anim-tip">3D 實景動畫：按「下一步」或鍵盤 → 前進、← 退回</span>`;

  function mount3d(id) {
    const card = document.querySelector(`#${id} + .scn .fig`);
    const pz = card.querySelector('.pz'), bar = card.querySelector('.anim-bar');
    card.parentElement.classList.add('playing');
    pz.hidden = true;
    const frame = document.createElement('iframe');
    frame.className = 'er3d';
    frame.title = '3D 實景急救動畫';
    frame.allow = 'autoplay; fullscreen';
    frame.src = url3d(id, true);
    pz.after(frame);
    bar.innerHTML = `<div class="anim-ctl"><button data-a="exit">✕ 結束 3D 動畫</button>${extraLinks(id)}</div>`;
    const press = btnId => frame.contentDocument?.getElementById(btnId)?.click();
    function exit() {
      frame.remove(); pz.hidden = false; cur = null;
      card.parentElement.classList.remove('playing');
      bar.innerHTML = startButton(id);
    }
    bar.onclick = e => { if (e.target.closest('button')?.dataset.a === 'exit') exit(); };
    cur = { goTo: d => press(d > 0 ? 'btnNext' : 'btnPrev'), exit };
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  for (const id of Object.keys(SCENES)) {
    const fig = document.querySelector(`#${id} + .scn .fig`);
    const bar = document.createElement('div');
    bar.className = 'anim-bar';
    bar.innerHTML = startButton(id);
    fig.append(bar);
    bar.addEventListener('click', e => {
      if (e.target.closest('.anim-start')) { if (cur) cur.exit(); mount3d(id); }
      else if (e.target.closest('.anim-2d')) { if (cur) cur.exit(); mount(id); }
    });
  }
  addEventListener('keydown', e => {
    if (!cur) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); cur.goTo(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); cur.goTo(-1); }
    else if (e.key === 'Escape') cur.exit();
  });
})();
