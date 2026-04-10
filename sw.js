const CACHE='jivanlog-v61';
const ASSETS=['./', './index.html','./manifest.json','./icon.svg','https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check-compat.js','https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js','https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js','https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js','https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(['firebaseio.com','googleapis.com','identitytoolkit'].some(d=>e.request.url.includes(d)))return;
  e.respondWith(caches.match(e.request).then(hit=>{
    if(hit)return hit;
    return fetch(e.request).then(r=>{
      if(r.ok){const rc=r.clone();caches.open(CACHE).then(c=>c.put(e.request,rc));}
      return r;
    }).catch(()=>caches.match('./index.html'));
  }));
});
