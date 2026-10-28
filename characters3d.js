// 1031 急救情境預案：4 大角色 × 各 3 款高質感 3D 人物造型工坊（共 12 款）
// 角色分類：
//   1. rn  護理師（隊長）：款式 A（臨床寫實紫刷手服＋聽診器）、款式 B（Q版圓潤療癒公仔）、款式 C（急診專師戰術護目鏡＋耳麥）
//   2. rt  醫事放射師：    款式 A（臨床專業寶藍刷手服＋白袍＋TLD）、款式 B（Q版大眼鏡公仔）、款式 C（防輻射鉛衣背心＋甲狀腺鉛領）
//   3. sp  標準病人 SP：   款式 A（溫和長者條紋病人服＋手圈）、款式 B（Q版親和病人公仔）、款式 C（開襟檢查袍＋保暖披肩＋留置針）
//   4. mk  模擬假人安妮：  款式 A（Laerdal QCPR 訓練假人＋運動外套）、款式 B（擬真住院病患＋ECG導極）、款式 C（透明胸廓＋立體跳動心臟與雙肺）

export const CHARACTER_CATALOG = {
  rn: {
    title: '護理師（⭐ 唯一隊長）',
    variants: {
      A: { name: '款式 A｜臨床寫實風', desc: '紫羅蘭修身刷手服＋立體護士帽＋掛頸聽診器＋精緻五官馬尾' },
      B: { name: '款式 B｜可愛 Q 版公仔風', desc: '2.5 頭身圓潤比例＋大眼腮紅＋粉紫刷手服配白色針織開襟衫' },
      C: { name: '款式 C｜急診指揮官風', desc: '深紫金邊戰術刷手服＋透明防護護目鏡＋無線電耳麥＋隊長臂章' }
    }
  },
  rt: {
    title: '醫事放射師（CT／X 光）',
    variants: {
      A: { name: '款式 A｜臨床白袍專業風', desc: '寶藍刷手服外搭敞開短白袍＋胸前黃色 TLD 輻射劑量佩章' },
      B: { name: '款式 B｜可愛 Q 版眼鏡風', desc: '2.5 頭身圓潤比例＋斯文黑框圓眼鏡＋天藍刷手服＋發光劑量章' },
      C: { name: '款式 C｜放射鉛衣實戰風', desc: '深藍刷手服外穿雙色防輻射鉛衣背心＋紅色甲狀腺防護鉛領' }
    }
  },
  sp: {
    title: '標準病人（SP）',
    variants: {
      A: { name: '款式 A｜溫和長者寫實風', desc: '銀灰慈祥髮型＋薄荷綠條紋住院服＋病人辨識手圈＋防滑拖鞋' },
      B: { name: '款式 B｜可愛 Q 版親和風', desc: '2.5 頭身圓潤比例＋無辜大眼腮紅＋嫩綠病人服＋頭頂 SP 膠囊章' },
      C: { name: '款式 C｜日式檢查袍披肩風', desc: '湖水綠交叉開襟檢查袍＋米白保暖披肩＋手背對比劑留置針敷料' }
    }
  },
  mk: {
    title: '模擬假人（安妮 Manikin）',
    variants: {
      A: { name: '款式 A｜Laerdal QCPR 經典風', desc: '仿真訓練安妮＋藍白運動外套敞開＋胸口 QCPR 綠光深度回饋環' },
      B: { name: '款式 B｜擬真急診病患風', desc: '真人五官與住院服敞開前胸＋三色心電圖貼片＋手指血氧感測夾' },
      C: { name: '款式 C｜透明解剖心肺透視風', desc: '半透明科技胸腔＋立體跳動紅心臟（隨壓胸收縮）＋粉紅充氣雙肺' }
    }
  }
};

export function getSavedCharacterStyles() {
  try {
    const raw = localStorage.getItem('ncmea_char_styles_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        rn: ['A', 'B', 'C'].includes(parsed.rn) ? parsed.rn : 'B',
        rt: ['A', 'B', 'C'].includes(parsed.rt) ? parsed.rt : 'B',
        sp: ['A', 'B', 'C'].includes(parsed.sp) ? parsed.sp : 'B',
        mk: ['A', 'B', 'C'].includes(parsed.mk) ? parsed.mk : 'C'
      };
    }
  } catch (e) {}
  return { rn: 'B', rt: 'B', sp: 'B', mk: 'C' };
}

export function saveCharacterStyles(styles) {
  try {
    localStorage.setItem('ncmea_char_styles_v1', JSON.stringify(styles));
  } catch (e) {}
}

