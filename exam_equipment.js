// 考場內部擺設的唯一來源（依臨床實際）：
//   CT 室：CT、控制台、生理監視器＋血氧機、急救車、打藥設備（對比劑注射器＋點滴架）
//   一般 X 光室：X 光機（攝影床、球管、胸部攝影架）＋控制台；等候區：只有座椅。
// venue3d.html（考場 3D）與 linkou3d.html（林口場地 3D）共用，確保兩邊擺設同步。
// 座標一律用參賽說明第 3 頁「考場配置圖」的座標（pt）：x 往東、z 往南、y 為高度。
//
// api 介面：
//   api.THREE                     three.js
//   api.box(x1,z1,x2,z2,y1,y2,c)  方塊
//   api.cyl(x,z,r,y1,y2,c)        圓柱
//   api.add(mesh)                 加入自訂 mesh
//   api.label(text,x,y,z,opts)    標籤
//   api.mat(color)                材質
//   api.rigid(ax,az,fn)           一組物件以 (ax,az) 為錨點整體搬移（考場 3D 直接執行 fn）

// 儀器區域：A = (706,356)-(788,453)；B = (296,356)-(378,453)
export const FOOTPRINT = { A: { x1: 706, z1: 356, x2: 788, z2: 453 }, B: { x1: 296, z1: 356, x2: 378, z2: 453 } };
export const CONSOLE = { A: [729, 280, 811, 309], B: [327, 293, 409, 322] };
// 只有 CT 室有：生理監視器＋血氧機、急救車（X 光室與等候區不放任何儀器）
export const MONITOR = { A: [668, 380], B: [408, 395] };
export const CRASH_CART = { A: [835, 430], B: [235, 430] };
export const CHEST = { A: [848, 410, -1], B: [222, 410, 1] };

function ct(api, f) {
  const { THREE, box, cyl, add, label, mat } = api;
  const cx = (f.x1 + f.x2) / 2;
  // 機架（gantry）：圓角方框挖圓孔，孔軸朝北
  const gw = 92, gh = 80, gd = 24, r = 10, s = new THREE.Shape();
  s.moveTo(-gw / 2 + r, 0); s.lineTo(gw / 2 - r, 0); s.quadraticCurveTo(gw / 2, 0, gw / 2, r);
  s.lineTo(gw / 2, gh - r); s.quadraticCurveTo(gw / 2, gh, gw / 2 - r, gh); s.lineTo(-gw / 2 + r, gh);
  s.quadraticCurveTo(-gw / 2, gh, -gw / 2, gh - r); s.lineTo(-gw / 2, r); s.quadraticCurveTo(-gw / 2, 0, -gw / 2 + r, 0);
  const hole = new THREE.Path(); hole.absarc(0, 44, 23, 0, Math.PI * 2, true); s.holes.push(hole);
  const g = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: gd, bevelEnabled: true, bevelSize: 2, bevelThickness: 2, curveSegments: 40 }), mat(0xf4f6f8));
  g.position.set(cx, 0, f.z2 - 6 - gd); g.castShadow = g.receiveShadow = true; add(g);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(25, 2.2, 12, 48), mat(0x3b82c4));
  ring.position.set(cx, 44, f.z2 - 6 - gd - 2.5); add(ring);
  // 檢查床
  box(cx - 11, f.z1 + 4, cx + 11, f.z1 + 46, 0, 26, 0xd9dde3);
  box(cx - 13, f.z1 - 6, cx + 13, f.z2 - 14, 26, 30, 0xfafafa);
  // 打藥設備：對比劑注射器＋點滴架
  cyl(cx + 30, f.z1 + 14, 2, 0, 58, 0x9aa3ad);
  box(cx + 24, f.z1 + 8, cx + 36, f.z1 + 22, 58, 68, 0x4b5563);
  cyl(cx + 46, f.z1 + 14, 1.2, 0, 82, 0xc0c6ce);
  box(cx + 40, f.z1 + 13, cx + 52, f.z1 + 15, 80, 82, 0xc0c6ce);
  box(cx + 41, f.z1 + 11, cx + 45, f.z1 + 17, 66, 78, 0xdbeafe);          // 點滴袋
  label('CT 掃描儀', cx, 112, f.z2 - 18, { size: 26 });
  label('打藥設備\n注射器・點滴架', cx + 60, 104, f.z1 + 14, { size: 18, bold: false });
}

