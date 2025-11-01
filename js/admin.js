// ================================
// Firebase Admin Panel - Main Script
// ================================

import { 
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    limit,
    startAfter,
    orderBy,
    where,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { projectManager, ProjectManager } from './project-manager.js';

// ================================
// Global State
// ================================

const state = {
    currentUser: null,
    currentProject: null,
    currentCollection: null,
    documents: [],
    lastVisible: null,
    currentPage: 1,
    pageSize: 20,
    totalPages: 0,
    editingDocId: null,
    collections: [],
    collectionsLoading: false,
    isInitialLoad: true // Флаг первой загрузки - всегда показывать экран входа
};

// Get Firebase instances - with fallback check
let auth = null;
let db = null;

// Check for Firebase initialization
function checkFirebaseInit() {
    if (window.firebaseAuth) {
        auth = window.firebaseAuth;
    } else {
        console.warn('Firebase Auth not yet initialized');
    }
    
    if (window.firebaseDb) {
        db = window.firebaseDb;
    } else {
        console.warn('Firebase Db not yet initialized');
    }
    
    return auth && db;
}

// Initial check
checkFirebaseInit();

// Poll for Firebase initialization (with timeout)
let initCheckCount = 0;
const maxInitChecks = 50; // 5 seconds max wait
const initCheckInterval = setInterval(() => {
    initCheckCount++;
    if (checkFirebaseInit() || initCheckCount >= maxInitChecks) {
        clearInterval(initCheckInterval);
        if (auth && db) {
            console.log('Firebase initialized successfully');
        } else {
            console.error('Firebase initialization timeout');
        }
    }
}, 100);

// ================================
// DOM Elements
// ================================

// Use window.document to avoid conflicts with variable names
const getElement = (id) => window.document.getElementById(id);

const elements = {
    // Login
    loginScreen: getElement('loginScreen'),
    googleSignInBtn: getElement('googleSignInBtn'),
    loginError: getElement('loginError'),
    
    // Project Selection
    projectSelectionScreen: getElement('projectSelectionScreen'),
    projectsList: getElement('projectsList'),
    addProjectForm: getElement('addProjectForm'),
    newProjectId: getElement('newProjectId'),
    newProjectName: getElement('newProjectName'),
    addProjectBtn: getElement('addProjectBtn'),
    projectError: getElement('projectError'),
    
    // Admin Panel
    adminPanel: getElement('adminPanel'),
    userEmail: getElement('userEmail'),
    currentProjectName: getElement('currentProjectName'),
    logoutBtn: getElement('logoutBtn'),
    projectSwitcherBtn: getElement('projectSwitcherBtn'),
    
    // Collections (Apple style)
    collectionsList: getElement('collectionsList'),
    refreshCollectionsBtn: getElement('refreshCollectionsBtn'),
    collectionsSearch: getElement('collectionsSearch'),
    filterButtons: window.document.querySelectorAll('.sidebar-filter'),
    
    // Views
    dashboardView: getElement('dashboardView'),
    collectionsView: getElement('collectionsView'),
    collectionDetailView: getElement('collectionDetailView'),
    backToCollectionsBtn: getElement('backToCollectionsBtn'),
    
    // Sidebar
    sidebarItems: window.document.querySelectorAll('.sidebar-item'),
    // Statistics
    totalCollections: getElement('totalCollections'),
    activeCollections: getElement('activeCollections'),
    totalDocuments: getElement('totalDocuments'),
    restrictedCollections: getElement('restrictedCollections'),
    
    // Collection
    collectionInput: getElement('collectionInput'),
    loadCollectionBtn: getElement('loadCollectionBtn'),
    currentCollectionName: getElement('currentCollectionName'),
    totalDocs: getElement('totalDocs'),
    shownDocs: getElement('shownDocs'),
    documentsTableBody: getElement('documentsTableBody'),
    addDocumentBtn: getElement('addDocumentBtn'),
    
    // Pagination
    pagination: getElement('pagination'),
    prevPageBtn: getElement('prevPageBtn'),
    nextPageBtn: getElement('nextPageBtn'),
    pageInfo: getElement('pageInfo'),
    
    // Modal
    documentModal: getElement('documentModal'),
    modalTitle: getElement('modalTitle'),
    documentIdInput: getElement('documentIdInput'),
    documentDataTextarea: getElement('documentDataTextarea'),
    saveDocumentBtn: getElement('saveDocumentBtn'),
    cancelModalBtn: getElement('cancelModalBtn'),
    closeModalBtn: getElement('closeModalBtn'),
    modalError: getElement('modalError'),
    
    // Delete Modal
    deleteModal: getElement('deleteModal'),
    deleteDocumentId: getElement('deleteDocumentId'),
    confirmDeleteBtn: getElement('confirmDeleteBtn'),
    cancelDeleteBtn: getElement('cancelDeleteBtn'),
    closeDeleteModalBtn: getElement('closeDeleteModalBtn'),
    
    // States
    loadingState: getElement('loadingState'),
    emptyState: getElement('emptyState'),
    toastContainer: getElement('toastContainer'),
    
    // Project Management Modal
    projectManagementModal: getElement('projectManagementModal'),
    projectManagementList: getElement('projectManagementList'),
    closeProjectModalBtn: getElement('closeProjectModalBtn'),
    addNewProjectBtn: getElement('addNewProjectBtn')
};

// ================================
// Authentication
// ================================

// Google Sign-In
async function handleGoogleSignIn() {
    if (!auth) {
        showError(elements.loginError, 'Firebase Auth не инициализирован. Подождите...');
        return;
    }
    
    try {
        elements.googleSignInBtn.disabled = true;
        elements.googleSignInBtn.textContent = 'Вход...';
        elements.loginError.textContent = '';
        
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/cloud-platform');
        provider.setCustomParameters({
            prompt: 'select_account'  // Всегда показывать окно выбора аккаунта
        });
        
        const result = await signInWithPopup(auth, provider);
        state.currentUser = result.user;
        
        showToast('Вход выполнен успешно', 'success');
        
        // Снимаем флаг первой загрузки - пользователь явно вошел
        state.isInitialLoad = false;
        
        // После успешной авторизации проверяем проекты
        checkProjectsAndShowScreen();
        
    } catch (error) {
        console.error('Google Sign-In error:', error);
        showError(elements.loginError, getErrorMessage(error));
        elements.googleSignInBtn.disabled = false;
        elements.googleSignInBtn.textContent = 'Войти через Google';
    }
}

// Проверить проекты и показать нужный экран
function checkProjectsAndShowScreen() {
    if (projectManager.hasProjects()) {
        const currentProject = projectManager.getCurrentProject();
        if (currentProject) {
            // Есть текущий проект - инициализируем Firebase и показываем панель
            initializeFirebaseForProject(currentProject);
        } else {
            // Есть проекты, но не выбран текущий - показываем экран выбора
            showProjectSelectionScreen();
        }
    } else {
        // Нет проектов - показываем экран добавления первого проекта
        showProjectSelectionScreen();
    }
}

// Инициализировать Firebase для проекта
async function initializeFirebaseForProject(project) {
    try {
        showToast('Подключение к проекту...', 'info');
        
        // Отправляем событие для реинициализации Firebase
        window.dispatchEvent(new CustomEvent('reinitializeFirebase', {
            detail: { projectId: project.id }
        }));
        
        state.currentProject = project;
        
        // Ждем инициализации Firebase
        await waitForFirebaseInit();
        
        showAdminPanel();
        
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        showToast('Ошибка подключения к проекту: ' + error.message, 'error');
        showProjectSelectionScreen();
    }
}

// Ожидание инициализации Firebase
function waitForFirebaseInit() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkInterval = setInterval(() => {
            attempts++;
            if (checkFirebaseInit()) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Firebase initialization timeout'));
            }
        }, 100);
    });
}

