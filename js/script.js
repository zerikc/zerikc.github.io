/**
 * ================================
 * Portfolio Site - Main Script
 * ================================
 * 
 * Основной скрипт для портфолио iOS разработчика.
 * Управляет всеми интерактивными элементами сайта: карточками приложений,
 * навигацией, темами, PWA функциональностью и анимациями.
 * 
 * @version 1.0.0
 * @author Zerikc Apps
 */

(function() {
    'use strict';

    // ================================
    // СИСТЕМА ДЕТАЛЕЙ ПРИЛОЖЕНИЙ
    // ================================
    // Управление отображением детальной информации о приложениях
    // ВАЖНО: Должна быть объявлена первой для глобальной доступности

    /** Текущее активное приложение */
    let currentActiveApp = null;
    
    /**
     * Показать детальную информацию о приложении
     * 
     * @param {string} appId - ID приложения (weather, homie, floralia и т.д.)
     * 
     * @example
     * showAppDetail('floralia');
     */
    window.showAppDetail = function(appId) {
        const detailSection = document.querySelector('.app-detail-section');
        const Utils = window.Utils || {};
        
        // Получаем все карточки для управления состоянием
        const allMiniCards = document.querySelectorAll('.app-mini-card');
        const allDetailCards = document.querySelectorAll('.app-detail-card');
        
        // Анимация закрытия текущей активной карточки
        if (currentActiveApp) {
            const currentDetailCard = document.getElementById(`detail-${currentActiveApp}`);
            const currentMiniCard = document.querySelector(`[data-app="${currentActiveApp}"]`);
            
            // Плавное исчезновение детальной карточки
            if (currentDetailCard && Utils.fadeOut) {
                Utils.fadeOut(currentDetailCard, { duration: 200 }).then(() => {
                    currentDetailCard.classList.remove('active');
                });
            } else {
                currentDetailCard?.classList.remove('active');
            }
            
            // Деактивация мини-карточки
            currentMiniCard?.classList.remove('active');
        }
        
        // Если кликнули на ту же карточку - закрываем детали
        if (currentActiveApp === appId) {
            currentActiveApp = null;
            if (detailSection) {
                detailSection.classList.add('hidden');
            }
            return;
        }
        
        // Получаем элементы новой активной карточки
        const miniCard = document.querySelector(`[data-app="${appId}"]`);
        const detailCard = document.getElementById(`detail-${appId}`);
        
        if (miniCard && detailCard) {
            // Показываем секцию деталей с анимацией
            if (detailSection) {
                detailSection.classList.remove('hidden');
                // Принудительный reflow для запуска CSS анимации
                detailSection.offsetHeight;
            }
            
            // Активируем мини-карточку с визуальной анимацией
            miniCard.classList.add('active');
            
            // Небольшая задержка для более плавного перехода между карточками
            setTimeout(() => {
                // Активируем детальную карточку с плавной анимацией появления
                detailCard.classList.add('active');
                currentActiveApp = appId;
            }, 50);
            
            // Плавная прокрутка к детальной секции
            if (detailSection && Utils.scrollTo) {
                setTimeout(() => {
                    Utils.scrollTo(detailSection, {
                        offset: -80, // Учитываем высоту навигации
                        behavior: 'smooth'
                    });
                }, 100);
            } else {
                // Fallback для старых браузеров
                setTimeout(() => {
                    const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
                    const targetPosition = detailSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
            
            // Улучшенная доступность: обновление ARIA атрибутов
            if (Utils.setAriaAttributes) {
                Utils.setAriaAttributes(detailCard, {
                    'expanded': 'true',
                    'hidden': 'false'
                });
                Utils.setAriaAttributes(miniCard, {
                    'expanded': 'true',
                    'selected': 'true'
                });
            }
        }
    };
    
    /**
     * Инициализация системы деталей приложений
     * Настраивает обработчики событий для всех карточек приложений
     */
    function initAppDetailSystem() {
        const miniCards = document.querySelectorAll('.app-mini-card');
        const detailSection = document.querySelector('.app-detail-section');
        
        // Скрываем секцию деталей по умолчанию, если нет активного приложения
        if (detailSection && currentActiveApp === null) {
            detailSection.classList.add('hidden');
        }
        
        // Если карточек нет, выходим
        if (miniCards.length === 0) {
            return;
        }
        
        // Настройка обработчиков для каждой мини-карточки
        miniCards.forEach((card) => {
            const appId = card.getAttribute('data-app');
            
            // Улучшенная доступность: установка ARIA атрибутов
            if (window.Utils && window.Utils.setAriaAttributes) {
                window.Utils.setAriaAttributes(card, {
                    'role': 'button',
                    'tabindex': '0',
                    'aria-expanded': 'false',
                    'aria-label': `Показать детали приложения ${appId}`
                });
            }
            
            // Обработчик клика по карточке
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (appId) {
                    showAppDetail(appId);
                }
            });
            
            // Навигация с клавиатуры (Enter или Space)
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (appId) {
                        showAppDetail(appId);
                    }
                }
            });
        });
        
        // Обработчики для стрелок раскрытия
        const expandArrows = document.querySelectorAll('.expand-arrow');
        
        expandArrows.forEach((arrow) => {
            arrow.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const miniCard = arrow.closest('.app-mini-card');
                if (miniCard) {
                    const appId = miniCard.getAttribute('data-app');
                    if (appId) {
                        showAppDetail(appId);
                    }
                }
            });
        });
    }

    // ================================
    // PWA - SERVICE WORKER И УСТАНОВКА
    // ================================
    // Функциональность Progressive Web App

    /** Сохраненное событие установки PWA */
    let deferredPrompt;
    const installButton = document.getElementById('installButton');
    
    /**
     * Логгер для безопасного логирования
     * Использует window.logger если доступен, иначе создает fallback
     */
    const logger = window.logger || {
        log: () => {},
        error: (...args) => console.error(...args),
        warn: () => {}
    };
    
    /**
     * Регистрация Service Worker для офлайн функциональности
     */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    logger.log('✅ Service Worker registered:', registration.scope);
                    
                    // Проверка обновлений каждые 60 секунд
                    setInterval(() => {
                        registration.update();
                    }, 60000);
                    
                    // Обработка обнаружения новых версий Service Worker
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Показываем уведомление о доступном обновлении
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch((error) => {
                    logger.error('❌ Service Worker registration failed:', error);
                });
        });
    }
    
    /**
     * Обработка события установки PWA
     * Перехватываем стандартный промпт и показываем свою кнопку
     */
    window.addEventListener('beforeinstallprompt', (e) => {
        logger.log('💾 Install prompt fired');
        // Предотвращаем автоматический показ промпта
        e.preventDefault();
        // Сохраняем событие для использования позже
        deferredPrompt = e;
        // Показываем кнопку установки
        if (installButton) {
            installButton.style.display = 'inline-flex';
        }
    });
    
    /**
     * Обработка клика по кнопке установки PWA
     */
    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) {
                logger.log('❌ No install prompt available');
                return;
            }
            
            // Показываем нативный промпт установки
            deferredPrompt.prompt();
            
            // Ждем выбора пользователя
            const { outcome } = await deferredPrompt.userChoice;
            logger.log(`👤 User choice: ${outcome}`);
            
            if (outcome === 'accepted') {
                logger.log('✅ User accepted the install prompt');
                // Скрываем кнопку после установки
                installButton.style.display = 'none';
            } else {
                logger.log('❌ User dismissed the install prompt');
            }
            
            // Очищаем сохраненное событие
            deferredPrompt = null;
        });
    }
    
    /**
     * Отслеживание успешной установки PWA
     */
    window.addEventListener('appinstalled', (evt) => {
        logger.log('🎉 App installed successfully');
        
        // Скрываем кнопку установки
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // Показываем уведомление об успешной установке
        showInstallSuccessMessage();
        
        // Отправляем событие в аналитику (если настроена)
        if (window.gtag) {
            gtag('event', 'pwa_installed', {
                event_category: 'PWA',
                event_label: 'App Installed'
            });
        }
    });
    
    /**
     * Показать уведомление о доступном обновлении
     */
    function showUpdateNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #007AFF, #5856D6);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4);
                display: flex;
                align-items: center;
                gap: 12px;
                animation: slideUp 0.3s ease;
            ">
                <span>Доступно обновление!</span>
                <button onclick="window.location.reload()" style="
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    Обновить
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Автоматически убираем уведомление через 10 секунд
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
    
    /**
     * Показать сообщение об успешной установке PWA
     */
    function showInstallSuccessMessage() {
        const message = document.createElement('div');
        message.textContent = '🎉 Приложение успешно установлено!';
        message.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #34C759, #30D158);
            color: white;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 8px 24px rgba(52, 199, 89, 0.4);
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            message.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    /**
     * Проверка, установлено ли приложение
     * Скрываем кнопку установки, если приложение уже установлено
     */
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        logger.log('✅ Running in standalone mode');
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    // ================================
    // УПРАВЛЕНИЕ ТЕМОЙ
    // ================================
    // Переключение между светлой и темной темой

    /**
     * Инициализация темы при загрузке страницы
     * Проверяет сохраненную тему или предпочтения системы
     */
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            // Используем сохраненную тему
            setTheme(savedTheme, false);
        } else if (!systemPrefersDark) {
            // Используем светлую тему по умолчанию
            setTheme('light', false);
        } else {
            // Используем темную тему по умолчанию
            setTheme('dark', false);
        }
    }
    
    /**
     * Установить тему
     * 
     * @param {string} theme - Название темы ('light' или 'dark')
     * @param {boolean} save - Сохранять ли тему в localStorage (по умолчанию: true)
     */
    function setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem('theme', theme);
        }
    }
    
    /**
     * Переключить тему (светлая ↔ темная)
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }
    
    /**
     * Слушатель изменений системной темы
     * Обновляет тему, если пользователь не выбрал тему вручную
     */
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light', false);
        }
    });
    
    // Инициализация темы сразу при загрузке
    initTheme();
    
    // Обработчик кнопки переключения темы
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // ================================
    // МОБИЛЬНАЯ НАВИГАЦИЯ
    // ================================
    // Управление мобильным меню

    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navToggle && navMenu) {
        // Переключение мобильного меню
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Блокируем прокрутку страницы, когда меню открыто
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Закрытие меню при клике на ссылку
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню при клике вне его области
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // ================================
    // ЭФФЕКТ НАВИГАЦИИ ПРИ ПРОКРУТКЕ
    // ================================
    // Изменение стиля навигации при прокрутке страницы

    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Добавляем класс 'scrolled' при прокрутке более 50px
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ================================
    // ПЛАВНАЯ ПРОКРУТКА ДЛЯ НАВИГАЦИИ
    // ================================
    // Плавная прокрутка к секциям при клике на ссылки

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Пропускаем пустые ссылки
            if (href === '#' || !href) return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
                // Учитываем высоту навигации при прокрутке
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ================================
    // АНИМАЦИИ ПРИ ПОЯВЛЕНИИ В VIEWPORT
    // ================================
    // Использование Intersection Observer для анимации элементов при скролле

    const observerOptions = {
        threshold: 0.1, // Элемент считается видимым при 10% видимости
        rootMargin: '0px 0px -80px 0px' // Запуск анимации за 80px до появления
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Прекращаем наблюдение после анимации
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Анимация карточек приложений с эффектом stagger
    document.querySelectorAll('.app-card').forEach((card, index) => {
        card.setAttribute('data-animate', '');
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Анимация карточек контактов
    document.querySelectorAll('.contact-card').forEach((card, index) => {
        card.setAttribute('data-animate', '');
        card.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(card);
    });
    
    // Анимация заголовков секций
    document.querySelectorAll('.section-header').forEach(header => {
        header.setAttribute('data-animate', '');
        observer.observe(header);
    });
    
    // Анимация элементов hero секции
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        const heroElements = heroContent.querySelectorAll('.hero-title, .hero-description, .hero-buttons');
        heroElements.forEach((element, index) => {
            element.setAttribute('data-animate', '');
            element.style.transitionDelay = `${index * 0.2}s`;
            observer.observe(element);
        });
    }
    
    // ================================
    // ОБРАБОТКА ФОРМЫ КОНТАКТОВ
    // ================================
    // Отправка формы контактов (если используется)

    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            
            // Блокируем кнопку отправки
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';
            
            try {
                // Отправка формы (например, через Formspree)
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    showFormMessage('success', 'Спасибо! Ваше сообщение успешно отправлено. Я свяжусь с вами в ближайшее время.');
                    contactForm.reset();
                } else {
                    throw new Error('Network response was not ok');
                }
            } catch (error) {
                showFormMessage('error', 'Упс! Что-то пошло не так. Пожалуйста, попробуйте отправить письмо напрямую на email.');
                logger.error('Form submission error:', error);
            } finally {
                // Разблокируем кнопку отправки
                submitButton.disabled = false;
                submitButton.textContent = 'Отправить сообщение';
            }
        });
    }
    
    /**
     * Показать сообщение формы
     * 
     * @param {string} type - Тип сообщения ('success' или 'error')
     * @param {string} message - Текст сообщения
     */
    function showFormMessage(type, message) {
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = 'form-message ' + type;
            
            // Автоматически скрываем сообщение через 5 секунд
            setTimeout(() => {
                formMessage.className = 'form-message';
            }, 5000);
        }
    }
    
    // ================================
    // ИНДИКАТОР ПРОГРЕССА ПРОКРУТКИ
    // ================================
    // Визуальная полоса прогресса прокрутки страницы

    const scrollProgress = document.getElementById('scrollProgress');
    
    /**
     * Обновление индикатора прогресса прокрутки
     */
    function updateScrollProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height);
        
        if (scrollProgress) {
            scrollProgress.style.transform = `scaleX(${scrolled})`;
        }
    }
    
    // ================================
    // НАВИГАЦИЯ ПО СЕКЦИЯМ
    // ================================
    // Управление активными точками навигации

    const sections = document.querySelectorAll('section[id]');
    const dots = document.querySelectorAll('.dot');
    
    // ================================
    // ПАРАЛЛАКС ЭФФЕКТ ДЛЯ ГРАДИЕНТНЫХ ОРБОВ
    // ================================
    // Интерактивное движение градиентных орбов при движении мыши

    const gradientOrbs = document.querySelectorAll('.gradient-orb');
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
        // Движение орбов при движении мыши
        heroSection.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            // Вычисляем относительную позицию мыши
            const xPos = (clientX / innerWidth) - 0.5;
            const yPos = (clientY / innerHeight) - 0.5;
            
            // Применяем движение к каждому орбу с разной скоростью
            gradientOrbs.forEach((orb, index) => {
                const speed = (index + 1) * 20;
                const x = xPos * speed;
                const y = yPos * speed;
                
                orb.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
        
        // Возврат орбов в исходное положение при уходе мыши
        heroSection.addEventListener('mouseleave', () => {
            gradientOrbs.forEach(orb => {
                orb.style.transform = 'translate(0, 0)';
            });
        });
    }
    
    // ================================
    // ПОДСВЕТКА АКТИВНОЙ НАВИГАЦИИ
    // ================================
    // Изменение стиля активной ссылки навигации при прокрутке

    /**
     * Подсветка активной ссылки навигации в зависимости от текущей секции
     */
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (navLink) {
                // Подсвечиваем ссылку, если секция в viewport
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.style.color = 'var(--text-primary)';
                } else {
                    navLink.style.color = 'var(--text-secondary)';
                }
            }
        });
    }
    
    // ================================
    // НАВИГАЦИЯ С КЛАВИАТУРЫ
    // ================================
    // Закрытие мобильного меню по клавише Escape

    document.addEventListener('keydown', (e) => {
        // Закрытие мобильного меню по клавише Escape
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // ================================
    // ЛЕНИВАЯ ЗАГРУЗКА ИЗОБРАЖЕНИЙ
    // ================================
    // Загрузка изображений только при появлении в viewport

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    // Загружаем изображение из data-src
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        // Прекращаем наблюдение после загрузки
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        // Наблюдаем за всеми изображениями с атрибутом data-src
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ================================
    // ОПТИМИЗИРОВАННЫЙ ОБРАБОТЧИК ПРОКРУТКИ
    // ================================
    // Объединение всех обработчиков прокрутки для производительности
    // Использование RequestAnimationFrame и throttle для плавности

    const Utils = window.Utils || {};
    
    /**
     * Fallback для throttle, если Utils не загружен
     */
    const throttleScroll = Utils.throttle || ((fn, delay) => {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                fn.apply(this, args);
            }
        };
    });
    
    let scrollTicking = false;
    
    /**
     * Основной обработчик прокрутки
     * Объединяет все операции, связанные с прокруткой
     */
    function handleScroll() {
        if (!scrollTicking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
                
                // Обновление индикатора прогресса прокрутки
                updateScrollProgress();
                
                // Обновление подсветки активной навигации
                highlightNavigation();
                
                // Обновление активных точек навигации
                updateActiveDot();
                
                // Затемнение фона hero секции при прокрутке
                const heroOverlay = document.getElementById('heroBackgroundOverlay');
                if (heroOverlay) {
                    const heroSection = document.querySelector('.hero');
                    if (heroSection) {
                        const heroHeight = heroSection.offsetHeight;
                        const scrollProgress = Math.min(scrolled / heroHeight, 1);
                        
                        // Затемнение от 0 до 60%
                        const darkOpacity = scrollProgress * 0.6;
                        
                        // Выбор цвета overlay в зависимости от темы
                        if (document.documentElement.getAttribute('data-theme') === 'light' || 
                            (!document.documentElement.getAttribute('data-theme') && 
                             window.matchMedia('(prefers-color-scheme: light)').matches)) {
                            // Белый overlay для светлой темы
                            heroOverlay.style.background = `rgba(255, 255, 255, ${darkOpacity})`;
                        } else {
                            // Черный overlay для темной темы
                            heroOverlay.style.background = `rgba(0, 0, 0, ${darkOpacity})`;
                        }
                    }
                }
                
                scrollTicking = false;
            });
            scrollTicking = true;
        }
    }
    
    // Применяем throttle для дополнительной оптимизации (~60fps)
    const optimizedHandleScroll = throttleScroll(handleScroll, 16);
    window.addEventListener('scroll', optimizedHandleScroll, { passive: true });
    
    // ================================
    // СТРЕЛКА ПРОКРУТКИ ВНИЗ
    // ================================
    // Интерактивная стрелка для прокрутки к секции приложений

    const scrollChevron = document.querySelector('.scroll-chevron');
    
    if (scrollChevron) {
        // Скрытие стрелки при прокрутке (оптимизировано через RAF)
        let chevronTicking = false;
        window.addEventListener('scroll', () => {
            if (!chevronTicking) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.pageYOffset || window.scrollY || document.documentElement.scrollTop;
                    // Скрываем стрелку после прокрутки более 300px
                    if (scrolled > 300) {
                        scrollChevron.classList.add('hidden');
                    } else {
                        scrollChevron.classList.remove('hidden');
                    }
                    chevronTicking = false;
                });
                chevronTicking = true;
            }
        }, { passive: true });
        
        // Прокрутка к секции приложений при клике на стрелку
        scrollChevron.addEventListener('click', () => {
            const appsSection = document.getElementById('apps');
            if (appsSection) {
                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = appsSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    // ================================
    // НАВИГАЦИЯ ТОЧКАМИ ПО СЕКЦИЯМ
    // ================================
    // Управление активными точками боковой навигации

    /**
     * Обновление активной точки навигации при прокрутке
     */
    function updateActiveDot() {
        const scrollY = window.pageYOffset + 200; // Смещение для раннего переключения
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            // Активируем точку, если секция в viewport
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                dots.forEach(dot => {
                    dot.classList.remove('active');
                    if (dot.getAttribute('data-section') === sectionId) {
                        dot.classList.add('active');
                    }
                });
            }
        });
    }
    
    // Плавная прокрутка при клике на точку навигации
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = dot.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            if (section) {
                const navbarHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ================================
    // АНИМАЦИЯ ЗАГРУЗКИ СТРАНИЦЫ
    // ================================
    // Плавное появление контента при загрузке

    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Плавное появление body
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
        
        // Инициализация системы деталей приложений
        setTimeout(() => {
            initAppDetailSystem();
        }, 500);
        
        // Запуск начальных анимаций
        highlightNavigation();
        updateScrollProgress();
    });
    
    // ================================
    // ПАСХАЛКА В КОНСОЛИ
    // ================================
    // Приветственное сообщение для разработчиков

    // Показываем пасхалку только в режиме разработки
    if (window.logger && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('debug=true'))) {
        window.logger.log('%c👋 Привет, любопытный разработчик!', 'font-size: 20px; font-weight: bold; color: #007AFF;');
        window.logger.log('%cЕсли ты ищешь талантливого iOS разработчика, напиши мне!', 'font-size: 14px; color: #98989D;');
        window.logger.log('%c📧 zerikc@icloud.com', 'font-size: 14px; color: #5856D6;');
    }
    
    // ================================
    // УТИЛИТА: КОПИРОВАНИЕ EMAIL
    // ================================
    // Копирование email в буфер обмена при клике

    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const email = link.textContent;
            
            // Попытка скопировать email в буфер обмена
            if (navigator.clipboard) {
                navigator.clipboard.writeText(email).then(() => {
                    // Показываем временное уведомление
                    const tooltip = document.createElement('span');
                    tooltip.textContent = 'Email скопирован!';
                    tooltip.style.cssText = `
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: rgba(0, 122, 255, 0.9);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        z-index: 10000;
                        animation: slideUp 0.3s ease;
                    `;
                    
                    document.body.appendChild(tooltip);
                    
                    // Удаляем уведомление через 2 секунды
                    setTimeout(() => {
                        tooltip.remove();
                    }, 2000);
                }).catch(err => {
                    logger.error('Failed to copy email:', err);
                });
            }
        });
    });
    
    // ================================
    // ДОБАВЛЕНИЕ CSS АНИМАЦИЙ
    // ================================
    // Динамическое добавление keyframes для анимаций

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translate(-50%, 20px);
            }
            to {
                opacity: 1;
                transform: translate(-50%, 0);
            }
        }
    `;
    document.head.appendChild(style);
    
})();
