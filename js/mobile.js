// ====================================
// Mobile functionality for Admin Panel
// ====================================

// ====================================
// Mobile Menu Toggle
// ====================================

function initMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.getElementById('mobileOverlay');
    
    if (!menuToggle || !sidebar || !overlay) return;
    
    // Toggle menu
    menuToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    // Close on overlay click
    overlay.addEventListener('click', closeMenu);
    
    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMenu();
        }
    });
    
    // Close menu when clicking on sidebar item
    const sidebarItems = sidebar.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(closeMenu, 150); // Delay for visual feedback
        });
    });
    
    function openMenu() {
        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        menuToggle.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }
    
    function closeMenu() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        menuToggle.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }
}

// ====================================
// Touch Optimizations
// ====================================

function initTouchOptimizations() {
    // Add touch feedback to interactive elements
    const interactiveElements = document.querySelectorAll('button, .btn, .collection-list-item, .sidebar-item');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.opacity = '0.8';
        }, { passive: true });
        
        element.addEventListener('touchend', function() {
            this.style.opacity = '';
        }, { passive: true });
        
        element.addEventListener('touchcancel', function() {
            this.style.opacity = '';
        }, { passive: true });
    });
}

// ====================================
// Pull to Refresh (optional)
// ====================================

function initPullToRefresh() {
    if (window.innerWidth > 768) return; // Only on mobile
    
    const content = document.querySelector('.admin-content');
    if (!content) return;
    
    let startY = 0;
    let currentY = 0;
    let pulling = false;
    
    // Create refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.className = 'pull-to-refresh';
    refreshIndicator.innerHTML = '<div class="spinner"></div><span>Обновить</span>';
    document.body.appendChild(refreshIndicator);
    
    content.addEventListener('touchstart', (e) => {
        if (content.scrollTop === 0) {
            startY = e.touches[0].clientY;
            pulling = true;
        }
    }, { passive: true });
    
    content.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        if (diff > 0 && diff < 100) {
            refreshIndicator.classList.add('active');
        } else if (diff >= 100) {
            refreshIndicator.innerHTML = '<div class="spinner"></div><span>Отпустите для обновления</span>';
        }
    }, { passive: true });
    
    content.addEventListener('touchend', () => {
        if (!pulling) return;
        
        const diff = currentY - startY;
        
        if (diff >= 100) {
            // Trigger refresh
            refreshIndicator.innerHTML = '<div class="spinner"></div><span>Обновление...</span>';
            setTimeout(() => {
                location.reload();
            }, 500);
        }
        
        pulling = false;
        refreshIndicator.classList.remove('active');
    }, { passive: true });
}

// ====================================
// Responsive Tables
// ====================================

function makeTablesResponsive() {
    if (window.innerWidth > 768) return;
    
    const tables = document.querySelectorAll('.documents-table');
    
    tables.forEach(table => {
        const headers = [];
        const headerCells = table.querySelectorAll('thead th');
        
        headerCells.forEach(header => {
            headers.push(header.textContent);
        });
        
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                cell.setAttribute('data-label', headers[index]);
            });
        });
    });
}

// ====================================
// Orientation Change Handler
// ====================================

function handleOrientationChange() {
    // Reload tables on orientation change
    makeTablesResponsive();
    
    // Close mobile menu on orientation change
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        document.querySelector('.mobile-overlay')?.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ====================================
// Prevent iOS Zoom on Input Focus
// ====================================

function preventIOSZoom() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        const originalFontSize = window.getComputedStyle(input).fontSize;
        
        input.addEventListener('focus', function() {
            // iOS Safari zooms in if font-size < 16px
            if (parseInt(originalFontSize) < 16) {
                this.style.fontSize = '16px';
            }
        });
        
        input.addEventListener('blur', function() {
            this.style.fontSize = originalFontSize;
        });
    });
}

// ====================================
// Install PWA Prompt
// ====================================

let deferredPrompt;

