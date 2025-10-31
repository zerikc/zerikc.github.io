// ================================
// Firebase Admin Panel - Main Script
// ================================

import { 
    signInWithEmailAndPassword, 
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
    editingDocId: null
};

const auth = window.firebaseAuth;
const db = window.firebaseDb;

// ================================
// DOM Elements
// ================================

const elements = {
    // Login
    loginScreen: document.getElementById('loginScreen'),
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginBtn: document.getElementById('loginBtn'),
    loginError: document.getElementById('loginError'),
    googleLoginBtn: document.getElementById('googleLoginBtn'),
    
    // Admin Panel
    adminPanel: document.getElementById('adminPanel'),
    userEmail: document.getElementById('userEmail'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Collection
    collectionInput: document.getElementById('collectionInput'),
    loadCollectionBtn: document.getElementById('loadCollectionBtn'),
    collectionInfo: document.getElementById('collectionInfo'),
    currentCollectionName: document.getElementById('currentCollectionName'),
    totalDocs: document.getElementById('totalDocs'),
    shownDocs: document.getElementById('shownDocs'),
    
    // Search
    searchSection: document.getElementById('searchSection'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    
    // Documents
    documentsSection: document.getElementById('documentsSection'),
    documentsTableBody: document.getElementById('documentsTableBody'),
    addDocumentBtn: document.getElementById('addDocumentBtn'),
    
    // Pagination
    pagination: document.getElementById('pagination'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageInfo: document.getElementById('pageInfo'),
    
    // Modal
    documentModal: document.getElementById('documentModal'),
    modalTitle: document.getElementById('modalTitle'),
    documentIdInput: document.getElementById('documentIdInput'),
    documentDataTextarea: document.getElementById('documentDataTextarea'),
    saveDocumentBtn: document.getElementById('saveDocumentBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalError: document.getElementById('modalError'),
    
    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    deleteDocumentId: document.getElementById('deleteDocumentId'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    closeDeleteModalBtn: document.getElementById('closeDeleteModalBtn'),
    
    // States
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    toastContainer: document.getElementById('toastContainer')
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

// Google Login
elements.googleLoginBtn.addEventListener('click', async () => {
    try {
        elements.googleLoginBtn.disabled = true;
        elements.googleLoginBtn.textContent = 'Вход...';
        
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        showToast('Вход выполнен успешно', 'success');
    } catch (error) {
        showError(elements.loginError, getErrorMessage(error));
    } finally {
        elements.googleLoginBtn.disabled = false;
        elements.googleLoginBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Войти через Google
        `;
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
    } else {
        showLoginScreen();
    }
});

// ================================
// Collection Management
// ================================

elements.loadCollectionBtn.addEventListener('click', async () => {
    const collectionName = elements.collectionInput.value.trim();
    
    if (!collectionName) {
        showToast('Введите название коллекции', 'error');
        return;
    }
    
    state.currentCollection = collectionName;
    state.currentPage = 1;
    state.lastVisible = null;
    state.searchTerm = '';
    state.searchField = null;
    
    await loadCollection();
});

// Load collection on Enter
elements.collectionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        elements.loadCollectionBtn.click();
    }
});

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
    
    state.documents.forEach((document) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="doc-id">${document.id}</td>
            <td class="doc-data">
                <pre>${JSON.stringify(document.data, null, 2)}</pre>
            </td>
            <td class="doc-actions">
                <button class="btn btn-small btn-primary" data-edit="${document.id}">Редактировать</button>
                <button class="btn btn-small btn-danger" data-delete="${document.id}">Удалить</button>
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
    const toast = document.createElement('div');
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

