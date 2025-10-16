// ================================
// Portfolio Site - Main Script
// ================================

(function() {
    'use strict';

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
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Animate app cards
    document.querySelectorAll('.app-card').forEach(card => {
        card.setAttribute('data-animate', '');
        observer.observe(card);
    });
    
    // Animate feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.setAttribute('data-animate', '');
        observer.observe(card);
    });
    
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
    
    const appCards = document.querySelectorAll('.app-card');
    
    appCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.setProperty('--hover-scale', '1.02');
        });
        
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // ================================
    // Scroll Progress Indicator
    // ================================
    
    function updateScrollProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        
        // You can add a progress bar element if needed
        // progressBar.style.width = scrolled + '%';
    }
    
    window.addEventListener('scroll', updateScrollProgress);
    
    // ================================
    // Active Navigation Link Highlighting
    // ================================
    
    const sections = document.querySelectorAll('section[id]');
    
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
    // Page Load Animation
    // ================================
    
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        
        // Trigger initial animations
        highlightNavigation();
        updateScrollProgress();
    });
    
    // ================================
    // Console Easter Egg
    // ================================
    
    console.log('%c👋 Привет, любопытный разработчик!', 'font-size: 20px; font-weight: bold; color: #007AFF;');
    console.log('%cЕсли ты ищешь талантливого iOS разработчика, напиши мне!', 'font-size: 14px; color: #98989D;');
    console.log('%c📧 support@vsapps.ru', 'font-size: 14px; color: #5856D6;');
    
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