// Logout
if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener('click', async () => {
        if (!auth) {
            console.error('Auth not initialized');
            return;
        }
        
        try {
            await signOut(auth);
            showToast('Выход выполнен', 'info');
            resetState();
        } catch (error) {
            showToast(getErrorMessage(error), 'error');
        }
    });
}

// Показать экран выбора проекта
function showProjectSelectionScreen() {
    if (!elements.projectSelectionScreen) return;
    
    elements.loginScreen.style.display = 'none';
    elements.adminPanel.style.display = 'none';
    elements.projectSelectionScreen.style.display = 'flex';
    
    renderProjectsList();
}

// Отрисовать список проектов
function renderProjectsList() {
    if (!elements.projectsList) return;
    
    const projects = projectManager.getAllProjects();
    elements.projectsList.innerHTML = '';
    
    if (projects.length === 0) {
        elements.projectsList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--apple-text-secondary);">
                <p>У вас пока нет сохраненных проектов.</p>
                <p>Добавьте свой первый проект ниже.</p>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        const isCurrent = projectManager.currentProjectId === project.id;
        if (isCurrent) {
            projectCard.classList.add('active');
        }
        
        projectCard.innerHTML = `
            <div class="project-card-content">
                <div class="project-card-name">${project.name}</div>
                <div class="project-card-id">${project.id}</div>
            </div>
            <div class="project-card-actions">
                ${isCurrent ? '<span class="project-badge">Текущий</span>' : ''}
                <button class="btn btn-small btn-primary" data-select-project="${project.id}">Выбрать</button>
                <button class="btn btn-small btn-danger" data-delete-project="${project.id}">Удалить</button>
            </div>
        `;
        
        elements.projectsList.appendChild(projectCard);
    });
    
    // Добавить обработчики
    document.querySelectorAll('[data-select-project]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.getAttribute('data-select-project');
            selectProject(projectId);
        });
    });
    
    document.querySelectorAll('[data-delete-project]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.getAttribute('data-delete-project');
            deleteProject(projectId);
        });
    });
}

// Выбрать проект
async function selectProject(projectId) {
    const project = projectManager.getProject(projectId);
    if (!project) {
        showToast('Проект не найден', 'error');
        return;
    }
    
    projectManager.setCurrentProject(projectId);
    await initializeFirebaseForProject(project);
}

// Удалить проект
function deleteProject(projectId) {
    const project = projectManager.getProject(projectId);
    if (!project) return;
    
    if (confirm(`Удалить проект "${project.name}"?\n\nЭто удалит только сохраненную конфигурацию, сам проект Firebase останется нетронутым.`)) {
        projectManager.deleteProject(projectId);
        renderProjectsList();
        showToast('Проект удален', 'success');
    }
}

// Добавить новый проект
async function addNewProject() {
    const projectId = elements.newProjectId?.value.trim();
    const projectName = elements.newProjectName?.value.trim();
    
    if (!projectId) {
        showError(elements.projectError, 'Введите Project ID');
        return;
    }
    
    // Проверка формата Project ID
    if (!/^[a-z0-9-]+$/.test(projectId)) {
        showError(elements.projectError, 'Project ID может содержать только строчные буквы, цифры и дефисы');
        return;
    }
    
    try {
        const project = projectManager.addProject(projectId, projectName || projectId);
        showToast('Проект добавлен', 'success');
        
        // Очистить форму
        if (elements.newProjectId) elements.newProjectId.value = '';
        if (elements.newProjectName) elements.newProjectName.value = '';
        
        // Выбрать новый проект
        await selectProject(project.id);
        
    } catch (error) {
        showError(elements.projectError, error.message);
    }
}

