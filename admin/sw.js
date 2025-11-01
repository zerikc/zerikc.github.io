// ====================================
// Service Worker для админ-панели
// Версия 2.0 - PWA Support
// ====================================

const CACHE_NAME = 'admin-panel-v2.0';
const RUNTIME_CACHE = 'runtime-cache-v2.0';

// Файлы для кэширования при установке
const STATIC_ASSETS = [
    '/admin.html',
    '/css/admin-standalone.css',
    '/css/admin-unified.css',
    '/css/admin-apple.css',
    '/css/admin-apple-tables.css',
    '/css/admin-mobile.css',
    '/js/admin.js',
    '/js/mobile.js',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Skip waiting');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Cache error:', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Удалить старые кэши
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch обработчик - Network First для API, Cache First для статики
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Игнорировать не-GET запросы
    if (request.method !== 'GET') {
        return;
    }
    
    // Firebase запросы - всегда с сети
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ offline: true, error: 'No network connection' }),
                    {
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }
    
    // Статические ресурсы - Cache First
    if (request.url.includes('/css/') || 
        request.url.includes('/js/') || 
        request.url.includes('/icons/') ||
        request.url.endsWith('.html')) {
        
        event.respondWith(
            caches.match(request)
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    return fetch(request).then((response) => {
                        // Кэшировать успешные ответы
                        if (response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(RUNTIME_CACHE).then((cache) => {
                                cache.put(request, responseToCache);
                            });
                        }
                        return response;
                    });
                })
                .catch(() => {
                    // Оффлайн fallback
                    if (request.url.endsWith('.html')) {
                        return caches.match('/admin.html');
                    }
                })
        );
        return;
    }
    
    // Все остальное - Network First
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Кэшировать успешные ответы
                if (response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Попытка получить из кэша
                return caches.match(request);
            })
    );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        const urlsToCache = event.data.urls || [];
        event.waitUntil(
            caches.open(RUNTIME_CACHE).then((cache) => {
                return cache.addAll(urlsToCache);
            })
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        return caches.delete(cacheName);
                    })
                );
            })
        );
    }
});

// Background Sync (для будущего использования)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        console.log('[SW] Background sync triggered');
        // event.waitUntil(syncData());
    }
});

// Push Notifications (для будущего использования)
self.addEventListener('push', (event) => {
    const title = 'Admin Panel';
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/admin.html')
    );
});

console.log('[SW] Service Worker loaded');

