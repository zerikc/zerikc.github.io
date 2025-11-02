// ================================
// Logger Utility - Development/Production Helper
// ================================

(function() {
    'use strict';
    
    // Определяем, находимся ли мы в development режиме
    const isDevelopment = 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('.dev') ||
        window.location.hostname.includes('local') ||
        window.location.search.includes('debug=true');
    
    // Создаем объект logger
    const logger = {
        log: function(...args) {
            if (isDevelopment) {
                console.log(...args);
            }
        },
        
        error: function(...args) {
            // Ошибки всегда логируем
            console.error(...args);
        },
        
        warn: function(...args) {
            if (isDevelopment) {
                console.warn(...args);
            }
        },
        
        info: function(...args) {
            if (isDevelopment) {
                console.info(...args);
            }
        },
        
        debug: function(...args) {
            if (isDevelopment) {
                console.debug(...args);
            }
        }
    };
    
    // Экспортируем глобально
    window.logger = logger;
})();