// Auth State Observer - setup when auth is ready
function setupAuthObserver() {
    if (!auth) {
        console.warn('Auth not ready, retrying...');
        setTimeout(setupAuthObserver, 500);
        return;
    }
    
    onAuthStateChanged(auth, (user) => {
        state.currentUser = user;
        
        if (user) {
            if (elements.userEmail) {
                elements.userEmail.textContent = user.email || user.displayName || 'Пользователь';
            }
            
            // При первой загрузке всегда показываем экран входа
            // Только после явного клика на "Войти через Google" переходим к выбору проекта
            if (state.isInitialLoad) {
                showLoginScreen();
            } else {
                // Проверяем проекты и показываем нужный экран
                checkProjectsAndShowScreen();
            }
            
        } else {
            showLoginScreen();
        }
    });
    
    console.log('Auth observer setup complete');
}

// Try to setup auth observer immediately
setupAuthObserver();

// ================================
// Initialize Event Listeners
// ================================

// Initialize filters and search
function initializeFiltersAndSearch() {
    // Update element references
    elements.collectionsSearch = getElement('collectionsSearch');
    elements.filterButtons = window.document.querySelectorAll('.sidebar-filter');
    
    // Search handler
    if (elements.collectionsSearch) {
        elements.collectionsSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const activeFilter = window.document.querySelector('.sidebar-filter.active')?.dataset.filter || 'all';
            renderCollections(activeFilter, searchTerm);
        });
    }
    
    // Filter buttons
    if (elements.filterButtons && elements.filterButtons.length > 0) {
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                elements.filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                
                const filter = btn.dataset.filter || 'all';
                const searchTerm = elements.collectionsSearch?.value.trim() || '';
                renderCollections(filter, searchTerm);
            });
        });
    }
}

// Function to attach refresh button listener
function attachRefreshButtonListener() {
    // Update element reference
    elements.refreshCollectionsBtn = getElement('refreshCollectionsBtn');
    
    if (elements.refreshCollectionsBtn) {
        // Remove existing listener if any
        const newBtn = elements.refreshCollectionsBtn.cloneNode(true);
        elements.refreshCollectionsBtn.parentNode.replaceChild(newBtn, elements.refreshCollectionsBtn);
        elements.refreshCollectionsBtn = newBtn;
        
        elements.refreshCollectionsBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Refresh button clicked');
            
            if (state.collectionsLoading) {
                console.log('Already loading...');
                showToast('Коллекции уже загружаются...', 'info');
                return;
            }
            
            showToast('Обновление коллекций...', 'info');
            await loadAllCollections();
            showToast('Коллекции обновлены', 'success');
        });
        console.log('Refresh button listener attached');
    } else {
        console.error('refreshCollectionsBtn not found');
    }
}

// Initialize sidebar navigation
function initializeSidebarNavigation() {
    // Update sidebar items reference
    elements.sidebarItems = window.document.querySelectorAll('.sidebar-item');
    
    // Sidebar items
    if (elements.sidebarItems && elements.sidebarItems.length > 0) {
        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                
                // Update active state
                elements.sidebarItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                // Show view
                if (view === 'dashboard') {
                    showView('dashboard');
                } else if (view === 'collections') {
                    showView('collections');
                }
            });
        });
    }
    
    // Back button
    if (elements.backToCollectionsBtn) {
        elements.backToCollectionsBtn.addEventListener('click', () => {
            resetState();
            showView('collections');
            // Update sidebar active state
            if (elements.sidebarItems) {
                elements.sidebarItems.forEach(i => i.classList.remove('active'));
                const collectionsItem = Array.from(elements.sidebarItems).find(i => i.dataset.view === 'collections');
                if (collectionsItem) {
                    collectionsItem.classList.add('active');
                }
            }
        });
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    attachRefreshButtonListener();
    initializeFiltersAndSearch();
    initializeSidebarNavigation();
}

// Try to initialize immediately
initializeEventListeners();

// ================================
// Collections Management
// ================================

// Known collections from Firestore rules
const KNOWN_COLLECTIONS = [
    'allowed_users',
    'checklist',
    'checklist_new',
    'checklist_history',
    'contacts',
    'information_systems',
    'notes',
    'night_duty_schedule',
    'shift_reports',
    'custom_tasks',
    'chat_sessions',
    'ai_chat_sessions',
    'chat_messages',
    'conversations',
    'chat_settings',
    'chat_notifications',
    'help_sections'
];

// Get collection stats
async function getCollectionStats(collectionName) {
    try {
        if (!db) {
            console.error('Firebase db not initialized');
            return {
                name: collectionName,
                count: 0,
                exists: false,
                error: 'Firebase not initialized'
            };
        }
        
        const colRef = collection(db, collectionName);
        
        // Try to get first document to check if collection exists
        const firstDocSnapshot = await getDocs(query(colRef, limit(1)));
        
        // Only get count if collection exists and has documents
        let totalCount = 0;
        if (!firstDocSnapshot.empty) {
            // Get approximate count - but limit to avoid long waits
            // Use getDocs with limit to get an estimate
            const countSnapshot = await getDocs(query(colRef, limit(1000)));
            totalCount = countSnapshot.size;
            
            // If we got 1000, there might be more
            if (totalCount === 1000) {
                totalCount = '1000+';
            }
        }
        
        return {
            name: collectionName,
            count: totalCount,
            exists: true,
            error: null
        };
    } catch (error) {
        // Check if error is permission denied vs collection doesn't exist
        if (error.code === 'permission-denied') {
            return {
                name: collectionName,
                count: 0,
                exists: true, // Collection exists but no access
                error: 'permission-denied'
            };
        } else if (error.code === 'not-found') {
            return {
                name: collectionName,
                count: 0,
                exists: false,
                error: 'not-found'
            };
        } else {
            return {
                name: collectionName,
                count: 0,
                exists: false,
                error: error.message
            };
        }
    }
}

