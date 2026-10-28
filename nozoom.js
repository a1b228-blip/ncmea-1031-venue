// 外層頁面用：擋掉整頁放大縮小（觸控板捏合、Ctrl＋滾輪、⌘＋／⌘－），
// 讓上方分頁按鈕維持原尺寸；要放大請在 3D 畫面裡操作。
(() => {
  addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) addEventListener(t, e => e.preventDefault());
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['=', '+', '-'].includes(e.key)) e.preventDefault();   // ⌘0 保留：可把瀏覽器縮放恢復 100%
  });
  // 萬一網頁被推到旁邊（例如觸控板左右滑），立刻拉回最左邊
  const snapX = () => { if (scrollX !== 0) scrollTo(0, scrollY); if (document.documentElement.scrollLeft) document.documentElement.scrollLeft = 0; };
  addEventListener('scroll', snapX, { passive: true });
  addEventListener('load', snapX); addEventListener('pageshow', snapX);
})();
