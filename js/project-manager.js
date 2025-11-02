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
            // Silent fail in production, errors are handled by caller
            if (window.logger) {
                window.logger.error('Error loading projects:', error);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Error loading projects:', error);
            }
            return [];
        }
    }

    saveProjects() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
        } catch (error) {
            // Silent fail in production
            if (window.logger) {
                window.logger.error('Error saving projects:', error);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Error saving projects:', error);
            }
        }
    }

    loadCurrentProjectId() {
        try {
            return localStorage.getItem(CURRENT_PROJECT_KEY) || null;
        } catch (error) {
            // Silent fail in production
            if (window.logger) {
                window.logger.error('Error loading current project:', error);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Error loading current project:', error);
            }
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
            // Silent fail in production
            if (window.logger) {
                window.logger.error('Error saving current project:', error);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Error saving current project:', error);
            }
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
            // Silent fail in production
            if (window.logger) {
                window.logger.error('Project not found:', projectId);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Project not found:', projectId);
            }
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
            // Silent fail in production
            if (window.logger) {
                window.logger.error('Project not found:', projectId);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Project not found:', projectId);
            }
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
            // Silent fail in production
            if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Project not found:', projectId);
            }
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
     * Получить список Firebase проектов пользователя через Google Cloud API
     * @param {string} accessToken - Google OAuth токен
     * @returns {Promise<Array>} - Список проектов
     */
    static async fetchUserProjects(accessToken) {
        try {
            // Получаем все проекты через Cloud Resource Manager API
            const response = await fetch('https://cloudresourcemanager.googleapis.com/v1/projects', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch projects: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data.projects || [];
            
        } catch (error) {
            // Always log network errors
            if (window.logger) {
                window.logger.error('Error fetching projects:', error);
            } else {
                console.error('Error fetching projects:', error);
            }
            throw error;
        }
    }
    
    /**
     * Проверить, является ли проект Firebase проектом
     * @param {string} projectId - Project ID
     * @param {string} accessToken - Google OAuth токен
     * @returns {Promise<boolean>} - true если проект имеет Firebase
     */
    static async isFirebaseProject(projectId, accessToken) {
        try {
            // Проверяем через Firebase Management API
            const response = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            return response.ok;
            
        } catch (error) {
            return false;
        }
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
     * Получить метрики использования Firestore из Google Cloud Monitoring API
     * @param {string} projectId - Firebase Project ID
     * @param {string} accessToken - Google OAuth токен
     * @param {string} metricType - Тип метрики: 'read_count', 'write_count', 'delete_count'
     * @param {number} hoursBack - Количество часов назад (для почасовых данных)
     * @param {number} daysBack - Количество дней назад (для дневных данных)
     * @returns {Promise<Array>} - Массив временных рядов с метриками
     */
    static async getFirestoreMetrics(projectId, accessToken, metricType, hoursBack = null, daysBack = null) {
        try {
            const endTime = new Date().toISOString();
            let startTime;
            
            if (hoursBack !== null) {
                const start = new Date();
                start.setHours(start.getHours() - hoursBack);
                startTime = start.toISOString();
            } else if (daysBack !== null) {
                const start = new Date();
                start.setDate(start.getDate() - daysBack);
                startTime = start.toISOString();
            } else {
                throw new Error('Необходимо указать hoursBack или daysBack');
            }
            
            // Используем правильные метрики Firestore
            // firestore.googleapis.com/api/request_count - общее количество запросов
            // Можно фильтровать по method_name: GetDocument, CreateDocument, UpdateDocument, DeleteDocument
            const metricTypeFull = 'firestore.googleapis.com/api/request_count';
            
            // Фильтруем по method_name для разделения read/write/delete
            const filter = metricType === 'read_count'
                ? `metric.type="${metricTypeFull}" AND metric.labels.method_name="GetDocument"`
                : metricType === 'write_count'
                ? `metric.type="${metricTypeFull}" AND (metric.labels.method_name="CreateDocument" OR metric.labels.method_name="UpdateDocument" OR metric.labels.method_name="CommitTransaction")`
                : metricType === 'delete_count'
                ? `metric.type="${metricTypeFull}" AND metric.labels.method_name="DeleteDocument"`
                : `metric.type="${metricTypeFull}"`;
            
            // Для дневных данных используем начало дня в UTC для правильной агрегации
            let startTimeFormatted = startTime;
            let endTimeFormatted = endTime;
            
            if (daysBack !== null) {
                // Для дневных данных нормализуем время до начала дня в UTC
                const startDate = new Date(startTime);
                startDate.setUTCHours(0, 0, 0, 0);
                startTimeFormatted = startDate.toISOString();
                
                const endDate = new Date(endTime);
                endDate.setUTCHours(23, 59, 59, 999);
                endTimeFormatted = endDate.toISOString();
            }
            
            const alignmentPeriod = hoursBack !== null ? '3600s' : '86400s';
            const url = `https://monitoring.googleapis.com/v3/projects/${projectId}/timeSeries?` +
                `filter=${encodeURIComponent(filter)}&` +
                `interval.startTime=${encodeURIComponent(startTimeFormatted)}&` +
                `interval.endTime=${encodeURIComponent(endTimeFormatted)}&` +
                `aggregation.alignmentPeriod=${alignmentPeriod}&` +
                `aggregation.perSeriesAligner=ALIGN_SUM&` + // Суммируем значения за период
                `aggregation.crossSeriesReducer=REDUCE_SUM`;
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            if (!response.ok) {
                let errorText = await response.text();
                let errorData;
                
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Если не JSON, используем текст как есть
                    errorData = { message: errorText };
                }
                
                // Проверяем, является ли это ошибкой биллинга
                if (response.status === 403 && errorData.error && 
                    (errorData.error.message?.toLowerCase().includes('billing') || 
                     errorData.error.message?.toLowerCase().includes('биллинг'))) {
                    const billingError = new Error('BILLING_REQUIRED');
                    billingError.status = 403;
                    billingError.originalMessage = errorData.error.message;
                    billingError.originalError = errorData;
                    throw billingError;
                }
                
                throw new Error(`Failed to fetch metrics: ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            
            // Логируем для отладки (только в development)
            if (window.logger && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
                window.logger.log(`Firestore metrics for ${metricType}:`, {
                    count: data.timeSeries?.length || 0,
                    filter: filter,
                    firstSeries: data.timeSeries?.[0] || null
                });
            }
            
            return data.timeSeries || [];
            
        } catch (error) {
            // Не логируем ошибки биллинга, чтобы не засорять консоль
            // Они будут обработаны на уровне выше с понятным сообщением
            if (error.message !== 'BILLING_REQUIRED') {
                if (window.logger) {
                    window.logger.error('Error fetching Firestore metrics:', error);
                } else {
                    console.error('Error fetching Firestore metrics:', error);
                }
            }
            throw error;
        }
    }
    
    /**
     * Получить данные использования Firestore за последние 24 часа (по часам)
     * @param {string} projectId - Firebase Project ID
     * @param {string} accessToken - Google OAuth токен
     * @returns {Promise<Object>} - Объект с reads, writes, deletes массивами по часам
     */
    static async getFirestoreHourlyData(projectId, accessToken) {
        try {
            const [reads, writes, deletes] = await Promise.allSettled([
                this.getFirestoreMetrics(projectId, accessToken, 'read_count', 24),
                this.getFirestoreMetrics(projectId, accessToken, 'write_count', 24),
                this.getFirestoreMetrics(projectId, accessToken, 'delete_count', 24)
            ]);
            
            // Проверяем на ошибку биллинга
            const billingError = [reads, writes, deletes].find(result => 
                result.status === 'rejected' && 
                result.reason && 
                result.reason.message === 'BILLING_REQUIRED'
            );
            
            if (billingError) {
                const error = new Error('Для просмотра метрик необходимо включить биллинг в Google Cloud Console');
                error.type = 'BILLING_REQUIRED';
                error.originalMessage = billingError.reason.originalMessage;
                throw error;
            }
            
            // Обрабатываем результаты (успешные и неуспешные)
            const readsData = reads.status === 'fulfilled' ? reads.value : [];
            const writesData = writes.status === 'fulfilled' ? writes.value : [];
            const deletesData = deletes.status === 'fulfilled' ? deletes.value : [];
            
            // Преобразуем данные в формат для графика (24 часа)
            const hoursData = {
                reads: new Array(24).fill(0),
                writes: new Array(24).fill(0),
                deletes: new Array(24).fill(0),
                labels: []
            };
            
            // Генерируем метки для каждого часа
            const now = new Date();
            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now);
                hour.setHours(hour.getHours() - i);
                hour.setMinutes(0, 0, 0);
                hoursData.labels.push(hour.getHours());
            }
            
            // Парсим данные из timeSeries
            [readsData, writesData, deletesData].forEach((timeSeries, index) => {
                const metricArray = index === 0 ? hoursData.reads : index === 1 ? hoursData.writes : hoursData.deletes;
                
                timeSeries.forEach(series => {
                    if (series.points && series.points.length > 0) {
                        series.points.forEach(point => {
                            if (point.interval && point.value) {
                                const pointTime = new Date(point.interval.endTime);
                                const hoursAgo = Math.floor((now - pointTime) / (1000 * 60 * 60));
                                const hourIndex = 23 - hoursAgo;
                                
                                if (hourIndex >= 0 && hourIndex < 24) {
                                    const value = parseFloat(point.value.doubleValue || point.value.intValue || 0);
                                    metricArray[hourIndex] = (metricArray[hourIndex] || 0) + value;
                                }
                            }
                        });
                    }
                });
            });
            
            return hoursData;
            
        } catch (error) {
            if (window.logger) {
                window.logger.error('Error fetching hourly Firestore data:', error);
            }
            throw error;
        }
    }
    
    /**
     * Получить данные использования Firestore за последние 7 дней (по дням)
     * @param {string} projectId - Firebase Project ID
     * @param {string} accessToken - Google OAuth токен
     * @returns {Promise<Object>} - Объект с reads, writes, deletes массивами по дням
     */
    static async getFirestoreDailyData(projectId, accessToken) {
        try {
            const [reads, writes, deletes] = await Promise.allSettled([
                this.getFirestoreMetrics(projectId, accessToken, 'read_count', null, 7),
                this.getFirestoreMetrics(projectId, accessToken, 'write_count', null, 7),
                this.getFirestoreMetrics(projectId, accessToken, 'delete_count', null, 7)
            ]);
            
            // Проверяем на ошибку биллинга
            const billingError = [reads, writes, deletes].find(result => 
                result.status === 'rejected' && 
                result.reason && 
                result.reason.message === 'BILLING_REQUIRED'
            );
            
            if (billingError) {
                const error = new Error('Для просмотра метрик необходимо включить биллинг в Google Cloud Console');
                error.type = 'BILLING_REQUIRED';
                error.originalMessage = billingError.reason.originalMessage;
                throw error;
            }
            
            // Обрабатываем результаты (успешные и неуспешные)
            const readsData = reads.status === 'fulfilled' ? reads.value : [];
            const writesData = writes.status === 'fulfilled' ? writes.value : [];
            const deletesData = deletes.status === 'fulfilled' ? deletes.value : [];
            
            // Преобразуем данные в формат для графика (7 дней)
            const daysData = {
                reads: [],
                writes: [],
                deletes: [],
                timestamps: [],
                labels: []
            };
            
            // Генерируем метки для каждого дня (последние 7 дней)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            for (let i = 6; i >= 0; i--) {
                const day = new Date(today);
                day.setDate(day.getDate() - i);
                
                daysData.timestamps.push(day.toISOString());
                daysData.reads.push(0);
                daysData.writes.push(0);
                daysData.deletes.push(0);
                
                // Формируем метки
                if (day.getTime() === today.getTime()) {
                    daysData.labels.push('Сегодня');
                } else if (day.getTime() === today.getTime() - 86400000) {
                    daysData.labels.push('Вчера');
                } else {
                    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                    daysData.labels.push(dayNames[day.getDay()]);
                }
            }
            
            // Парсим данные из timeSeries
            const processTimeSeries = (timeSeries, targetArray) => {
                timeSeries.forEach(series => {
                    if (series.points && series.points.length > 0) {
                        series.points.forEach(point => {
                            if (point.interval && point.value) {
                                // Парсим время из API (может быть в разных форматах)
                                let pointTime;
                                if (typeof point.interval.endTime === 'string') {
                                    pointTime = new Date(point.interval.endTime);
                                } else if (point.interval.endTime.seconds) {
                                    pointTime = new Date(point.interval.endTime.seconds * 1000);
                                } else {
                                    pointTime = new Date(point.interval.endTime);
                                }
                                
                                // Нормализуем время до начала дня (локальное время)
                                const pointDay = new Date(pointTime.getFullYear(), pointTime.getMonth(), pointTime.getDate());
                                
                                // Находим индекс дня в массиве timestamps
                                const dayIndex = daysData.timestamps.findIndex(ts => {
                                    const tsDate = new Date(ts);
                                    const tsDay = new Date(tsDate.getFullYear(), tsDate.getMonth(), tsDate.getDate());
                                    // Сравниваем дни, игнорируя время
                                    return tsDay.getTime() === pointDay.getTime();
                                });
                                
                                if (dayIndex !== -1 && dayIndex < targetArray.length) {
                                    const value = parseFloat(
                                        point.value.doubleValue || 
                                        point.value.int64Value || 
                                        point.value.intValue || 
                                        0
                                    );
                                    targetArray[dayIndex] = (targetArray[dayIndex] || 0) + value;
                                }
                            }
                        });
                    }
                });
            };
            
            processTimeSeries(readsData, daysData.reads);
            processTimeSeries(writesData, daysData.writes);
            processTimeSeries(deletesData, daysData.deletes);
            
            return daysData;
            
        } catch (error) {
            if (window.logger) {
                window.logger.error('Error fetching daily Firestore data:', error);
            }
            throw error;
        }
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
            // Always log import errors
            if (window.logger) {
                window.logger.error('Error importing projects:', error);
            } else if (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1') {
                console.error('Error importing projects:', error);
            }
            return false;
        }
    }
}

// Создать глобальный экземпляр
export const projectManager = new ProjectManager();