// Get all collections stats
async function loadAllCollections() {
    if (!elements.collectionsList) {
        console.error('collectionsList not found');
        return;
    }
    
    if (state.collectionsLoading) {
        console.log('Collections already loading');
        return;
    }
    
    // Check if Firebase is initialized
    if (!db) {
        console.error('Firebase db is not initialized');
        showToast('Ошибка: Firebase не инициализирован. Проверьте консоль браузера.', 'error');
        return;
    }
    
    if (!auth) {
        console.error('Firebase auth is not initialized');
        showToast('Ошибка: Firebase Auth не инициализирован. Проверьте консоль браузера.', 'error');
        return;
    }
    
    state.collectionsLoading = true;
    if (elements.collectionsList) {
        elements.collectionsList.innerHTML = '';
    }
    
    // Show loading state
    if (elements.collectionsList) {
        const loadingCard = createCollectionListLoading();
        elements.collectionsList.appendChild(loadingCard);
    }
    
    try {
        console.log('Loading collections...');
        
        // Load collections sequentially with progress to avoid overwhelming Firebase
        state.collections = [];
        const totalCollections = KNOWN_COLLECTIONS.length;
        
        for (let i = 0; i < totalCollections; i++) {
            const collectionName = KNOWN_COLLECTIONS[i];
            try {
                const stats = await getCollectionStats(collectionName);
                state.collections.push(stats);
                
                // Update UI progress
                if (i === 0 || (i + 1) % 5 === 0 || i === totalCollections - 1) {
                    const progress = Math.round(((i + 1) / totalCollections) * 100);
                    console.log(`Progress: ${progress}% (${i + 1}/${totalCollections})`);
                }
            } catch (error) {
                state.collections.push({
                    name: collectionName,
                    count: 0,
                    exists: false,
                    error: error.message || 'Unknown error'
                });
            }
        }
        
        // Sort: existing collections first, then by count, then alphabetically
        state.collections.sort((a, b) => {
            if (a.exists !== b.exists) return b.exists - a.exists;
            
            // Handle count comparison (can be number or "1000+")
            const countA = typeof a.count === 'number' ? a.count : 0;
            const countB = typeof b.count === 'number' ? b.count : 0;
            if (countA !== countB) return countB - countA;
            
            return a.name.localeCompare(b.name);
        });
        
        console.log('Collections loaded:', state.collections.length);
        updateStatistics();
        renderCollections();
        
    } catch (error) {
        showToast('Ошибка загрузки коллекций: ' + getErrorMessage(error), 'error');
        console.error('Error loading collections:', error);
    } finally {
        state.collectionsLoading = false;
    }
}