function xray(api, f) {
  const { box, label } = api;
  const cx = (f.x1 + f.x2) / 2;
  // 攝影床
  box(cx - 14, f.z1 + 25, cx + 14, f.z2 - 25, 0, 24, 0xd9dde3);
  box(cx - 18, f.z1 + 2, cx + 18, f.z2 - 2, 24, 29, 0xfafafa);
  // 落地式 X 光管柱、橫臂、球管、準直儀
  const colX = cx - 34;
  box(colX - 4, f.z1 + 4, colX + 4, f.z2 - 4, 0, 3, 0x9aa3ad);            // 地軌
  box(colX - 5, f.z1 + 40, colX + 5, f.z1 + 50, 3, 112, 0xe5e7eb);         // 立柱
  box(colX, f.z1 + 41, cx + 2, f.z1 + 49, 92, 100, 0xe5e7eb);              // 橫臂
  box(cx - 9, f.z1 + 36, cx + 11, f.z1 + 54, 70, 92, 0xf4f6f8);            // 球管
  box(cx - 7, f.z1 + 38, cx + 7, f.z1 + 52, 60, 70, 0x4b5563);             // 準直儀
  label('X 光攝影床\n＋球管', cx, 140, f.z1 + 45, { size: 23 });
}

function chestStand(api, x, z, facing) {       // facing：+1 往東、-1 往西
  const { box, label } = api;
  box(x - 4, z - 6, x + 4, z + 6, 0, 120, 0xd9dde3);
  box(x + facing * 4 - 3, z - 18, x + facing * 4 + 3, z + 18, 40, 92, 0xf4f6f8);
  label('胸部\n攝影架', x + facing * 10, 145, z, { size: 19, bold: false });
}

function consoleDesk(api, x1, z1, x2, z2, kind) {
  const { box, label } = api;
  box(x1, z1, x2, z2, 0, 28, 0xa98b6c);
  const mx = (x1 + x2) / 2;
  for (const dx of [-20, 4]) {
    box(mx + dx - 9, z1 + 8, mx + dx + 9, z1 + 10, 34, 50, 0x1f2937);
    box(mx + dx - 1.5, z1 + 8, mx + dx + 1.5, z1 + 12, 28, 34, 0x6b7280);
  }
  box(mx + 22, z1 + 14, mx + 30, z1 + 24, 28, 30, 0x111827);   // 手機
  label(`控制台（${kind === 'ct' ? 'CT' : 'X光'}）＋手機`, mx, 82, z1 + 14, { size: 21, bg: '#1f2a37', fg: '#ffffff' });
}

function monitorSet(api, x, z) {                // 生理監視器（立架）＋血氧機
  const { box, cyl, label } = api;
  cyl(x, z, 1.6, 0, 55, 0x9aa3ad); box(x - 10, z - 3, x + 10, z + 3, 55, 70, 0x1f2937);
  box(x - 8, z + 3, x + 8, z + 3.6, 57, 68, 0x22c55e);                    // 螢幕
  cyl(x + 18, z, 1.2, 0, 40, 0x9aa3ad); box(x + 13, z - 4, x + 23, z + 4, 40, 48, 0xf4f6f8);
  box(x + 14, z + 4, x + 22, z + 4.6, 42, 47, 0x38bdf8);                  // 血氧機螢幕
  label('生理監視器\n＋血氧機', x + 8, 98, z + 10, { size: 17, bold: false });
}

function crashCart(api, x, z) {                 // 急救車
  const { box, label } = api;
  box(x - 15, z - 11, x + 15, z + 11, 3, 42, 0xdc2626);
  for (const y of [12, 22, 32]) box(x - 14, z + 11, x + 14, z + 11.6, y, y + 1, 0x7f1d1d);
  box(x - 16, z - 12, x + 16, z + 12, 42, 45, 0x9ca3af);
  box(x - 10, z - 6, x + 2, z + 4, 45, 53, 0xfacc15);                     // 上層備品盒
  label('急救車', x, 74, z, { size: 19, bg: '#dc2626', fg: '#ffffff' });
}

export function buildExamInterior(api, roomType) {
  for (const room of ['A', 'B']) {
    const f = FOOTPRINT[room], t = roomType[room];
    api.rigid((f.x1 + f.x2) / 2, (f.z1 + f.z2) / 2, () => t === 'ct' ? ct(api, f) : xray(api, f));
    if (t === 'xray') { const [x, z, d] = CHEST[room]; api.rigid(x, z, () => chestStand(api, x, z, d)); }
    const [x1, z1, x2, z2] = CONSOLE[room];
    api.rigid((x1 + x2) / 2, (z1 + z2) / 2, () => consoleDesk(api, x1, z1, x2, z2, t));
    if (t === 'ct') {
      const [mx, mz] = MONITOR[room]; api.rigid(mx, mz, () => monitorSet(api, mx, mz));
      const [cx, cz] = CRASH_CART[room]; api.rigid(cx, cz, () => crashCart(api, cx, cz));
    }
  }
  // 等候區座椅
  for (let i = 0; i < 4; i++) for (const z of [196, 236]) {
    const x = 300 + i * 36;
    api.rigid(x + 13, z + 10, () => {
      api.box(x, z, x + 26, z + 20, 0, 13, 0x5c7f8f);
      api.box(x, z + 16, x + 26, z + 20, 13, 30, 0x5c7f8f);
    });
  }
}
