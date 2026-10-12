// Service worker: يجعل الموقع قابلاً للتثبيت ويعمل بدون إنترنت بعد أول زيارة.
// الشبكة أولاً (لتصل تحديثات الأسئلة فوراً)، ثم النسخة المخزنة عند انقطاع الاتصال.
const CACHE = 'safety-v2';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // لا نتدخل في طلبات Google Apps Script (الأسئلة والنتائج) حتى تبقى حيّة دائماً
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200 && (url.origin === location.origin || res.type === 'cors')) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