// Create loading list item
function createCollectionListLoading() {
    const item = window.document.createElement('div');
    item.className = 'collection-list-item';
    item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; padding: 16px;">
            <div class="spinner" style="width: 20px; height: 20px; border-width: 2px; border-color: var(--apple-separator); border-top-color: var(--apple-blue);"></div>
            <span style="color: var(--apple-text-secondary);">Загрузка коллекций...</span>
        </div>
    `;
    return item;
}

// Update statistics
function updateStatistics() {
    if (!state.collections || state.collections.length === 0) return;
    
    const total = state.collections.length;
    const active = state.collections.filter(c => c.exists && !c.error && (typeof c.count === 'number' ? c.count > 0 : true)).length;
    const restricted = state.collections.filter(c => c.error === 'permission-denied').length;
    
    let totalDocs = 0;
    state.collections.forEach(c => {
        if (c.exists && !c.error && typeof c.count === 'number') {
            totalDocs += c.count;
        }
    });
    
    if (elements.totalCollections) elements.totalCollections.textContent = total;
    if (elements.activeCollections) elements.activeCollections.textContent = active;
    if (elements.totalDocuments) elements.totalDocuments.textContent = totalDocs.toLocaleString('ru-RU');
    if (elements.restrictedCollections) elements.restrictedCollections.textContent = restricted;
}

// Render collections list (Apple style)
function renderCollections(filter = 'all', searchTerm = '') {
    if (!elements.collectionsList) return;
    
    elements.collectionsList.innerHTML = '';
    
    if (state.collections.length === 0) {
        const emptyItem = window.document.createElement('div');
        emptyItem.className = 'collection-list-item';
        emptyItem.innerHTML = '<p style="text-align: center; color: var(--apple-text-secondary); padding: 2rem; width: 100%;">Коллекции не найдены</p>';
        elements.collectionsList.appendChild(emptyItem);
        return;
    }
    
    // Filter collections
    let filtered = state.collections;
    
    // Apply filter
    if (filter === 'active') {
        filtered = filtered.filter(c => c.exists && !c.error && (typeof c.count === 'number' ? c.count > 0 : true));
    } else if (filter === 'empty') {
        filtered = filtered.filter(c => !c.exists || (c.exists && !c.error && (typeof c.count === 'number' ? c.count === 0 : false)));
    } else if (filter === 'restricted') {
        filtered = filtered.filter(c => c.error === 'permission-denied');
    }
    
    // Apply search
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(searchLower)
        );
    }
    
    if (filtered.length === 0) {
        const emptyItem = window.document.createElement('div');
        emptyItem.className = 'collection-list-item';
        emptyItem.innerHTML = '<p style="text-align: center; color: var(--apple-text-secondary); padding: 2rem; width: 100%;">Ничего не найдено</p>';
        elements.collectionsList.appendChild(emptyItem);
        return;
    }
    
    filtered.forEach(collectionInfo => {
        const item = createCollectionListItem(collectionInfo);
        elements.collectionsList.appendChild(item);
    });
}

// Create collection list item (Apple style)
function createCollectionListItem(collectionInfo) {
    const item = window.document.createElement('div');
    item.className = 'collection-list-item';
    item.setAttribute('data-collection-name', collectionInfo.name.toLowerCase());
    
    const icon = getCollectionIcon(collectionInfo.name);
    const count = typeof collectionInfo.count === 'number' ? collectionInfo.count : collectionInfo.count || 0;
    const countText = typeof count === 'number' ? count.toLocaleString('ru-RU') : count;
    
    let statusText = '';
    if (collectionInfo.error === 'permission-denied') {
        statusText = 'Нет доступа';
    } else if (!collectionInfo.exists) {
        statusText = 'Не найдена';
    } else if (count === 0) {
        statusText = 'Пустая';
    }
    
    item.innerHTML = `
        <div class="collection-list-item-icon">
            ${icon}
        </div>
        <div class="collection-list-item-content">
            <div class="collection-list-item-name">${collectionInfo.name}</div>
            <div class="collection-list-item-meta">
                ${collectionInfo.exists && !collectionInfo.error ? `
                    <span>${countText} документов</span>
                ` : ''}
                ${statusText ? `<span style="color: var(--apple-text-secondary);">${statusText}</span>` : ''}
            </div>
        </div>
    `;
    
    // Add click handler
    if (collectionInfo.exists && collectionInfo.error !== 'permission-denied') {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            selectCollection(collectionInfo.name);
        });
    } else {
        item.style.opacity = '0.6';
        item.style.cursor = 'not-allowed';
    }
    
    return item;
}

// Get SVG icon for collection (SF Symbols style)
function getCollectionIcon(collectionName) {
    const icons = {
        'allowed_users': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-2.497m0-15.644a9.38 9.38 0 00-2.625.372 9.337 9.337 0 00-4.121 2.497M15 19.128v-2.25a2.25 2.25 0 00-.375-1.207M9 19.128v-2.25a2.25 2.25 0 00.375-1.207M9 19.128a9.38 9.38 0 01-2.625.372 9.337 9.337 0 01-4.121-2.497m0-15.644a9.38 9.38 0 012.625.372 9.337 9.337 0 014.121 2.497m9.246 6.744v-2.25a2.25 2.25 0 00-.375-1.207m-3.375 0a2.25 2.25 0 00.375 1.207m0-2.25a2.25 2.25 0 00-.375-1.207M9 4.872a2.25 2.25 0 01.375-1.207M9 4.872a2.25 2.25 0 00-.375-1.207M9 7.128a2.25 2.25 0 00.375-1.207M9 12.128a2.25 2.25 0 01.375-1.207m3.75 0a2.25 2.25 0 00.375 1.207m0-2.25a2.25 2.25 0 01.375-1.207m-3.75 0a2.25 2.25 0 00-.375-1.207m0 2.25a2.25 2.25 0 01.375 1.207m3.75 0a2.25 2.25 0 00.375-1.207" />
        </svg>`,
        'checklist': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`,
        'checklist_new': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>`,
        'checklist_history': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>`,
        'contacts': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>`,
        'information_systems': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>`,
        'notes': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>`,
        'night_duty_schedule': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>`,
        'shift_reports': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>`,
        'custom_tasks': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>`,
        'chat_sessions': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>`,
        'ai_chat_sessions': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>`,
        'chat_messages': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015 21c0-.552.336-.937.843-1.297A9.73 9.73 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>`,
        'conversations': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>`,
        'chat_settings': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>`,
        'chat_notifications': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>`,
        'help_sections': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>`
    };
    return icons[collectionName] || `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>`;
}

// Select collection
// View switching functions (Apple style)
function showView(viewName) {
    // Hide all views
    if (elements.dashboardView) {
        elements.dashboardView.classList.remove('active');
        elements.dashboardView.style.display = 'none';
    }
    if (elements.collectionsView) {
        elements.collectionsView.classList.remove('active');
        elements.collectionsView.style.display = 'none';
    }
    if (elements.collectionDetailView) {
        elements.collectionDetailView.classList.remove('active');
        elements.collectionDetailView.style.display = 'none';
    }
    
    // Show requested view
    if (viewName === 'dashboard' && elements.dashboardView) {
        elements.dashboardView.style.display = 'block';
        elements.dashboardView.classList.add('active');
    } else if (viewName === 'collections' && elements.collectionsView) {
        elements.collectionsView.style.display = 'block';
        elements.collectionsView.classList.add('active');
    } else if (viewName === 'collectionDetail' && elements.collectionDetailView) {
        elements.collectionDetailView.style.display = 'block';
        elements.collectionDetailView.classList.add('active');
    }
}

function selectCollection(collectionName) {
    if (!db) {
        console.error('Firebase db not initialized');
        showToast('Ошибка: Firebase не инициализирован. Подождите...', 'error');
        checkFirebaseInit();
        // Retry after a moment
        setTimeout(() => {
            if (db) {
                selectCollection(collectionName);
            }
        }, 1000);
        return;
    }
    
    state.currentCollection = collectionName;
    state.currentPage = 1;
    state.lastVisible = null;
    state.totalPages = 0;
    
    // Update collection name display
    if (elements.currentCollectionName) {
        elements.currentCollectionName.textContent = collectionName;
    }
    
    // Show collection detail view
    showView('collectionDetail');
    
    // Load collection documents
    loadCollection();
}

// Load collection on Enter (manual input)
if (elements.loadCollectionBtn) {
    elements.loadCollectionBtn.addEventListener('click', async () => {
        const collectionName = elements.collectionInput.value.trim();
        
        if (!collectionName) {
            showToast('Введите название коллекции', 'error');
            return;
        }
        
        selectCollection(collectionName);
    });
}

