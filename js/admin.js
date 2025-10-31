// ================================
// Firebase Admin Panel - Main Script
// ================================

import { 
    signInWithEmailAndPassword, 
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

// ================================
// Global State
// ================================

const state = {
    currentUser: null,
    currentCollection: null,
    documents: [],
    lastVisible: null,
    currentPage: 1,
    pageSize: 20,
    searchTerm: '',
    searchField: null,
    editingDocId: null,
    collections: [],
    collectionsLoading: false
};

const auth = window.firebaseAuth;
const db = window.firebaseDb;

// ================================
// DOM Elements
// ================================

// Use window.document to avoid conflicts with variable names
const getElement = (id) => window.document.getElementById(id);

const elements = {
    // Login
    loginScreen: getElement('loginScreen'),
    loginForm: getElement('loginForm'),
    loginEmail: getElement('loginEmail'),
    loginPassword: getElement('loginPassword'),
    loginBtn: getElement('loginBtn'),
    loginError: getElement('loginError'),
    
    // Admin Panel
    adminPanel: getElement('adminPanel'),
    userEmail: getElement('userEmail'),
    logoutBtn: getElement('logoutBtn'),
    
    // Collections
    collectionsGrid: getElement('collectionsGrid'),
    refreshCollectionsBtn: getElement('refreshCollectionsBtn'),
    
    // Collection
    collectionInput: getElement('collectionInput'),
    loadCollectionBtn: getElement('loadCollectionBtn'),
    collectionInfo: getElement('collectionInfo'),
    currentCollectionName: getElement('currentCollectionName'),
    totalDocs: getElement('totalDocs'),
    shownDocs: getElement('shownDocs'),
    
    // Search
    searchSection: getElement('searchSection'),
    searchInput: getElement('searchInput'),
    searchBtn: getElement('searchBtn'),
    clearSearchBtn: getElement('clearSearchBtn'),
    
    // Documents
    documentsSection: getElement('documentsSection'),
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
    toastContainer: getElement('toastContainer')
};

// ================================
// Authentication
// ================================

// Email/Password Login
elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    
    if (!email || !password) {
        showError(elements.loginError, 'Заполните все поля');
        return;
    }
    
    try {
        elements.loginBtn.disabled = true;
        elements.loginBtn.textContent = 'Вход...';
        elements.loginError.textContent = '';
        
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Вход выполнен успешно', 'success');
    } catch (error) {
        showError(elements.loginError, getErrorMessage(error));
    } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.textContent = 'Войти';
    }
});

// Logout
elements.logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showToast('Выход выполнен', 'info');
        resetState();
    } catch (error) {
        showToast(getErrorMessage(error), 'error');
    }
});

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    state.currentUser = user;
    
    if (user) {
        elements.userEmail.textContent = user.email || user.displayName || 'Пользователь';
        showAdminPanel();
        // Load collections after authentication
        setTimeout(() => {
            loadAllCollections();
        }, 500);
    } else {
        showLoginScreen();
    }
});

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
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(query(colRef, limit(1)));
        
        // Get total count (approximate by checking if collection exists)
        const totalSnapshot = await getDocs(query(colRef));
        const totalCount = totalSnapshot.size;
        
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
    if (state.collectionsLoading) return;
    
    state.collectionsLoading = true;
    elements.collectionsGrid.innerHTML = '';
    
    // Show loading state
    const loadingCard = createCollectionCardLoading();
    elements.collectionsGrid.appendChild(loadingCard);
    
    try {
        const collectionsPromises = KNOWN_COLLECTIONS.map(name => getCollectionStats(name));
        const collectionsResults = await Promise.allSettled(collectionsPromises);
        
        state.collections = collectionsResults.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                return {
                    name: KNOWN_COLLECTIONS[index],
                    count: 0,
                    exists: false,
                    error: result.reason?.message || 'Unknown error'
                };
            }
        });
        
        // Sort: existing collections first, then by count, then alphabetically
        state.collections.sort((a, b) => {
            if (a.exists !== b.exists) return b.exists - a.exists;
            if (a.count !== b.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });
        
        renderCollections();
        
    } catch (error) {
        showToast('Ошибка загрузки коллекций: ' + getErrorMessage(error), 'error');
        console.error('Error loading collections:', error);
    } finally {
        state.collectionsLoading = false;
    }
}