// ── 共用幾何與材質輔助 ───────────────────────────────────────
function makeMat(THREE, color, rough = 0.42, metal = 0.06, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
}
function box(THREE, parent, x1, z1, x2, z2, y1, y2, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x2 - x1, y2 - y1, z2 - z1), mat);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(THREE, parent, x, z, rTop, rBot, y1, y2, mat, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, y2 - y1, seg), mat);
  m.position.set(x, (y1 + y2) / 2, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function sphere(THREE, parent, x, y, z, r, mat, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 20), mat);
  m.position.set(x, y, z);
  m.scale.set(...scale);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

// 繪製精緻立體五官（眼睛、瞳孔高光、眉毛、鼻子、微笑或口罩）
function addDetailedFace(THREE, headGroup, { isChibi = false, hasGlasses = false, hasGoggles = false, hasMask = false, hairColor = 0x1e293b } = {}) {
  const r = isChibi ? 8.2 : 6.2;
  const eyeZ = r * 0.88;
  const eyeY = isChibi ? -0.4 : 0.4;
  const eyeX = isChibi ? 2.7 : 2.1;

  const whiteMat = makeMat(THREE, 0xffffff, 0.2);
  const pupilMat = makeMat(THREE, 0x1e1b4b, 0.15);
  const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushMat = makeMat(THREE, 0xf43f5e, 0.6, 0, { transparent: true, opacity: isChibi ? 0.45 : 0.22 });
  const browMat  = makeMat(THREE, hairColor, 0.6);

  for (const dir of [-1, 1]) {
    // 眼白與深邃瞳孔
    sphere(THREE, headGroup, dir * eyeX, eyeY, eyeZ, isChibi ? 1.35 : 0.85, whiteMat, [1, 1.15, 0.5]);
    sphere(THREE, headGroup, dir * eyeX, eyeY, eyeZ + 0.32, isChibi ? 0.95 : 0.55, pupilMat, [1, 1.15, 0.5]);
    // 眼神高光點
    const hl = new THREE.Mesh(new THREE.SphereGeometry(isChibi ? 0.36 : 0.22, 8, 8), shineMat);
    hl.position.set(dir * eyeX + 0.28, eyeY + 0.35, eyeZ + 0.65);
    headGroup.add(hl);

    // 眉毛
    const brow = new THREE.Mesh(new THREE.BoxGeometry(isChibi ? 2.1 : 1.6, 0.38, 0.4), browMat);
    brow.position.set(dir * eyeX, eyeY + (isChibi ? 1.9 : 1.35), eyeZ - 0.1);
    brow.rotation.z = dir * -0.08;
    headGroup.add(brow);

    // 紅潤臉頰腮紅
    sphere(THREE, headGroup, dir * (eyeX + 1.1), eyeY - (isChibi ? 1.35 : 1.0), eyeZ - 0.2, isChibi ? 1.1 : 0.7, blushMat, [1.2, 0.7, 0.4]);
  }

  // 立體小鼻樑
  sphere(THREE, headGroup, 0, eyeY - 0.75, eyeZ + 0.35, isChibi ? 0.65 : 0.55, makeMat(THREE, 0xeab38f, 0.5), [0.85, 1.0, 0.9]);

  // 微笑嘴型或醫療口罩
  if (hasMask) {
    const mask = new THREE.Mesh(
      new THREE.SphereGeometry(r * 1.03, 18, 14, -Math.PI * 0.34, Math.PI * 0.68, Math.PI * 0.52, Math.PI * 0.34),
      makeMat(THREE, 0xe0f2fe, 0.4)
    );
    mask.rotation.y = Math.PI / 2;
    headGroup.add(mask);
  } else {
    const smile = new THREE.Mesh(
      new THREE.TorusGeometry(isChibi ? 1.05 : 0.85, 0.18, 8, 20, Math.PI),
      makeMat(THREE, 0xbe123c, 0.4)
    );
    smile.rotation.x = Math.PI;
    smile.position.set(0, eyeY - (isChibi ? 1.8 : 1.6), eyeZ + 0.1);
    headGroup.add(smile);
  }

  // 黑框斯文圓眼鏡（款式 B 放射師）
  if (hasGlasses) {
    const frameMat = makeMat(THREE, 0x0f172a, 0.2, 0.6);
    for (const dir of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(isChibi ? 1.85 : 1.35, 0.22, 10, 28), frameMat);
      rim.position.set(dir * eyeX, eyeY, eyeZ + 0.55);
      headGroup.add(rim);
    }
    box(THREE, headGroup, -0.9, eyeZ + 0.45, 0.9, eyeZ + 0.65, eyeY - 0.1, eyeY + 0.2, frameMat);
  }

  // 透明醫療防飛沫護目鏡（款式 C 護理師）
  if (hasGoggles) {
    const gogMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0.1 });
    const gog = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, 2.8, 24, 1, true, -Math.PI * 0.38, Math.PI * 0.76), gogMat);
    gog.position.set(0, eyeY + 0.2, 0);
    headGroup.add(gog);
    const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.25, 8, 32), makeMat(THREE, 0x0284c7, 0.3));
    band.rotation.x = Math.PI / 2;
    band.position.y = eyeY + 1.3;
    headGroup.add(band);
  }
}