// Load collection on Enter
if (elements.collectionInput) {
    elements.collectionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            elements.loadCollectionBtn.click();
        }
    });
}

// Auto-load collections function is already handled in onAuthStateChanged

// ================================
// Load Documents
// ================================

async function loadCollection() {
    if (!state.currentCollection) return;
    
    // Check if db is initialized
    if (!db) {
        console.error('Firebase db not initialized');
        showToast('Ошибка: Firebase не инициализирован', 'error');
        hideLoading();
        return;
    }
    
    try {
        showLoading();
        
        const colRef = collection(db, state.currentCollection);
        
        // Build query
        let q = query(colRef, orderBy('__name__'), limit(state.pageSize));
        
        if (state.lastVisible) {
            q = query(colRef, orderBy('__name__'), startAfter(state.lastVisible), limit(state.pageSize));
        }
        
        // Execute query
        const snapshot = await getDocs(q);
        
        state.documents = [];
        snapshot.forEach((docSnapshot) => {
            state.documents.push({
                id: docSnapshot.id,
                data: docSnapshot.data()
            });
        });
        
        // Update lastVisible for pagination
        if (snapshot.docs.length > 0) {
            state.lastVisible = snapshot.docs[snapshot.docs.length - 1];
        }
        
        // Get total count (approximate)
        const totalSnapshot = await getDocs(query(colRef));
        const totalCount = totalSnapshot.size;
        
        // Calculate total pages
        const totalPages = Math.ceil(totalCount / state.pageSize);
        state.totalPages = totalPages;
        
        // Update UI
        if (elements.currentCollectionName) {
            elements.currentCollectionName.textContent = state.currentCollection;
        }
        if (elements.totalDocs) {
            elements.totalDocs.textContent = totalCount;
        }
        if (elements.shownDocs) {
            elements.shownDocs.textContent = state.documents.length;
        }
        
        renderDocuments();
        updatePaginationButtons(totalPages);
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showToast(getErrorMessage(error), 'error');
        console.error('Error loading collection:', error);
    }
}


// ================================
// Render Documents
// ================================

function renderDocuments() {
    if (!elements.documentsTableBody) return;
    
    elements.documentsTableBody.innerHTML = '';
    
    if (state.documents.length === 0) {
        if (elements.emptyState) {
            elements.emptyState.style.display = 'block';
        }
        return;
    }
    
    if (elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
    
    state.documents.forEach((docItem) => {
        const row = window.document.createElement('tr');
        
        const dataPreview = JSON.stringify(docItem.data, null, 2);
        const dataLines = dataPreview.split('\n');
        const isLong = dataLines.length > 4;
        const shortData = isLong ? dataLines.slice(0, 4).join('\n') + '\n...' : dataPreview;
        
        row.innerHTML = `
            <td class="doc-id" title="${docItem.id}">${docItem.id.length > 30 ? docItem.id.substring(0, 30) + '...' : docItem.id}</td>
            <td class="doc-data">
                <pre class="${isLong ? '' : 'expanded'}">${shortData}</pre>
                ${isLong ? '<button class="expand-data-btn" style="margin-top: 0.25rem; font-size: 0.65rem; padding: 0.25rem 0.5rem; background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 4px; cursor: pointer;">Развернуть</button>' : ''}
            </td>
            <td class="doc-actions">
                <button class="btn btn-small btn-primary btn-icon-only" data-edit="${docItem.id}" title="Редактировать">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                </button>
                <button class="btn btn-small btn-danger btn-icon-only" data-delete="${docItem.id}" title="Удалить">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .5c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </button>
            </td>
        `;
        
        // Add expand button handler
        if (isLong) {
            const expandBtn = row.querySelector('.expand-data-btn');
            const pre = row.querySelector('.doc-data pre');
            expandBtn.addEventListener('click', () => {
                if (pre.classList.contains('expanded')) {
                    pre.textContent = shortData;
                    pre.classList.remove('expanded');
                    expandBtn.textContent = 'Развернуть';
                } else {
                    pre.textContent = dataPreview;
                    pre.classList.add('expanded');
                    expandBtn.textContent = 'Свернуть';
                }
            });
        }
        
        elements.documentsTableBody.appendChild(row);
    });
    
    // Add event listeners
    elements.documentsTableBody.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const docId = e.target.getAttribute('data-edit');
            editDocument(docId);
        });
    });
    
    elements.documentsTableBody.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const docId = e.target.getAttribute('data-delete');
            showDeleteModal(docId);
        });
    });
}

// ================================
// Add Document
// ================================

if (elements.addDocumentBtn) {
    elements.addDocumentBtn.addEventListener('click', () => {
        state.editingDocId = null;
        elements.modalTitle.textContent = 'Добавить документ';
        elements.documentIdInput.value = '';
        elements.documentIdInput.disabled = false;
        elements.documentDataTextarea.value = '{}';
        elements.modalError.textContent = '';
        elements.documentModal.style.display = 'flex';
    });
}

// ================================
// Edit Document
// ================================

async function editDocument(docId) {
    try {
        showLoading();
        
        const docRef = doc(db, state.currentCollection, docId);
        const docSnapshot = await getDoc(docRef);
        
        if (!docSnapshot.exists()) {
            showToast('Документ не найден', 'error');
            hideLoading();
            return;
        }
        
        state.editingDocId = docId;
        elements.modalTitle.textContent = 'Редактировать документ';
        elements.documentIdInput.value = docId;
        elements.documentIdInput.disabled = true;
        elements.documentDataTextarea.value = JSON.stringify(docSnapshot.data(), null, 2);
        elements.modalError.textContent = '';
        elements.documentModal.style.display = 'flex';
        
        hideLoading();
    } catch (error) {
        hideLoading();
        showToast(getErrorMessage(error), 'error');
    }
}

// ================================
// Save Document
// ================================

