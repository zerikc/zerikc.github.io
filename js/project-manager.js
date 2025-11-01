// ================================
// Firebase Project Manager
// ================================
// Управление списком Firebase проектов в localStorage

const STORAGE_KEY = 'firebaseProjects';
const CURRENT_PROJECT_KEY = 'currentProjectId';

export class ProjectManager {
    constructor() {
        this.projects = this.loadProjects();
        this.currentProjectId = this.loadCurrentProjectId();
    }

    // ================================
    // Load/Save from localStorage
    // ================================

    loadProjects() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading projects:', error);
            return [];
        }
    }

    saveProjects() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
        } catch (error) {
            console.error('Error saving projects:', error);
        }
    }

    loadCurrentProjectId() {
        try {
            return localStorage.getItem(CURRENT_PROJECT_KEY) || null;
        } catch (error) {
            console.error('Error loading current project:', error);
            return null;
        }
    }

    saveCurrentProjectId(projectId) {
        try {
            if (projectId) {
                localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
            } else {
                localStorage.removeItem(CURRENT_PROJECT_KEY);
            }
            this.currentProjectId = projectId;
        } catch (error) {
            console.error('Error saving current project:', error);
        }
    }

    // ================================
    // CRUD Operations
    // ================================

    /**
     * Добавить новый проект
     * @param {string} projectId - Firebase Project ID
     * @param {string} name - Название проекта (опционально)
     * @param {object} config - Дополнительная конфигурация (опционально)
     * @returns {object} - Созданный проект
     */
    addProject(projectId, name = null, config = {}) {
        if (!projectId || typeof projectId !== 'string') {
            throw new Error('Project ID обязателен и должен быть строкой');
        }

        // Проверка, не существует ли уже проект с таким ID
        const existing = this.projects.find(p => p.id === projectId);
        if (existing) {
            throw new Error('Проект с таким ID уже существует');
        }

        const project = {
            id: projectId,
            name: name || projectId,
            addedAt: new Date().toISOString(),
            config: config
        };

        this.projects.push(project);
        this.saveProjects();

        // Если это первый проект, сделать его текущим
        if (this.projects.length === 1) {
            this.setCurrentProject(projectId);
        }

        return project;
    }

    /**
     * Получить проект по ID
     * @param {string} projectId - Firebase Project ID
     * @returns {object|null} - Проект или null
     */
    getProject(projectId) {
        return this.projects.find(p => p.id === projectId) || null;
    }

    /**
     * Получить все проекты
     * @returns {array} - Массив проектов
     */
    getAllProjects() {
        return [...this.projects];
    }

    /**
     * Получить текущий проект
     * @returns {object|null} - Текущий проект или null
     */
    getCurrentProject() {
        if (!this.currentProjectId) {
            return null;
        }
        return this.getProject(this.currentProjectId);
    }

    /**
     * Установить текущий проект
     * @param {string} projectId - Firebase Project ID
     * @returns {boolean} - Успешность операции
     */
    setCurrentProject(projectId) {
        const project = this.getProject(projectId);
        if (!project) {
            console.error('Project not found:', projectId);
            return false;
        }
        this.saveCurrentProjectId(projectId);
        return true;
    }

    /**
     * Обновить проект
     * @param {string} projectId - Firebase Project ID
     * @param {object} updates - Объект с обновлениями
     * @returns {object|null} - Обновленный проект или null
     */
    updateProject(projectId, updates) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            console.error('Project not found:', projectId);
            return null;
        }

        // Не разрешаем изменять ID
        if (updates.id && updates.id !== projectId) {
            delete updates.id;
        }

        this.projects[projectIndex] = {
            ...this.projects[projectIndex],
            ...updates
        };

        this.saveProjects();
        return this.projects[projectIndex];
    }

    /**
     * Удалить проект
     * @param {string} projectId - Firebase Project ID
     * @returns {boolean} - Успешность операции
     */
    deleteProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) {
            console.error('Project not found:', projectId);
            return false;
        }

        this.projects.splice(projectIndex, 1);
        this.saveProjects();

        // Если удален текущий проект, сбросить текущий
        if (this.currentProjectId === projectId) {
            // Если есть другие проекты, выбрать первый
            if (this.projects.length > 0) {
                this.setCurrentProject(this.projects[0].id);
            } else {
                this.saveCurrentProjectId(null);
            }
        }

        return true;
    }

    /**
     * Очистить все проекты
     */
    clearAll() {
        this.projects = [];
        this.saveProjects();
        this.saveCurrentProjectId(null);
    }

    // ================================
    // Helper Methods
    // ================================

    /**
     * Проверить, есть ли проекты
     * @returns {boolean}
     */
    hasProjects() {
        return this.projects.length > 0;
    }

    /**
     * Получить количество проектов
     * @returns {number}
     */
    getProjectCount() {
        return this.projects.length;
    }

    /**
     * Построить конфигурацию Firebase из Project ID
     * @param {string} projectId - Firebase Project ID
     * @param {object} customConfig - Дополнительная конфигурация (опционально)
     * @returns {object} - Firebase конфигурация
     */
    static buildFirebaseConfig(projectId, customConfig = {}) {
        return {
            projectId: projectId,
            authDomain: customConfig.authDomain || `${projectId}.firebaseapp.com`,
            databaseURL: customConfig.databaseURL || `https://${projectId}-default-rtdb.firebaseio.com`,
            storageBucket: customConfig.storageBucket || `${projectId}.appspot.com`,
            // apiKey не обязателен для работы с Firestore через Google Auth
            ...customConfig
        };
    }

    /**
     * Экспортировать проекты в JSON
     * @returns {string} - JSON строка
     */
    exportProjects() {
        return JSON.stringify({
            projects: this.projects,
            currentProjectId: this.currentProjectId,
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Импортировать проекты из JSON
     * @param {string} jsonString - JSON строка
     * @returns {boolean} - Успешность операции
     */
    importProjects(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.projects || !Array.isArray(data.projects)) {
                throw new Error('Неверный формат данных');
            }

            this.projects = data.projects;
            this.saveProjects();

            if (data.currentProjectId) {
                this.setCurrentProject(data.currentProjectId);
            }

            return true;
        } catch (error) {
            console.error('Error importing projects:', error);
            return false;
        }
    }
}

// Создать глобальный экземпляр
export const projectManager = new ProjectManager();

