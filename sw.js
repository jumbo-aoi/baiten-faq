// 売店お助けFAQ：電波がなくても開けるようにするための仕組み
// 内容を更新したら、下の版数（v1→v2…）を1つ上げてください。
const CACHE = "baiten-faq-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// 電波があれば最新版を取りに行き、なければ（または3秒で返事がなければ）保存済みの版を表示
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; });
    if (!cached) return net.catch(() => cache.match("./index.html"));
    const timeout = new Promise(r => setTimeout(() => r(cached), 3000));
    return Promise.race([net.catch(() => cached), timeout]);
  })());
});