// ── 建立站立醫護／SP／家屬角色（支援 A / B / C 三款造型）────────
export function buildStandingCharacter(THREE, {
  role = 'rn',
  variant = 'B',
  name = '',
  uniformColor = null,
  isLeader = false,
  makeLabelFn = null
} = {}) {
  const root = new THREE.Group();
  const isChibi = variant === 'B';

  // 角色種類判定
  const isNurse  = role === 'rn';
  const isSP     = role === 'sp';
  const isFamily = role === 'fam';
  const isTeam   = role === 'team';
  const isRT     = role === 'rt' || role === 'rta' || role === 'rtb' || role === 'rtc';

  // 配色設定
  let mainColor = uniformColor;
  if (!mainColor) {
    if (isNurse) mainColor = variant === 'B' ? 0x9333ea : variant === 'C' ? 0x5b21b6 : 0x7c3aed;
    else if (isSP) mainColor = variant === 'B' ? 0x10b981 : variant === 'C' ? 0x0d9488 : 0x059669;
    else if (isFamily) mainColor = 0x64748b;
    else if (isTeam) mainColor = 0x047857;
    else mainColor = variant === 'B' ? 0x0284c7 : variant === 'C' ? 0x1e3a8a : 0x2563eb;
  }

  const skinMat  = makeMat(THREE, 0xf6cbb0, 0.48, 0.02);
  const clothMat = makeMat(THREE, mainColor, 0.45, 0.06);
  const pantsMat = makeMat(THREE, isSP ? 0x065f46 : isNurse && isChibi ? 0x6b21a8 : 0x1e293b, 0.55, 0.05);
  const whiteMat = makeMat(THREE, 0xf8fafc, 0.35, 0.05);
  const hairHex  = isSP && variant === 'A' ? 0x94a3b8 : isNurse ? 0x27171c : isChibi ? 0x3b2314 : 0x1e293b;
  const hairMat  = makeMat(THREE, hairHex, 0.65, 0.05);

  const legLen = isChibi ? 15 : 20;
  const torsoH = isChibi ? 18 : 21;
  const headR  = isChibi ? 8.2 : 6.2;

  // 1. 雙腿與醫療鞋
  const leftLeg = new THREE.Group();
  leftLeg.position.set(isChibi ? -4.5 : -4.2, legLen, 0);
  cyl(THREE, leftLeg, 0, 0, isChibi ? 3.6 : 3.1, isChibi ? 3.2 : 2.7, -legLen, 0, pantsMat, 16);
  box(THREE, leftLeg, -3.5, -2.2, 3.5, 5.8, -legLen, -legLen + 3.8, isSP ? makeMat(THREE, 0xfbbf24, 0.5) : whiteMat);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(isChibi ? 4.5 : 4.2, legLen, 0);
  cyl(THREE, rightLeg, 0, 0, isChibi ? 3.6 : 3.1, isChibi ? 3.2 : 2.7, -legLen, 0, pantsMat, 16);
  box(THREE, rightLeg, -3.5, -2.2, 3.5, 5.8, -legLen, -legLen + 3.8, isSP ? makeMat(THREE, 0xfbbf24, 0.5) : whiteMat);
  root.add(leftLeg, rightLeg);

  // 2. 軀幹與特色服飾配件
  const upperBody = new THREE.Group();
  upperBody.position.set(0, legLen, 0);

  const torsoTopR = isChibi ? 8.2 : 7.3;
  const torsoBotR = isChibi ? 7.6 : 6.3;
  cyl(THREE, upperBody, 0, 0, torsoTopR, torsoBotR, 0, torsoH, clothMat, 24);

  // V 領內襯
  box(THREE, upperBody, -2.8, torsoTopR - 1.4, 2.8, torsoTopR + 0.2, torsoH - 5.5, torsoH, whiteMat);

  // ── 依角色與款式 A / B / C 加上專屬醫療細節 ──
  if (isNurse) {
    if (variant === 'A') {
      // 款式 A：掛頸式金屬聽診器＋口袋三色筆
      const steth = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.45, 10, 28, Math.PI * 1.15), makeMat(THREE, 0x334155, 0.3, 0.7));
      steth.rotation.x = Math.PI * 0.58;
      steth.position.set(0, torsoH - 1.2, 3.2);
      upperBody.add(steth);
      sphere(THREE, upperBody, 3.6, torsoH - 6.5, torsoTopR + 0.3, 1.3, makeMat(THREE, 0xe2e8f0, 0.2, 0.9), [1, 1, 0.4]);
    } else if (variant === 'B') {
      // 款式 B：粉紫 Q 版配白色軟萌針織外罩＋愛心胸章
      cyl(THREE, upperBody, 0, -0.3, torsoTopR + 0.5, torsoBotR + 0.6, 1, torsoH - 2, whiteMat, 20);
      box(THREE, upperBody, -3.2, torsoTopR - 0.5, 3.2, torsoTopR + 1.0, 1, torsoH - 2, clothMat);
      sphere(THREE, upperBody, 3.5, torsoH - 5, torsoTopR + 0.6, 1.6, makeMat(THREE, 0xf43f5e, 0.3));
    } else if (variant === 'C') {
      // 款式 C：急診指揮官金色肩章＋腰包＋無線電對講機
      box(THREE, upperBody, -torsoTopR - 0.8, -2, torsoTopR + 0.8, 2, torsoH - 1.5, torsoH + 0.4, makeMat(THREE, 0xfbbf24, 0.3, 0.5));
      box(THREE, upperBody, -4.5, torsoTopR - 0.3, -1.8, torsoTopR + 1.4, torsoH - 6.5, torsoH - 2.5, makeMat(THREE, 0x0f172a, 0.3, 0.6)); // 肩麥克風
      box(THREE, upperBody, -torsoBotR - 0.5, -torsoBotR - 0.5, torsoBotR + 0.5, torsoBotR + 0.5, 0.5, 3.2, makeMat(THREE, 0x1e1b4b, 0.4));
    }
  } else if (isRT) {
    // 醫事放射師必備：胸前黃色 TLD 熱發光輻射劑量佩章！
    const tldMat = makeMat(THREE, 0xfacc15, 0.25, 0.2, { emissive: 0xca8a04, emissiveIntensity: 0.25 });
    box(THREE, upperBody, 2.2, torsoTopR - 0.2, 5.4, torsoTopR + 1.1, torsoH - 6.8, torsoH - 3.2, tldMat);
    box(THREE, upperBody, 2.8, torsoTopR + 1.15, 4.8, torsoTopR + 1.35, torsoH - 6.0, torsoH - 4.0, makeMat(THREE, 0x0f172a, 0.3));

    if (variant === 'A') {
      // 款式 A：外搭挺版短白袍（Open Lab Coat）
      const coatMat = makeMat(THREE, 0xffffff, 0.35, 0.05);
      cyl(THREE, upperBody, 0, -0.4, torsoTopR + 0.55, torsoBotR + 0.8, -3, torsoH - 0.5, coatMat, 22);
      box(THREE, upperBody, -2.6, torsoTopR - 0.6, 2.6, torsoTopR + 1.2, -3, torsoH - 0.4, clothMat); // 正面敞開露刷手服
    } else if (variant === 'C') {
      // 款式 C：防輻射鉛衣背心（Lead Apron）＋紅色甲狀腺防護鉛領（Thyroid Collar）
      const leadMat = makeMat(THREE, 0x334155, 0.35, 0.25);
      const trimMat = makeMat(THREE, 0x0ea5e9, 0.3, 0.2);
      cyl(THREE, upperBody, 0, 0, torsoTopR + 0.6, torsoBotR + 0.7, -2, torsoH - 1.5, leadMat, 20);
      box(THREE, upperBody, -torsoBotR - 0.8, -torsoBotR - 0.8, torsoBotR + 0.8, torsoBotR + 0.8, 5, 8.2, trimMat); // 魔鬼氈腰封
      const collar = new THREE.Mesh(new THREE.TorusGeometry(3.8, 1.35, 12, 24), makeMat(THREE, 0xdc2626, 0.35));
      collar.rotation.x = Math.PI / 2;
      collar.position.set(0, torsoH + 0.6, 0.4);
      upperBody.add(collar);
    }
  } else if (isSP) {
    if (variant === 'A') {
      // 款式 A：薄荷綠住院服配白色橫紋與深綠領口
      box(THREE, upperBody, -torsoTopR, -torsoTopR, torsoTopR, torsoTopR, torsoH * 0.45, torsoH * 0.58, whiteMat);
    } else if (variant === 'C') {
      // 款式 C：日式檢查袍＋米白保暖披肩
      const shawl = new THREE.Mesh(new THREE.CylinderGeometry(torsoTopR + 1.2, torsoTopR + 2.2, 8.5, 24), makeMat(THREE, 0xfef3c7, 0.6));
      shawl.position.set(0, torsoH - 3.5, 0);
      upperBody.add(shawl);
    }
  }

  // 3. 頭部、精緻五官與髮型／帽子
  const headGroup = new THREE.Group();
  headGroup.position.set(0, torsoH + headR * 0.78, 0);
  sphere(THREE, headGroup, 0, 0, 0, headR, skinMat);
  // 雙耳
  sphere(THREE, headGroup, -headR * 0.96, -0.3, 0, headR * 0.24, skinMat);
  sphere(THREE, headGroup,  headR * 0.96, -0.3, 0, headR * 0.24, skinMat);

  addDetailedFace(THREE, headGroup, {
    isChibi,
    hasGlasses: isRT && variant === 'B',
    hasGoggles: isNurse && variant === 'C',
    hasMask: (isNurse || isRT || isTeam) && variant === 'A',
    hairColor: hairHex
  });

  // 髮型細節
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(headR * 1.04, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  headGroup.add(hairCap);
  // 額頭劉海
  sphere(THREE, headGroup, -headR * 0.3, headR * 0.48, headR * 0.78, headR * 0.36, hairMat, [1.4, 0.7, 0.6]);
  sphere(THREE, headGroup,  headR * 0.25, headR * 0.52, headR * 0.76, headR * 0.34, hairMat, [1.3, 0.65, 0.6]);

  if (isNurse) {
    // 後腦杓立體馬尾／丸子髮髻
    sphere(THREE, headGroup, 0, headR * 0.15, -headR * 1.05, headR * 0.42, hairMat);
    // 經典立體護士帽＋紅十字
    const capH = isChibi ? headR * 0.95 : headR * 0.88;
    box(THREE, headGroup, -4.6, -2.2, 4.6, 2.8, capH, capH + 3.6, whiteMat);
    const redMat = makeMat(THREE, 0xdc2626, 0.2);
    box(THREE, headGroup, -0.75, 2.82, 0.75, 3.15, capH + 0.7, capH + 2.9, redMat);
    box(THREE, headGroup, -1.9,  2.82, 1.9,  3.15, capH + 1.4, capH + 2.2, redMat);
  } else if (isSP && variant === 'B') {
    // 款式 B 標準病人：頭頂漂浮可愛綠白 SP 膠囊徽章
    const spBadge = box(THREE, headGroup, -4.2, -1.5, 4.2, 1.5, headR + 1.5, headR + 4.5, makeMat(THREE, 0x059669, 0.2, 0.2, { emissive: 0x047857, emissiveIntensity: 0.3 }));
  }

  upperBody.add(headGroup);

  // 4. 雙臂與手部醫療道具（甦醒球、病人手圈＋留置針）
  const armLen = isChibi ? 12.5 : 15;
  const armX   = torsoTopR + (isChibi ? 1.8 : 1.5);

  const leftArm = new THREE.Group();
  leftArm.position.set(-armX, torsoH - 1.5, 0);
  cyl(THREE, leftArm, 0, 0, 2.4, 2.1, -armLen, 0, isRT && variant === 'A' ? whiteMat : clothMat, 14);
  sphere(THREE, leftArm, 0, -armLen - 1, 0, 2.5, skinMat);

  const rightArm = new THREE.Group();
  rightArm.position.set(armX, torsoH - 1.5, 0);
  cyl(THREE, rightArm, 0, 0, 2.4, 2.1, -armLen, 0, isRT && variant === 'A' ? whiteMat : clothMat, 14);
  sphere(THREE, rightArm, 0, -armLen - 1, 0, 2.5, skinMat);

  // 標準病人手腕辨識手圈＋留置針（IV lock）
  if (isSP) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.45, 8, 20), makeMat(THREE, 0x38bdf8, 0.2));
    band.rotation.x = Math.PI / 2;
    band.position.set(0, -armLen + 1.8, 0);
    rightArm.add(band);
    box(THREE, leftArm, -1.2, 1.8, 1.2, 2.9, -armLen - 1.2, -armLen + 0.5, makeMat(THREE, 0xf43f5e, 0.3)); // 粉紅 IV 留置針頭
  }

  // 右手所持甦醒球（Ambu bag）
  const handAmbu = new THREE.Group();
  handAmbu.position.set(0, -armLen - 1.5, 4);
  handAmbu.visible = false;
  const ambuBag = new THREE.Mesh(new THREE.SphereGeometry(3.9, 18, 14), makeMat(THREE, 0x06b6d4, 0.18, 0.1, { transparent: true, opacity: 0.88 }));
  ambuBag.scale.set(1.38, 0.92, 0.92);
  const ambuMask = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4.5, 16), makeMat(THREE, 0xe2e8f0, 0.25, 0.1, { transparent: true, opacity: 0.78 }));
  ambuMask.rotation.x = Math.PI / 2;
  ambuMask.position.set(0, -2, 4);
  handAmbu.add(ambuBag, ambuMask);
  rightArm.add(handAmbu);

  upperBody.add(leftArm, rightArm);
  root.add(upperBody);

  // 5. 腳底隊長金色雙層星芒光環
  const leaderRing = new THREE.Group();
  const rOuter = new THREE.Mesh(new THREE.RingGeometry(11.5, 15.2, 40), new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide }));
  const rInner = new THREE.Mesh(new THREE.RingGeometry(8.5, 10.0, 40), new THREE.MeshBasicMaterial({ color: 0xfde68a, side: THREE.DoubleSide }));
  rOuter.rotation.x = rInner.rotation.x = -Math.PI / 2;
  leaderRing.position.y = 1.2;
  leaderRing.add(rOuter, rInner);
  leaderRing.visible = isLeader;
  root.add(leaderRing);

  // 6. 頭頂名牌標籤
  let badge = null;
  if (makeLabelFn && name) {
    badge = makeLabelFn(name, {
      size: 15,
      bg: isNurse ? '#6d28d9' : isSP ? '#047857' : isFamily ? '#4b5563' : '#1e40af',
      fg: '#ffffff',
      border: isLeader ? '#fbbf24' : null
    });
    badge.position.set(0, legLen + torsoH + headR * 2 + 12, 0);
    root.add(badge);
  }

  root.userData = {
    role, variant, isChibi, legLen, torsoH, armLen,
    leftLeg, rightLeg, upperBody, leftArm, rightArm, headGroup, handAmbu, leaderRing, badge,
    pose: 'idle'
  };
  return root;
}