if (elements.saveDocumentBtn) {
    elements.saveDocumentBtn.addEventListener('click', async () => {
    try {
        const docId = elements.documentIdInput.value.trim();
        const dataText = elements.documentDataTextarea.value.trim();
        
        if (!dataText) {
            showError(elements.modalError, 'Введите данные документа');
            return;
        }
        
        let data;
        try {
            data = JSON.parse(dataText);
        } catch (e) {
            showError(elements.modalError, 'Неверный формат JSON: ' + e.message);
            return;
        }
        
        // Convert date strings to Timestamps if needed
        convertDatesToTimestamps(data);
        
        elements.saveDocumentBtn.disabled = true;
        elements.saveDocumentBtn.textContent = 'Сохранение...';
        elements.modalError.textContent = '';
        
        if (state.editingDocId) {
            // Update existing document
            const docRef = doc(db, state.currentCollection, state.editingDocId);
            await updateDoc(docRef, data);
            showToast('Документ обновлен', 'success');
        } else if (docId) {
            // Create with specific ID
            const docRef = doc(db, state.currentCollection, docId);
            await setDoc(docRef, data);
            showToast('Документ создан', 'success');
        } else {
            // Create with auto ID
            await addDoc(collection(db, state.currentCollection), data);
            showToast('Документ создан', 'success');
        }
        
        elements.documentModal.style.display = 'none';
        await loadCollection();
        
    } catch (error) {
        showError(elements.modalError, getErrorMessage(error));
    } finally {
        elements.saveDocumentBtn.disabled = false;
        elements.saveDocumentBtn.textContent = 'Сохранить';
    }
    });
}

// ================================
// Delete Document
// ================================

function showDeleteModal(docId) {
    elements.deleteDocumentId.textContent = docId;
    elements.deleteModal.style.display = 'flex';
    
    elements.confirmDeleteBtn.onclick = async () => {
        try {
            elements.confirmDeleteBtn.disabled = true;
            elements.confirmDeleteBtn.textContent = 'Удаление...';
            
            const docRef = doc(db, state.currentCollection, docId);
            await deleteDoc(docRef);
            
            elements.deleteModal.style.display = 'none';
            showToast('Документ удален', 'success');
            await loadCollection();
            
        } catch (error) {
            showToast(getErrorMessage(error), 'error');
        } finally {
            elements.confirmDeleteBtn.disabled = false;
            elements.confirmDeleteBtn.textContent = 'Удалить';
        }
    };
}

// ================================
// Pagination
// ================================

if (elements.prevPageBtn) {
    elements.prevPageBtn.addEventListener('click', async () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            // Note: For proper pagination, you'd need to store previous page markers
            // This is a simplified version
            await loadCollection();
        }
    });
}

if (elements.nextPageBtn) {
    elements.nextPageBtn.addEventListener('click', async () => {
        state.currentPage++;
        await loadCollection();
    });
}

function updatePaginationButtons(totalPages = 0) {
    if (!elements.pageInfo || !elements.prevPageBtn || !elements.nextPageBtn) {
        console.warn('Pagination elements not found');
        return;
    }
    
    // Use state.totalPages if not provided
    if (totalPages === 0) {
        totalPages = state.totalPages;
    }
    
    // Calculate total pages if still not available
    if (totalPages === 0 && elements.totalDocs) {
        const totalCount = parseInt(elements.totalDocs.textContent) || 0;
        totalPages = Math.ceil(totalCount / state.pageSize);
        state.totalPages = totalPages;
    }
    
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.currentPage >= totalPages || totalPages === 0;
    
    // Update page info text
    if (totalPages > 0) {
        elements.pageInfo.textContent = `Страница ${state.currentPage} из ${totalPages}`;
    } else {
        elements.pageInfo.textContent = `Страница ${state.currentPage}`;
    }
}

// ================================
// Modal Controls
// ================================

if (elements.closeModalBtn) {
    elements.closeModalBtn.addEventListener('click', () => {
        elements.documentModal.style.display = 'none';
    });
}

if (elements.cancelModalBtn) {
    elements.cancelModalBtn.addEventListener('click', () => {
        elements.documentModal.style.display = 'none';
    });
}

if (elements.closeDeleteModalBtn) {
    elements.closeDeleteModalBtn.addEventListener('click', () => {
        elements.deleteModal.style.display = 'none';
    });
}

if (elements.cancelDeleteBtn) {
    elements.cancelDeleteBtn.addEventListener('click', () => {
        elements.deleteModal.style.display = 'none';
    });
}

// Close modals on outside click
if (elements.documentModal) {
    elements.documentModal.addEventListener('click', (e) => {
        if (e.target === elements.documentModal) {
            elements.documentModal.style.display = 'none';
        }
    });
}

if (elements.deleteModal) {
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            elements.deleteModal.style.display = 'none';
        }
    });
}

// ================================
// Utility Functions
// ================================

function showLoginScreen() {
    elements.loginScreen.style.display = 'flex';
    elements.adminPanel.style.display = 'none';
    if (elements.projectSelectionScreen) {
        elements.projectSelectionScreen.style.display = 'none';
    }
}