// Create loading card
function createCollectionCardLoading() {
    const card = window.document.createElement('div');
    card.className = 'collection-card';
    card.innerHTML = `
        <div class="collection-card-loading">
            <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
            <span>Загрузка коллекций...</span>
        </div>
    `;
    return card;
}

// Render collections grid
function renderCollections() {
    elements.collectionsGrid.innerHTML = '';
    
    if (state.collections.length === 0) {
        const emptyCard = window.document.createElement('div');
        emptyCard.className = 'collection-card';
        emptyCard.style.gridColumn = '1 / -1';
        emptyCard.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Коллекции не найдены</p>';
        elements.collectionsGrid.appendChild(emptyCard);
        return;
    }
    
    state.collections.forEach(collectionInfo => {
        const card = createCollectionCard(collectionInfo);
        elements.collectionsGrid.appendChild(card);
    });
}

// Create collection card
function createCollectionCard(collectionInfo) {
    const card = window.document.createElement('div');
    card.className = 'collection-card';
    
    const icon = getCollectionIcon(collectionInfo.name);
    const statusColor = collectionInfo.exists ? 'var(--primary-color)' : 'var(--text-secondary)';
    const statusText = collectionInfo.exists 
        ? (collectionInfo.error === 'permission-denied' ? 'Нет доступа' : `${collectionInfo.count} документов`)
        : 'Не найдена';
    
    card.innerHTML = `
        <div class="collection-card-header">
            <h3 class="collection-card-name">${collectionInfo.name}</h3>
            <span class="collection-card-icon">${icon}</span>
        </div>
        <div class="collection-card-stats">
            <div class="collection-card-stat">
                <span>Статус:</span>
                <span class="collection-card-stat-value" style="color: ${statusColor}">
                    ${statusText}
                </span>
            </div>
            ${collectionInfo.exists && !collectionInfo.error ? `
                <div class="collection-card-stat">
                    <span>Документов:</span>
                    <span class="collection-card-stat-value">${collectionInfo.count}</span>
                </div>
            ` : ''}
            ${collectionInfo.error && collectionInfo.error !== 'permission-denied' ? `
                <div class="collection-card-error">Ошибка: ${collectionInfo.error}</div>
            ` : ''}
        </div>
    `;
    
    if (collectionInfo.exists && collectionInfo.error !== 'permission-denied') {
        card.addEventListener('click', () => {
            selectCollection(collectionInfo.name);
        });
    } else {
        card.style.opacity = '0.6';
        card.style.cursor = 'not-allowed';
    }
    
    return card;
}

// Get icon for collection
function getCollectionIcon(collectionName) {
    const icons = {
        'allowed_users': '👥',
        'checklist': '✅',
        'checklist_new': '📝',
        'checklist_history': '📜',
        'contacts': '📇',
        'information_systems': '💻',
        'notes': '📄',
        'night_duty_schedule': '🌙',
        'shift_reports': '📊',
        'custom_tasks': '🎯',
        'chat_sessions': '💬',
        'ai_chat_sessions': '🤖',
        'chat_messages': '💭',
        'conversations': '🗣️',
        'chat_settings': '⚙️',
        'chat_notifications': '🔔',
        'help_sections': '❓'
    };
    return icons[collectionName] || '📦';
}

// Select collection
function selectCollection(collectionName) {
    state.currentCollection = collectionName;
    state.currentPage = 1;
    state.lastVisible = null;
    state.searchTerm = '';
    state.searchField = null;
    
    // Update input
    elements.collectionInput.value = collectionName;
    
    // Scroll to documents section
    loadCollection().then(() => {
        elements.collectionInfo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// Refresh collections
elements.refreshCollectionsBtn.addEventListener('click', () => {
    loadAllCollections();
});

// Load collection on Enter (manual input)
elements.loadCollectionBtn.addEventListener('click', async () => {
    const collectionName = elements.collectionInput.value.trim();
    
    if (!collectionName) {
        showToast('Введите название коллекции', 'error');
        return;
    }
    
    selectCollection(collectionName);
});

// Load collection on Enter
elements.collectionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.loadCollectionBtn.click();
    }
});

// Auto-load collections function is already handled in onAuthStateChanged

// ================================
// Load Documents
// ================================