function initPWAPrompt() {
    const isDevelopment = () => {
        return window.location?.hostname === 'localhost' || 
               window.location?.hostname === '127.0.0.1' ||
               window.location?.search?.includes('debug=true');
    };
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent default Chrome install prompt
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install button (if you want)
        showInstallPromotion();
    });
    
    // Handle successful installation
    window.addEventListener('appinstalled', () => {
        if (window.logger) {
            window.logger.log('PWA установлено успешно!');
        }
        deferredPrompt = null;
    });
}

function showInstallPromotion() {
    // Create install banner (optional)
    const installBanner = document.createElement('div');
    installBanner.className = 'pwa-install-banner';
    installBanner.innerHTML = `
        <div style="padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 12px; margin: 16px;">
            <span style="flex: 1; font-size: 14px;">Установите приложение для быстрого доступа</span>
            <button id="installPWA" class="btn btn-primary btn-small">Установить</button>
            <button id="dismissInstall" class="btn btn-secondary btn-small">×</button>
        </div>
    `;
    
    document.body.insertBefore(installBanner, document.body.firstChild);
    
    // Install button click
    document.getElementById('installPWA')?.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (window.logger) {
            window.logger.log(`User choice: ${outcome}`);
        }
        deferredPrompt = null;
        installBanner.remove();
    });
    
    // Dismiss button click
    document.getElementById('dismissInstall')?.addEventListener('click', () => {
        installBanner.remove();
    });
}

// ====================================
// Safe Area Insets (iPhone notch)
// ====================================

function applySafeAreaInsets() {
    // This is handled in CSS with env(safe-area-inset-*)
    // But we can add JS fallback if needed
    
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
        document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        document.documentElement.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
        document.documentElement.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    }
}

// ====================================
// Viewport Height Fix (mobile browsers)
// ====================================

function fixMobileVH() {
    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
    let vh = window.innerHeight * 0.01;
    // Then we set the value in the --vh custom property to the root of the document
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Update on resize
window.addEventListener('resize', fixMobileVH);
window.addEventListener('orientationchange', fixMobileVH);

// ====================================
// Performance: Reduce Motion
// ====================================

function checkReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
        document.documentElement.classList.add('reduce-motion');
    }
    
    // Listen for changes
    prefersReducedMotion.addEventListener('change', (e) => {
        if (e.matches) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    });
}

// ====================================
// Network Status
// ====================================

function monitorNetworkStatus() {
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        const statusBanner = document.getElementById('networkStatus');
        
        if (!isOnline) {
            showNetworkStatus('Нет подключения к интернету', 'offline');
        } else if (statusBanner) {
            statusBanner.remove();
        }
    }
    
    function showNetworkStatus(message, type) {
        let banner = document.getElementById('networkStatus');
        
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'networkStatus';
            banner.style.cssText = `
                position: fixed;
                top: 56px;
                left: 0;
                right: 0;
                padding: 12px;
                text-align: center;
                font-size: 14px;
                z-index: 1003;
                animation: slideDown 0.3s ease;
            `;
            document.body.appendChild(banner);
        }
        
        banner.textContent = message;
        banner.style.background = type === 'offline' ? '#FF3B30' : '#34C759';
        banner.style.color = 'white';
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial check
    updateOnlineStatus();
}

// ====================================
// Initialize All Mobile Features
// ====================================

function initMobileFeatures() {
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const isDev = window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1';
    
    if (isMobile) {
        if (window.logger) {
            window.logger.log('Mobile features initialized');
        }
        
        initMobileMenu();
        initTouchOptimizations();
        makeTablesResponsive();
        preventIOSZoom();
        fixMobileVH();
    }
    
    // Always init these
    initPWAPrompt();
    applySafeAreaInsets();
    checkReducedMotion();
    monitorNetworkStatus();
    
    // Orientation change
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Responsive table update on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            makeTablesResponsive();
        }
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileFeatures);
} else {
    initMobileFeatures();
}

// Export for manual initialization if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMobileFeatures,
        initMobileMenu,
        makeTablesResponsive
    };
}