// ── 建立模擬假人安妮（支援 A / B / C 三款造型）────────────────
export function buildAnnieCharacter(THREE, { variant = 'C', makeLabelFn = null } = {}) {
  const root = new THREE.Group();
  const skinMat = makeMat(THREE, 0xf3c6a2, 0.42, 0.04);
  const pantsMat = makeMat(THREE, variant === 'A' ? 0x1e3a8a : 0x0284c7, 0.55, 0.05);

  // 軀幹與胸廓容器（隨 CPR 壓胸上下起伏）
  const chestMesh = new THREE.Group();
  chestMesh.position.set(0, 9.2, -6);

  let heartMesh = null;
  let lungsGroup = null;
  let qcprRing = null;

  if (variant === 'A') {
    // 款式 A：Laerdal Resusci Anne 經典訓練假人（膚色胸廓＋藍白運動外套敞開＋QCPR 綠光深度回饋器）
    box(THREE, chestMesh, -7.6, -12, 7.6, 12, -3.8, 3.8, skinMat);
    // 兩側敞開藍白運動訓練外套
    const jacketMat = makeMat(THREE, 0x1d4ed8, 0.45);
    box(THREE, chestMesh, -8.8, -12.2, -4.8, 12.2, -3.6, 4.1, jacketMat);
    box(THREE, chestMesh,  4.8, -12.2,  8.8, 12.2, -3.6, 4.1, jacketMat);
    box(THREE, chestMesh, -8.9, -12.2, -4.5, 12.2,  3.8, 4.25, makeMat(THREE, 0xffffff, 0.3));
    box(THREE, chestMesh,  4.5, -12.2,  8.9, 12.2,  3.8, 4.25, makeMat(THREE, 0xffffff, 0.3));
    // 胸骨正中央 Laerdal QCPR 發光感測環
    qcprRing = new THREE.Mesh(new THREE.RingGeometry(2.0, 3.6, 28), new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide }));
    qcprRing.rotation.x = -Math.PI / 2;
    qcprRing.position.set(0, 4.0, -2);
    chestMesh.add(qcprRing);
  } else if (variant === 'B') {
    // 款式 B：高擬真急診住院病患（淺藍病人服敞開前胸＋紅黃綠三色 ECG 電極貼片＋手部血氧夾）
    box(THREE, chestMesh, -7.8, -12, 7.8, 12, -3.8, 3.8, skinMat);
    const gownMat = makeMat(THREE, 0x7dd3fc, 0.55);
    box(THREE, chestMesh, -8.5, -12, -4.2, 12, -3.6, 4.0, gownMat);
    box(THREE, chestMesh,  4.2, -12,  8.5, 12, -3.6, 4.0, gownMat);
    // 紅、黃、綠三色 ECG 電極貼片
    cyl(THREE, chestMesh, -3.5, -7.5, 1.3, 1.3, 3.8, 4.3, makeMat(THREE, 0xef4444, 0.3), 16);
    cyl(THREE, chestMesh,  3.5, -7.5, 1.3, 1.3, 3.8, 4.3, makeMat(THREE, 0xfacc15, 0.3), 16);
    cyl(THREE, chestMesh,  3.2,  3.5, 1.3, 1.3, 3.8, 4.3, makeMat(THREE, 0x22c55e, 0.3), 16);
  } else {
    // 款式 C：透明科技解剖教學假人（半透明胸腔＋立體跳動紅心臟＋粉紅充氣雙肺＋發光氣管！）
    const glassChest = new THREE.Mesh(
      new THREE.BoxGeometry(15.6, 7.8, 24),
      new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.42, roughness: 0.12, transmission: 0.55 })
    );
    chestMesh.add(glassChest);

    // 內部立體紅心臟（隨壓胸收縮跳動）
    heartMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.9, 20, 16),
      makeMat(THREE, 0xdc2626, 0.25, 0.1, { emissive: 0x991b1b, emissiveIntensity: 0.45 })
    );
    heartMesh.scale.set(1.0, 0.85, 1.25);
    heartMesh.position.set(0.8, 0.4, -2.2);
    chestMesh.add(heartMesh);

    // 內部左右雙肺（隨甦醒球通氣膨脹）
    lungsGroup = new THREE.Group();
    const lungMat = makeMat(THREE, 0xfb7185, 0.35, 0.05, { emissive: 0xe11d48, emissiveIntensity: 0.2 });
    sphere(THREE, lungsGroup, -4.2, 0.2, -2.5, 3.4, lungMat, [0.85, 0.72, 1.45]);
    sphere(THREE, lungsGroup,  4.2, 0.2, -2.5, 3.4, lungMat, [0.85, 0.72, 1.45]);
    chestMesh.add(lungsGroup);

    // 發光肋骨框架線條
    for (const z of [-7, -3.5, 0, 3.5]) {
      box(THREE, chestMesh, -7.2, z - 0.35, 7.2, z + 0.35, 3.6, 3.95, makeMat(THREE, 0xf8fafc, 0.2, 0.1, { transparent: true, opacity: 0.7 }));
    }
  }

  // 胸口紅色十字壓胸定位標記
  const cprTarget = new THREE.Mesh(new THREE.RingGeometry(2.1, 3.3, 24), new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide }));
  cprTarget.rotation.x = -Math.PI / 2;
  cprTarget.position.set(0, 4.05, -2);
  chestMesh.add(cprTarget);
  root.add(chestMesh);

  // 下半身與雙腿
  box(THREE, root, -7.8, 6, 7.8, 30, 5.5, 12.2, pantsMat);

  // 頸部（含紅色頸動脈搏動感應區）與頭部（可壓額抬下巴後仰）
  cyl(THREE, root, 0, -19.5, 2.8, 3.1, 7.5, 11.5, skinMat, 16);
  sphere(THREE, root, 2.6, 9.8, -19.5, 0.9, makeMat(THREE, 0xef4444, 0.3)); // 頸動脈感測點

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 9.8, -23.5);
  sphere(THREE, headPivot, 0, 0, 0, 5.8, skinMat);
  // 假人柔和五官（閉眼睫毛、立體鼻樑、微張口氣道）
  for (const dir of [-1, 1]) {
    box(THREE, headPivot, dir * 1.9 - 0.9, -2.2, dir * 1.9 + 0.9, -1.6, 5.55, 5.85, makeMat(THREE, 0x4b5563, 0.5));
  }
  sphere(THREE, headPivot, 0, 5.7, 0.2, 0.65, skinMat, [0.8, 1.1, 1.0]); // 鼻頭
  sphere(THREE, headPivot, 0, 5.55, 2.2, 0.85, makeMat(THREE, 0xbe123c, 0.4), [1.2, 0.4, 0.7]); // 微張口部
  // 棕色假人頭髮
  const hair = new THREE.Mesh(new THREE.SphereGeometry(6.0, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), makeMat(THREE, 0x5c3a21, 0.65));
  hair.rotation.x = -Math.PI * 0.35;
  headPivot.add(hair);

  // 透明氧氣通氣面罩
  const maskOnFace = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4.2, 16), makeMat(THREE, 0x38bdf8, 0.2, 0.1, { transparent: true, opacity: 0.78 }));
  maskOnFace.position.set(0, 5.4, 1.0);
  maskOnFace.visible = false;
  headPivot.add(maskOnFace);
  root.add(headPivot);

  // 雙臂與手指血氧夾
  cyl(THREE, root, -9.6, -4, 2.2, 2.0, 6, 10, skinMat, 12);
  cyl(THREE, root,  9.6, -4, 2.2, 2.0, 6, 10, skinMat, 12);
  box(THREE, root, -10.6, 2, -8.6, 5, 6.2, 8.8, makeMat(THREE, 0x38bdf8, 0.2)); // 左手指 SpO2 血氧夾

  // AED 橘色電擊貼片（右鎖骨下＋左乳頭外側）
  const padsGroup = new THREE.Group();
  const padMat = makeMat(THREE, 0xf97316, 0.3, 0.1, { emissive: 0xea580c, emissiveIntensity: 0.28 });
  box(THREE, padsGroup, -6.5, -14, -2.0, -9.5, 12.9, 13.6, padMat);
  box(THREE, padsGroup,  2.5, -5.5,  7.0, -1.0, 12.9, 13.6, padMat);
  padsGroup.visible = false;
  root.add(padsGroup);

  if (makeLabelFn) {
    const lbl = makeLabelFn('🫀 模擬假人 (安妮)', { size: 15, bg: '#991b1b', fg: '#fff', border: '#fca5a5' });
    lbl.position.set(0, 28, -8);
    root.add(lbl);
  }

  root.userData = { variant, chestMesh, headPivot, padsGroup, maskOnFace, heartMesh, lungsGroup, qcprRing, cprActive: false };
  return root;
}

