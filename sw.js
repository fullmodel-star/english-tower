// 英語之塔 — Service Worker(離線快取,家族標準「等待+橫幅」型)
// CACHE 名稱必須維持 stamp-version.mjs 樣式A(…-v<N>),CI 部署時會用 commit 數自動蓋版號。
// ⚠️ 不可在 install 階段 skipWaiting():那會讓新版直接接管+觸發頁面 reload,
//    玩到一半的戰鬥會被強制中斷。等待→頁面橫幅→使用者按了才 SKIP_WAITING。
const CACHE = "english-tower-v74";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 快取優先;網路成功時順手更新快取。assets/ 的 28 張怪物圖不在預快取清單
// (是加分項不是必需品,index.html 有 onerror 退回 emoji),第一次線上載到後由這裡進快取,之後離線也有圖。
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      const net = fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});

self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING" || e.data === "skipWaiting" || (e.data && e.data.type === "SKIP_WAITING")) self.skipWaiting();
});