async function loadCollection() {
    if (!state.currentCollection) return;
    
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
        
        // Update UI
        elements.currentCollectionName.textContent = state.currentCollection;
        elements.totalDocs.textContent = totalCount;
        elements.shownDocs.textContent = state.documents.length;
        
        elements.collectionInfo.style.display = 'block';
        elements.searchSection.style.display = 'block';
        elements.documentsSection.style.display = 'block';
        
        renderDocuments();
        updatePaginationButtons();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showToast(getErrorMessage(error), 'error');
        console.error('Error loading collection:', error);
    }
}

// ================================
// Search
// ================================

elements.searchBtn.addEventListener('click', async () => {
    const searchTerm = elements.searchInput.value.trim();
    state.searchTerm = searchTerm;
    
    if (searchTerm) {
        await performSearch();
    } else {
        await loadCollection();
    }
});

elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    state.searchTerm = '';
    state.searchField = null;
    loadCollection();
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.searchBtn.click();
    }
});

async function performSearch() {
    // Simple search: filter documents client-side
    // For production, use Firestore query with where clauses
    await loadCollection();
    
    if (state.searchTerm) {
        state.documents = state.documents.filter(doc => {
            const dataStr = JSON.stringify(doc.data).toLowerCase();
            return dataStr.includes(state.searchTerm.toLowerCase()) || 
                   doc.id.toLowerCase().includes(state.searchTerm.toLowerCase());
        });
        renderDocuments();
    }
}

// ================================
// Render Documents
// ================================

function renderDocuments() {
    elements.documentsTableBody.innerHTML = '';
    
    if (state.documents.length === 0) {
        elements.emptyState.style.display = 'block';
        elements.documentsSection.style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    
    state.documents.forEach((docItem) => {
        const row = window.document.createElement('tr');
        
        row.innerHTML = `
            <td class="doc-id">${docItem.id}</td>
            <td class="doc-data">
                <pre>${JSON.stringify(docItem.data, null, 2)}</pre>
            </td>
            <td class="doc-actions">
                <button class="btn btn-small btn-primary" data-edit="${docItem.id}">Редактировать</button>
                <button class="btn btn-small btn-danger" data-delete="${docItem.id}">Удалить</button>
            </td>
        `;
        
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

elements.addDocumentBtn.addEventListener('click', () => {
    state.editingDocId = null;
    elements.modalTitle.textContent = 'Добавить документ';
    elements.documentIdInput.value = '';
    elements.documentIdInput.disabled = false;
    elements.documentDataTextarea.value = '{}';
    elements.modalError.textContent = '';
    elements.documentModal.style.display = 'flex';
});

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

elements.prevPageBtn.addEventListener('click', async () => {
    if (state.currentPage > 1) {
        state.currentPage--;
        // Note: For proper pagination, you'd need to store previous page markers
        // This is a simplified version
        await loadCollection();
    }
});

elements.nextPageBtn.addEventListener('click', async () => {
    state.currentPage++;
    await loadCollection();
});

function updatePaginationButtons() {
    elements.prevPageBtn.disabled = state.currentPage === 1;
    elements.nextPageBtn.disabled = state.documents.length < state.pageSize;
    elements.pageInfo.textContent = `Страница ${state.currentPage}`;
}

// ================================
// Modal Controls
// ================================

elements.closeModalBtn.addEventListener('click', () => {
    elements.documentModal.style.display = 'none';
});

elements.cancelModalBtn.addEventListener('click', () => {
    elements.documentModal.style.display = 'none';
});

elements.closeDeleteModalBtn.addEventListener('click', () => {
    elements.deleteModal.style.display = 'none';
});

elements.cancelDeleteBtn.addEventListener('click', () => {
    elements.deleteModal.style.display = 'none';
});

// Close modals on outside click
elements.documentModal.addEventListener('click', (e) => {
    if (e.target === elements.documentModal) {
        elements.documentModal.style.display = 'none';
    }
});

elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
        elements.deleteModal.style.display = 'none';
    }
});

// ================================
// Utility Functions
// ================================

function showLoginScreen() {
    elements.loginScreen.style.display = 'flex';
    elements.adminPanel.style.display = 'none';
}

function showAdminPanel() {
    elements.loginScreen.style.display = 'none';
    elements.adminPanel.style.display = 'block';
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
    state.searchTerm = '';
    state.searchField = null;
    state.editingDocId = null;
    
    elements.collectionInput.value = '';
    elements.searchInput.value = '';
    elements.collectionInfo.style.display = 'none';
    elements.searchSection.style.display = 'none';
    elements.documentsSection.style.display = 'none';
    elements.emptyState.style.display = 'none';
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

