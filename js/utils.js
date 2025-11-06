/**
 * ================================
 * Utility Functions Library
 * ================================
 * 
 * Библиотека утилит для работы с DOM, анимациями, состоянием и производительностью.
 * Вдохновлено подходом Apple App Store для создания плавных и отзывчивых интерфейсов.
 * 
 * @version 1.0.0
 * @author Zerikc Apps
 */

(function() {
    'use strict';

    // ================================
    // АНИМАЦИИ
    // ================================
    // Функции для создания плавных анимаций элементов

    /**
     * Плавная анимация появления элемента (fade in)
     * 
     * @param {HTMLElement} element - Элемент для анимации
     * @param {Object} options - Опции анимации
     * @param {number} options.duration - Длительность анимации в мс (по умолчанию: 300)
     * @param {number} options.delay - Задержка перед началом анимации в мс (по умолчанию: 0)
     * @param {string} options.easing - Функция плавности (по умолчанию: 'ease-out')
     * @param {number} options.from - Начальная прозрачность (по умолчанию: 0)
     * @param {number} options.to - Конечная прозрачность (по умолчанию: 1)
     * @returns {Promise} - Promise, который разрешается после завершения анимации
     * 
     * @example
     * Utils.fadeIn(element, { duration: 500, delay: 100 });
     */
    function fadeIn(element, options = {}) {
        const {
            duration = 300,
            delay = 0,
            easing = 'ease-out',
            from = 0,
            to = 1
        } = options;

        return new Promise((resolve) => {
            element.style.opacity = from;
            element.style.transition = `opacity ${duration}ms ${easing}`;
            
            setTimeout(() => {
                element.style.opacity = to;
                
                setTimeout(() => {
                    element.style.transition = '';
                    resolve();
                }, duration);
            }, delay);
        });
    }

    /**
     * Плавная анимация исчезновения элемента (fade out)
     * 
     * @param {HTMLElement} element - Элемент для анимации
     * @param {Object} options - Опции анимации
     * @param {number} options.duration - Длительность анимации в мс (по умолчанию: 300)
     * @param {number} options.delay - Задержка перед началом анимации в мс (по умолчанию: 0)
     * @param {string} options.easing - Функция плавности (по умолчанию: 'ease-in')
     * @returns {Promise} - Promise, который разрешается после завершения анимации
     * 
     * @example
     * Utils.fadeOut(element, { duration: 200 });
     */
    function fadeOut(element, options = {}) {
        const {
            duration = 300,
            delay = 0,
            easing = 'ease-in'
        } = options;

        return new Promise((resolve) => {
            element.style.transition = `opacity ${duration}ms ${easing}`;
            
            setTimeout(() => {
                element.style.opacity = '0';
                
                setTimeout(() => {
                    element.style.transition = '';
                    resolve();
                }, duration);
            }, delay);
        });
    }

    /**
     * Анимация скольжения элемента (slide in)
     * 
     * @param {HTMLElement} element - Элемент для анимации
     * @param {Object} options - Опции анимации
     * @param {number} options.duration - Длительность анимации в мс (по умолчанию: 400)
     * @param {number} options.delay - Задержка перед началом анимации в мс (по умолчанию: 0)
     * @param {string} options.direction - Направление: 'up', 'down', 'left', 'right' (по умолчанию: 'up')
     * @param {number} options.distance - Расстояние скольжения в px (по умолчанию: 30)
     * @param {string} options.easing - Функция плавности (по умолчанию: cubic-bezier)
     * @returns {Promise} - Promise, который разрешается после завершения анимации
     * 
     * @example
     * Utils.slideIn(element, { direction: 'up', distance: 50 });
     */
    function slideIn(element, options = {}) {
        const {
            duration = 400,
            delay = 0,
            direction = 'up',
            distance = 30,
            easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
        } = options;

        const directions = {
            up: `translateY(${distance}px)`,
            down: `translateY(-${distance}px)`,
            left: `translateX(${distance}px)`,
            right: `translateX(-${distance}px)`
        };

        const transform = directions[direction] || directions.up;

        return new Promise((resolve) => {
            element.style.opacity = '0';
            element.style.transform = transform;
            element.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
            
            // Оптимизация производительности через will-change
            element.style.willChange = 'opacity, transform';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translate(0, 0)';
                
                setTimeout(() => {
                    element.style.transition = '';
                    element.style.willChange = 'auto';
                    resolve();
                }, duration);
            }, delay);
        });
    }

    /**
     * Анимация масштабирования элемента (scale in)
     * 
     * @param {HTMLElement} element - Элемент для анимации
     * @param {Object} options - Опции анимации
     * @param {number} options.duration - Длительность анимации в мс (по умолчанию: 300)
     * @param {number} options.delay - Задержка перед началом анимации в мс (по умолчанию: 0)
     * @param {number} options.from - Начальный масштаб (по умолчанию: 0.9)
     * @param {number} options.to - Конечный масштаб (по умолчанию: 1)
     * @param {string} options.easing - Функция плавности с bounce эффектом
     * @returns {Promise} - Promise, который разрешается после завершения анимации
     * 
     * @example
     * Utils.scaleIn(element, { from: 0.8, to: 1 });
     */
    function scaleIn(element, options = {}) {
        const {
            duration = 300,
            delay = 0,
            from = 0.9,
            to = 1,
            easing = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
        } = options;

        return new Promise((resolve) => {
            element.style.opacity = '0';
            element.style.transform = `scale(${from})`;
            element.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
            element.style.willChange = 'opacity, transform';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = `scale(${to})`;
                
                setTimeout(() => {
                    element.style.transition = '';
                    element.style.willChange = 'auto';
                    resolve();
                }, duration);
            }, delay);
        });
    }

    /**
     * Последовательная анимация группы элементов (stagger effect)
     * Каждый элемент анимируется с небольшой задержкой после предыдущего
     * 
     * @param {NodeList|Array} elements - Коллекция элементов для анимации
     * @param {Function} animationFn - Функция анимации (fadeIn, slideIn, scaleIn и т.д.)
     * @param {Object} options - Опции анимации
     * @param {number} options.delay - Задержка между элементами в мс (по умолчанию: 50)
     * @param {number} options.startDelay - Начальная задержка в мс (по умолчанию: 0)
     * @returns {Promise} - Promise, который разрешается после завершения всех анимаций
     * 
     * @example
     * Utils.stagger(document.querySelectorAll('.card'), Utils.slideIn, { delay: 100 });
     */
    async function stagger(elements, animationFn, options = {}) {
        const {
            delay = 50,
            startDelay = 0
        } = options;

        await new Promise(resolve => setTimeout(resolve, startDelay));

        const promises = Array.from(elements).map((element, index) => {
            return new Promise(resolve => {
                setTimeout(() => {
                    animationFn(element).then(resolve);
                }, index * delay);
            });
        });

        return Promise.all(promises);
    }

    // ================================
    // РАБОТА С DOM
    // ================================
    // Утилиты для удобной работы с элементами DOM

    /**
     * Безопасное получение одного элемента по селектору
     * 
     * @param {string|HTMLElement} selector - CSS селектор или уже существующий элемент
     * @returns {HTMLElement|null} - Найденный элемент или null
     * 
     * @example
     * const element = Utils.$('.my-class');
     * const element2 = Utils$(existingElement);
     */
    function $(selector) {
        if (typeof selector === 'string') {
            return document.querySelector(selector);
        }
        return selector instanceof HTMLElement ? selector : null;
    }

    /**
     * Безопасное получение всех элементов по селектору
     * 
     * @param {string} selector - CSS селектор
     * @returns {NodeList} - Коллекция найденных элементов
     * 
     * @example
     * const elements = Utils.$$('.my-class');
     */
    function $$(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * Проверка видимости элемента в viewport
     * 
     * @param {HTMLElement} element - Элемент для проверки
     * @returns {boolean} - true, если элемент виден в viewport
     * 
     * @example
     * if (Utils.isVisible(element)) {
     *     // Элемент виден
     * }
     */
    function isVisible(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && 
               rect.top < window.innerHeight && 
               rect.bottom > 0;
    }

    /**
     * Плавная прокрутка к указанному элементу
     * 
     * @param {HTMLElement|string} target - Целевой элемент или селектор
     * @param {Object} options - Опции прокрутки
     * @param {number} options.offset - Смещение от верха в px (по умолчанию: 0)
     * @param {string} options.behavior - Поведение: 'smooth' или 'auto' (по умолчанию: 'smooth')
     * @param {number} options.duration - Длительность для fallback анимации в мс (по умолчанию: 500)
     * 
     * @example
     * Utils.scrollTo('#section', { offset: -80, behavior: 'smooth' });
     */
    function scrollTo(target, options = {}) {
        const {
            offset = 0,
            behavior = 'smooth',
            duration = 500
        } = options;

        const element = typeof target === 'string' ? $(target) : target;
        if (!element) return;

        const targetPosition = element.getBoundingClientRect().top + window.pageYOffset + offset;

        // Используем нативный smooth scroll, если доступен
        if (behavior === 'smooth' && 'scrollBehavior' in document.documentElement.style) {
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        } else {
            // Fallback для старых браузеров с ручной анимацией
            const startPosition = window.pageYOffset;
            const distance = targetPosition - startPosition;
            let startTime = null;

            function animation(currentTime) {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                
                // Easing функция (ease-in-out)
                const ease = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                window.scrollTo(0, startPosition + distance * ease);

                if (timeElapsed < duration) {
                    requestAnimationFrame(animation);
                }
            }

            requestAnimationFrame(animation);
        }
    }

    // ================================
    // УПРАВЛЕНИЕ СОСТОЯНИЕМ
    // ================================
    // Простой паттерн Store для централизованного управления состоянием

    /**
     * Класс Store для управления состоянием приложения
     * Реализует паттерн Observer для подписки на изменения состояния
     * 
     * @example
     * const store = new Utils.Store({ theme: 'dark', activeApp: null });
     * store.subscribe((state) => console.log('State changed:', state));
     * store.setState({ theme: 'light' });
     */
    class Store {
        /**
         * Создает новый экземпляр Store
         * 
         * @param {Object} initialState - Начальное состояние
         */
        constructor(initialState = {}) {
            this.state = { ...initialState };
            this.listeners = [];
        }

        /**
         * Получить текущее состояние (копию)
         * 
         * @returns {Object} - Копия текущего состояния
         */
        getState() {
            return { ...this.state };
        }

        /**
         * Установить новое состояние (слияние с текущим)
         * 
         * @param {Object} newState - Новое состояние для установки
         */
        setState(newState) {
            const prevState = { ...this.state };
            this.state = { ...this.state, ...newState };
            this.notify(prevState, this.state);
        }

        /**
         * Подписаться на изменения состояния
         * 
         * @param {Function} listener - Функция-слушатель (nextState, prevState) => void
         * @returns {Function} - Функция для отписки
         */
        subscribe(listener) {
            this.listeners.push(listener);
            return () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            };
        }

        /**
         * Уведомить всех слушателей об изменении состояния
         * 
         * @param {Object} prevState - Предыдущее состояние
         * @param {Object} nextState - Новое состояние
         * @private
         */
        notify(prevState, nextState) {
            this.listeners.forEach(listener => {
                try {
                    listener(nextState, prevState);
                } catch (error) {
                    console.error('Store listener error:', error);
                }
            });
        }
    }

    // ================================
    // ОПТИМИЗАЦИЯ ПРОИЗВОДИТЕЛЬНОСТИ
    // ================================
    // Утилиты для оптимизации частых операций

    /**
     * Debounce функция - откладывает выполнение функции до окончания паузы
     * Полезно для обработки событий ввода, изменения размера окна и т.д.
     * 
     * @param {Function} func - Функция для debounce
     * @param {number} wait - Время ожидания в мс (по умолчанию: 300)
     * @returns {Function} - Debounced функция
     * 
     * @example
     * const handleResize = Utils.debounce(() => {
     *     console.log('Window resized');
     * }, 300);
     * window.addEventListener('resize', handleResize);
     */
    function debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle функция - ограничивает частоту выполнения функции
     * Полезно для обработки событий скролла, движения мыши и т.д.
     * 
     * @param {Function} func - Функция для throttle
     * @param {number} limit - Лимит времени в мс (по умолчанию: 300)
     * @returns {Function} - Throttled функция
     * 
     * @example
     * const handleScroll = Utils.throttle(() => {
     *     console.log('Scrolling');
     * }, 100);
     * window.addEventListener('scroll', handleScroll);
     */
    function throttle(func, limit = 300) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Обертка для requestAnimationFrame
     * 
     * @param {Function} callback - Функция обратного вызова
     * @returns {number} - ID анимации для отмены через cancelAnimationFrame
     * 
     * @example
     * const animationId = Utils.raf(() => {
     *     // Анимация
     * });
     */
    function raf(callback) {
        return requestAnimationFrame(callback);
    }

    // ================================
    // ДОСТУПНОСТЬ (ACCESSIBILITY)
    // ================================
    // Утилиты для улучшения доступности интерфейса

    /**
     * Установить ARIA атрибуты для элемента
     * Автоматически добавляет префикс 'aria-' если он отсутствует
     * 
     * @param {HTMLElement} element - Элемент для установки атрибутов
     * @param {Object} attributes - Объект с ARIA атрибутами
     * 
     * @example
     * Utils.setAriaAttributes(button, {
     *     'role': 'button',
     *     'aria-label': 'Закрыть',
     *     'aria-expanded': 'false'
     * });
     */
    function setAriaAttributes(element, attributes) {
        if (!element) return;
        
        Object.entries(attributes).forEach(([key, value]) => {
            const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
            if (value === null || value === false) {
                element.removeAttribute(ariaKey);
            } else {
                element.setAttribute(ariaKey, value);
            }
        });
    }

    /**
     * Управление фокусом для модальных окон (focus trap)
     * Захватывает фокус внутри контейнера и предотвращает выход за его пределы
     * 
     * @param {HTMLElement} container - Контейнер модального окна
     * @param {boolean} trap - Захватывать ли фокус (по умолчанию: true)
     * 
     * @example
     * Utils.manageFocus(modalContainer, true);
     */
    function manageFocus(container, trap = true) {
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'a[href], button:not([disabled]), textarea:not([disabled]), ' +
            'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (trap) {
            container.addEventListener('keydown', function trapFocus(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey) {
                        // Shift + Tab - переход назад
                        if (document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        }
                    } else {
                        // Tab - переход вперед
                        if (document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                }
            });
        }

        // Устанавливаем фокус на первый элемент
        firstElement.focus();
    }

    // ================================
    // ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ВИДИМОСТИ
    // ================================

    window.Utils = {
        // Анимации
        fadeIn,
        fadeOut,
        slideIn,
        scaleIn,
        stagger,
        
        // Работа с DOM
        $,
        $$,
        isVisible,
        scrollTo,
        
        // Управление состоянием
        Store,
        
        // Оптимизация производительности
        debounce,
        throttle,
        raf,
        
        // Доступность
        setAriaAttributes,
        manageFocus
    };

})();
