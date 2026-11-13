// 売店FAQ：船内iPadでオフライン時にも保存済みFAQを表示する。
// 通信があるときはサーバー側の更新版を優先（公開のたびに版数変更は不要）。
const CACHE="baiten-faq-staff-v2";
const FILES=["./","./index.html","./faq-data.json","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("baiten-faq-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const url=new URL(req.url);
    const cacheKey=url.pathname.endsWith("/faq-data.json")?"./faq-data.json":req;
    const saved=await cache.match(cacheKey,{ignoreSearch:true});
    // ネットワーク取得が成功すればキャッシュ更新。3秒無応答なら保存済み版。
    const online=fetch(req,{cache:"no-store"}).then(res=>{
      if(res.ok)cache.put(cacheKey,res.clone());
      return res;
    });
    if(!saved)return online.catch(()=>req.mode==="navigate"?cache.match("./index.html"):Response.error());
    const deadline=new Promise(resolve=>setTimeout(()=>resolve(saved),3000));
    return Promise.race([online.catch(()=>saved),deadline]);
  })());
});
