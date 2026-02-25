const CACHE = 'jivanlog-v2';
const ASSETS = [
  './', './index.html', './manifest.json', './icon.svg',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js',
];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  // Always go to network for Firebase — never cache auth/db calls
  if(e.request.url.includes('firebaseio.com')||e.request.url.includes('googleapis.com')||e.request.url.includes('google.com/identitytoolkit')) return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{ if(resp.ok){const c=resp.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));} return resp; }).catch(()=>cached)));
});
