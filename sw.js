// ================================
// Service Worker для Portfolio Site
// ================================

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `zerikc-portfolio-${CACHE_VERSION}`;

const isDevelopment = self.registration?.scope?.includes('localhost') || 
                      self.registration?.scope?.includes('127.0.0.1') ||
                      self.location?.hostname === 'localhost' ||
                      self.location?.hostname === '127.0.0.1';

const swLogger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    error: (...args) => {
        console.error(...args);
    },
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    }
};

// Статические ресурсы для кеширования
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/script.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/apple-touch-icon.png',
  '/images/favicon.png',
  '/images/weather-icon.png',
  '/images/homie-icon.png',
  '/images/floralia-icon.png',
  '/images/checklist-icon.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  swLogger.log('[SW] Installing Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        swLogger.log('[SW] Precaching App Shell');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        swLogger.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        swLogger.error('[SW] Installation failed:', error);
      })
  );
});

// Активация Service Worker и очистка старых кешей
self.addEventListener('activate', (event) => {
  swLogger.log('[SW] Activating Service Worker...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              swLogger.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        swLogger.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch события - стратегия кеширования
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Игнорировать не-GET запросы
  if (request.method !== 'GET') {
    return;
  }

  // Игнорировать внешние запросы (не с нашего домена)
  if (url.origin !== location.origin) {
    return;
  }

  // Стратегия для HTML: Network First, затем Cache
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Клонируем ответ для кеша
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, возвращаем из кеша
          return caches.match(request).then((response) => {
            return response || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Стратегия для статики: Cache First, затем Network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Возвращаем из кеша и обновляем кеш в фоне
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            })
            .catch(() => {
              // Игнорируем ошибки фоновой загрузки
            });
          
          return cachedResponse;
        }

        // Если нет в кеше, загружаем из сети
        return fetch(request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Клонируем ответ для кеша
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          })
          .catch((error) => {
            swLogger.error('[SW] Fetch failed:', error);
            
            // Возвращаем fallback для изображений
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#007AFF" width="200" height="200"/><text fill="#fff" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            throw error;
          });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

// Периодическая синхронизация (если поддерживается)
self.addEventListener('sync', (event) => {
  swLogger.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      Promise.resolve()
    );
  }
});

swLogger.log('[SW] Service Worker loaded', CACHE_VERSION);

