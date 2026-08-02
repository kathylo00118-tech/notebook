const CACHE_NAME = 'notebook-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 安装事件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 激活事件
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 获取事件 - 网络优先，失败时使用缓存
self.addEventListener('fetch', event => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 克隆响应
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(response => {
            return response || new Response('离线 - 无可用缓存', {
              status: 503,
              statusText: '离线',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
