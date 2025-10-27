// ================================
// Portfolio Site - Main Script
// ================================

(function() {
    'use strict';

    // ================================
    // App Detail Toggle System - MUST be declared first
    // ================================
    
    let currentActiveApp = null;
    
    // Global function for showing app details
    window.showAppDetail = function(appId) {
        const detailSection = document.querySelector('.app-detail-section');
        
        // Remove active class from all mini cards
        document.querySelectorAll('.app-mini-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Hide all detail cards
        document.querySelectorAll('.app-detail-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // If clicking the same app, close it
        if (currentActiveApp === appId) {
            currentActiveApp = null;
            // Hide the detail section if no app is selected
            if (detailSection) {
                detailSection.classList.add('hidden');
            }
            return;
        }
        
        // Show selected app
        const miniCard = document.querySelector(`[data-app="${appId}"]`);
        const detailCard = document.getElementById(`detail-${appId}`);
        
        if (miniCard && detailCard) {
            miniCard.classList.add('active');
            detailCard.classList.add('active');
            currentActiveApp = appId;
            
            // Show the detail section
            if (detailSection) {
                detailSection.classList.remove('hidden');
                
                // Smooth scroll to detail section
                setTimeout(() => {
                    const navbarHeight = document.getElementById('navbar').offsetHeight;
                    const targetPosition = detailSection.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    };
    
    // Initialize app detail system
    function initAppDetailSystem() {
        const miniCards = document.querySelectorAll('.app-mini-card');
        const detailSection = document.querySelector('.app-detail-section');
        
        // Hide detail section by default if no app is selected
        if (detailSection && currentActiveApp === null) {
            detailSection.classList.add('hidden');
        }
        
        if (miniCards.length === 0) {
            return;
        }
        
        // Handle clicks on mini cards
        miniCards.forEach((card) => {
            const appId = card.getAttribute('data-app');
            
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (appId) {
                    showAppDetail(appId);
                }
            });
        });
        
        const expandArrows = document.querySelectorAll('.expand-arrow');
        
        // Handle clicks on expand arrows specifically
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
    // PWA - Service Worker Registration
    // ================================
    
    let deferredPrompt;
    const installButton = document.getElementById('installButton');
    
    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered:', registration.scope);
                    
                    // Проверка обновлений каждые 60 секунд
                    setInterval(() => {
                        registration.update();
                    }, 60000);
                    
                    // Обработка обновлений
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Показать уведомление о доступном обновлении
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });
        });
    }
    
    // Обработка события установки PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('💾 Install prompt fired');
        // Предотвращаем автоматический показ промпта
        e.preventDefault();
        // Сохраняем событие для использования позже
        deferredPrompt = e;
        // Показываем кнопку установки
        if (installButton) {
            installButton.style.display = 'inline-flex';
        }
    });
    
    // Обработка клика по кнопке установки
    if (installButton) {
        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) {
                console.log('❌ No install prompt available');
                return;
            }
            
            // Показываем промпт установки
            deferredPrompt.prompt();
            
            // Ждем выбора пользователя
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`👤 User choice: ${outcome}`);
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                // Скрываем кнопку после установки
                installButton.style.display = 'none';
            } else {
                console.log('❌ User dismissed the install prompt');
            }
            
            // Очищаем сохраненный промпт
            deferredPrompt = null;
        });
    }
    
    // Отслеживание успешной установки
    window.addEventListener('appinstalled', (evt) => {
        console.log('🎉 App installed successfully');
        
        // Скрываем кнопку установки
        if (installButton) {
            installButton.style.display = 'none';
        }
        
        // Показываем уведомление
        showInstallSuccessMessage();
        
        // Отправляем событие в аналитику (если есть)
        if (window.gtag) {
            gtag('event', 'pwa_installed', {
                event_category: 'PWA',
                event_label: 'App Installed'
            });
        }
    });
    
    // Функция для показа уведомления об обновлении
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
        
        // Автоматически убираем через 10 секунд
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
    
    // Функция для показа сообщения об успешной установке
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
        
        setTimeout(() => {
            message.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    // Проверка, установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        console.log('✅ Running in standalone mode');
        // Скрываем кнопку установки, если уже установлено
        if (installButton) {
            installButton.style.display = 'none';
        }
    }

    // ================================
    // Theme Management
    // ================================
    
    // Initialize theme on page load
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            setTheme(savedTheme, false);
        } else if (!systemPrefersDark) {
            setTheme('light', false);
        } else {
            setTheme('dark', false);
        }
    }
    
    // Set theme
    function setTheme(theme, save = true) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            localStorage.setItem('theme', theme);
        }
    }
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light', false);
        }
    });
    
    // Initialize theme immediately
    initTheme();
    
    // Theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // ================================
    // Mobile Navigation Toggle
    // ================================
    
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // ================================
    // Navbar Scroll Effect
    // ================================
    
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // ================================
    // Smooth Scroll for Navigation Links
    // ================================
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Don't prevent default for empty hrefs
            if (href === '#' || !href) return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                
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
    // Intersection Observer for Animations
    // ================================
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Animate app cards with stagger effect
    document.querySelectorAll('.app-card').forEach((card, index) => {
        card.setAttribute('data-animate', '');
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Animate contact cards
    document.querySelectorAll('.contact-card').forEach((card, index) => {
        card.setAttribute('data-animate', '');
        card.style.transitionDelay = `${index * 0.15}s`;
        observer.observe(card);
    });
    
    // Animate section headers
    document.querySelectorAll('.section-header').forEach(header => {
        header.setAttribute('data-animate', '');
        observer.observe(header);
    });
    
    // Animate hero content
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
    // Contact Form Handling
    // ================================
    
    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const submitButton = contactForm.querySelector('button[type="submit"]');
            
            // Disable submit button
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';
            
            try {
                // If using Formspree or similar service
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
                console.error('Form submission error:', error);
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = 'Отправить сообщение';
            }
        });
    }
    
    function showFormMessage(type, message) {
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = 'form-message ' + type;
            
            // Auto-hide message after 5 seconds
            setTimeout(() => {
                formMessage.className = 'form-message';
            }, 5000);
        }
    }
    
    // ================================
    // App Card Hover Effects
    // ================================
    
    // Simple hover effect - handled by CSS
    
    // ================================
    // Scroll Progress Bar
    // ================================
    
    const scrollProgress = document.getElementById('scrollProgress');
    
    function updateScrollProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height);
        
        if (scrollProgress) {
            scrollProgress.style.transform = `scaleX(${scrolled})`;
        }
    }
    
    window.addEventListener('scroll', debounce(updateScrollProgress, 5));
    
    // ================================
    // Section References (shared)
    // ================================
    
    const sections = document.querySelectorAll('section[id]');
    const dots = document.querySelectorAll('.dot');
    
    // ================================
    // Parallax Effect for Gradient Orbs
    // ================================
    
    const gradientOrbs = document.querySelectorAll('.gradient-orb');
    const heroSection = document.querySelector('.hero');
    
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            const xPos = (clientX / innerWidth) - 0.5;
            const yPos = (clientY / innerHeight) - 0.5;
            
            gradientOrbs.forEach((orb, index) => {
                const speed = (index + 1) * 20;
                const x = xPos * speed;
                const y = yPos * speed;
                
                orb.style.transform = `translate(${x}px, ${y}px)`;
            });
        });
        
        heroSection.addEventListener('mouseleave', () => {
            gradientOrbs.forEach(orb => {
                orb.style.transform = 'translate(0, 0)';
            });
        });
    }
    
    // Parallax on scroll with RAF for performance
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                
                gradientOrbs.forEach((orb, index) => {
                    const speed = (index + 1) * 0.15;
                    orb.style.transform = `translateY(${scrolled * speed}px)`;
                });
                
                ticking = false;
            });
            
            ticking = true;
        }
    });
    
    // ================================
    // Active Navigation Link Highlighting
    // ================================
    
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (navLink) {
                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    navLink.style.color = 'var(--text-primary)';
                } else {
                    navLink.style.color = 'var(--text-secondary)';
                }
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    
    // ================================
    // Keyboard Navigation
    // ================================
    
    document.addEventListener('keydown', (e) => {
        // Close mobile menu with Escape key
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // ================================
    // Lazy Loading for Images
    // ================================
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // ================================
    // Performance: Debounce Function
    // ================================
    
    function debounce(func, wait = 10, immediate = true) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }
    
    // Apply debounce to scroll events
    window.addEventListener('scroll', debounce(highlightNavigation));
    window.addEventListener('scroll', debounce(updateScrollProgress));
    
    // ================================
    // Scroll Chevron
    // ================================
    
    const scrollChevron = document.querySelector('.scroll-chevron');
    
    if (scrollChevron) {
        // Hide chevron on scroll
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled > 300) {
                scrollChevron.classList.add('hidden');
            } else {
                scrollChevron.classList.remove('hidden');
            }
        });
        
        // Scroll to apps section on click
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
    // Section Dots Navigation
    // ================================
    
    // Update active dot on scroll
    function updateActiveDot() {
        const scrollY = window.pageYOffset + 200;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
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
    
    // Smooth scroll on dot click
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
    
    window.addEventListener('scroll', debounce(updateActiveDot, 10));
    
    // ================================
    // Page Load Animation
    // ================================
    
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Add fade-in effect to body
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
        
        // Initialize app detail system
        setTimeout(() => {
            initAppDetailSystem();
        }, 500);
        
        // Trigger initial animations
        highlightNavigation();
        updateScrollProgress();
    });
    
    // ================================
    // Console Easter Egg
    // ================================
    
    console.log('%c👋 Привет, любопытный разработчик!', 'font-size: 20px; font-weight: bold; color: #007AFF;');
    console.log('%cЕсли ты ищешь талантливого iOS разработчика, напиши мне!', 'font-size: 14px; color: #98989D;');
    console.log('%c📧 zerikc@icloud.com', 'font-size: 14px; color: #5856D6;');
    
    // ================================
    // Utility: Copy Email on Click
    // ================================
    
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const email = link.textContent;
            
            // Try to copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(email).then(() => {
                    // Show temporary tooltip
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
                    
                    setTimeout(() => {
                        tooltip.remove();
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy email:', err);
                });
            }
        });
    });
    
    // Add slideUp animation
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