// ── 角色關節動畫更新器（供主場景與選角試衣間共用）──────────────
export function tickCharacterAnimation(actor, now) {
  const u = actor.userData;
  if (!u) return;

  // 若為模擬假人安妮
  if (u.chestMesh && !u.upperBody) {
    if (u.cprActive) {
      const comp = Math.abs(Math.sin(now * 0.0115));
      u.chestMesh.position.y = 9.2 - comp * 1.65;
      if (u.heartMesh) {
        const s = 1 - comp * 0.28;
        u.heartMesh.scale.set(s, s * 0.85, s * 1.25);
      }
      if (u.lungsGroup) {
        const breath = 1 + Math.sin(now * 0.005) * 0.18;
        u.lungsGroup.scale.set(breath, breath, breath);
      }
    } else {
      u.chestMesh.position.y = 9.2;
      if (u.heartMesh) u.heartMesh.scale.set(1.0, 0.85, 1.25);
      if (u.lungsGroup) u.lungsGroup.scale.set(1, 1, 1);
    }
    return;
  }

  // 站立角色關節更新
  if (u.pose === 'walk') {
    const sw = Math.sin(now * 0.014) * 0.55;
    u.leftLeg.rotation.x = sw;
    u.rightLeg.rotation.x = -sw;
    u.leftArm.rotation.x = -sw * 0.85;
    u.rightArm.rotation.x = sw * 0.85;
    u.upperBody.rotation.x = 0.08;
    u.leftArm.rotation.z = u.rightArm.rotation.z = 0;
  } else if (u.pose === 'cpr') {
    const stroke = Math.abs(Math.sin(now * 0.0115));
    u.leftLeg.rotation.x = u.rightLeg.rotation.x = 0;
    u.upperBody.rotation.x = 0.42 + stroke * 0.17;
    u.leftArm.rotation.x = -1.15;
    u.rightArm.rotation.x = -1.15;
    u.leftArm.rotation.z = 0.18;
    u.rightArm.rotation.z = -0.18;
  } else if (u.pose === 'bagging') {
    const sq = Math.sin(now * 0.005) * 0.25;
    u.leftLeg.rotation.x = u.rightLeg.rotation.x = 0;
    u.upperBody.rotation.x = 0.22;
    u.leftArm.rotation.x = -0.9;
    u.rightArm.rotation.x = -1.05 + sq;
    u.leftArm.rotation.z = u.rightArm.rotation.z = 0;
  } else if (u.pose === 'check') {
    u.leftLeg.rotation.x = u.rightLeg.rotation.x = 0;
    u.upperBody.rotation.x = 0.35;
    u.leftArm.rotation.x = -0.95 + Math.sin(now * 0.015) * 0.22;
    u.rightArm.rotation.x = -0.85;
    u.leftArm.rotation.z = u.rightArm.rotation.z = 0;
  } else if (u.pose === 'clear') {
    u.leftLeg.rotation.x = u.rightLeg.rotation.x = 0;
    u.upperBody.rotation.x = 0;
    u.leftArm.rotation.x = -2.4;
    u.rightArm.rotation.x = -2.4;
    u.leftArm.rotation.z = -0.35;
    u.rightArm.rotation.z = 0.35;
  } else {
    u.leftLeg.rotation.x = u.rightLeg.rotation.x = 0;
    u.upperBody.rotation.x = Math.sin(now * 0.003) * 0.025;
    u.leftArm.rotation.x = u.rightArm.rotation.x = 0;
    u.leftArm.rotation.z = -0.06;
    u.rightArm.rotation.z = 0.06;
  }
}