function showAdminPanel() {
    elements.loginScreen.style.display = 'none';
    if (elements.projectSelectionScreen) {
        elements.projectSelectionScreen.style.display = 'none';
    }
    elements.adminPanel.style.display = 'block';
    
    // Обновить название текущего проекта
    if (elements.currentProjectName && state.currentProject) {
        elements.currentProjectName.textContent = state.currentProject.name;
    }
    
    // Initialize event listeners for new structure
    setTimeout(() => {
        // Re-initialize sidebar items reference
        elements.sidebarItems = window.document.querySelectorAll('.sidebar-item');
        initializeEventListeners();
        
        // Show collections view by default and set active sidebar item
        showView('collections');
        if (elements.sidebarItems) {
            elements.sidebarItems.forEach(i => i.classList.remove('active'));
            const collectionsItem = Array.from(elements.sidebarItems).find(i => i.dataset.view === 'collections');
            if (collectionsItem) {
                collectionsItem.classList.add('active');
            }
        }
        
        // Load collections
        setTimeout(() => {
            checkFirebaseInit();
            if (db) {
                loadAllCollections();
            } else {
                console.warn('Waiting for db initialization...');
                setTimeout(() => {
                    checkFirebaseInit();
                    if (db) {
                        loadAllCollections();
                    }
                }, 1000);
            }
        }, 500);
    }, 100);
}

function showLoading() {
    elements.loadingState.style.display = 'flex';
    elements.emptyState.style.display = 'none';
}

function hideLoading() {
    elements.loadingState.style.display = 'none';
}

function resetState() {
    state.currentCollection = null;
    state.documents = [];
    state.lastVisible = null;
    state.currentPage = 1;
    state.totalPages = 0;
    state.editingDocId = null;
    
    if (elements.collectionInput) {
        elements.collectionInput.value = '';
    }
    if (elements.collectionDetailView) {
        elements.collectionDetailView.style.display = 'none';
    }
    if (elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
    
    // Show collections view
    showView('collections');
    
    // Reset pagination
    if (elements.pageInfo) {
        elements.pageInfo.textContent = 'Страница 1';
    }
    if (elements.prevPageBtn) {
        elements.prevPageBtn.disabled = true;
    }
    if (elements.nextPageBtn) {
        elements.nextPageBtn.disabled = true;
    }
}

function convertDatesToTimestamps(obj) {
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj[key])) {
                obj[key] = Timestamp.fromDate(new Date(obj[key]));
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                convertDatesToTimestamps(obj[key]);
            }
        }
    }
}

function getErrorMessage(error) {
    const errorMessages = {
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/email-already-in-use': 'Email уже используется',
        'auth/weak-password': 'Пароль слишком слабый',
        'auth/invalid-email': 'Неверный формат email',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
        'permission-denied': 'Недостаточно прав доступа',
        'not-found': 'Документ или коллекция не найдены'
    };
    
    return errorMessages[error.code] || error.message || 'Произошла ошибка';
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function showToast(message, type = 'info') {
    const toast = window.document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ================================
// Event Listeners Setup
// ================================

// Google Sign-In button
function setupGoogleSignInButton() {
    if (elements.googleSignInBtn) {
        elements.googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
}

// Project management buttons
function setupProjectManagementButtons() {
    // Add project button
    if (elements.addProjectBtn) {
        elements.addProjectBtn.addEventListener('click', addNewProject);
    }
    
    // Add project form submit on Enter
    if (elements.newProjectId) {
        elements.newProjectId.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewProject();
            }
        });
    }
    
    if (elements.newProjectName) {
        elements.newProjectName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewProject();
            }
        });
    }
    
    // Project switcher button in toolbar
    if (elements.projectSwitcherBtn) {
        elements.projectSwitcherBtn.addEventListener('click', () => {
            if (elements.projectManagementModal) {
                elements.projectManagementModal.style.display = 'flex';
                renderProjectManagementList();
            }
        });
    }
    
    // Close project management modal
    if (elements.closeProjectModalBtn) {
        elements.closeProjectModalBtn.addEventListener('click', () => {
            if (elements.projectManagementModal) {
                elements.projectManagementModal.style.display = 'none';
            }
        });
    }
    
    // Add new project from modal
    if (elements.addNewProjectBtn) {
        elements.addNewProjectBtn.addEventListener('click', () => {
            // Show add project form in modal
            showProjectSelectionScreen();
            if (elements.projectManagementModal) {
                elements.projectManagementModal.style.display = 'none';
            }
        });
    }
    
    // Close modal on outside click
    if (elements.projectManagementModal) {
        elements.projectManagementModal.addEventListener('click', (e) => {
            if (e.target === elements.projectManagementModal) {
                elements.projectManagementModal.style.display = 'none';
            }
        });
    }
}

// Render project management list in modal
function renderProjectManagementList() {
    if (!elements.projectManagementList) return;
    
    const projects = projectManager.getAllProjects();
    elements.projectManagementList.innerHTML = '';
    
    if (projects.length === 0) {
        elements.projectManagementList.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--apple-text-secondary);">
                <p>Нет сохраненных проектов</p>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-list-item';
        const isCurrent = projectManager.currentProjectId === project.id;
        if (isCurrent) {
            projectItem.classList.add('active');
        }
        
        projectItem.innerHTML = `
            <div class="project-list-item-content">
                <div class="project-list-item-name">${project.name}</div>
                <div class="project-list-item-id">${project.id}</div>
            </div>
            <div class="project-list-item-actions">
                ${!isCurrent ? `<button class="btn btn-small btn-primary" data-switch-project="${project.id}">Переключить</button>` : '<span class="project-badge">Активный</span>'}
                <button class="btn btn-small btn-danger" data-remove-project="${project.id}">Удалить</button>
            </div>
        `;
        
        elements.projectManagementList.appendChild(projectItem);
    });
    
    // Add event listeners
    document.querySelectorAll('[data-switch-project]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const projectId = e.target.getAttribute('data-switch-project');
            if (elements.projectManagementModal) {
                elements.projectManagementModal.style.display = 'none';
            }
            await selectProject(projectId);
        });
    });
    
    document.querySelectorAll('[data-remove-project]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectId = e.target.getAttribute('data-remove-project');
            deleteProject(projectId);
            renderProjectManagementList();
        });
    });
}

// Initialize all event listeners
setupGoogleSignInButton();
setupProjectManagementButtons();

