#!/bin/bash

# ====================================
# Скрипт развертывания админ-панели
# Сервер: 192.168.1.138
# ====================================

# Настройки сервера
SERVER_HOST="192.168.1.138"
SERVER_USER="ubuntu"
SERVER_PATH="/app/site/"

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Развертывание админ-панели v2.3${NC}"
echo -e "${BLUE}  Google Auth + Multi-Project${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Проверка наличия необходимых файлов
echo -e "${YELLOW}Проверка файлов...${NC}"

if [ ! -f "admin.html" ]; then
    echo -e "${RED}❌ Ошибка: admin.html не найден${NC}"
    exit 1
fi

if [ ! -d "css" ]; then
    echo -e "${RED}❌ Ошибка: папка css не найдена${NC}"
    exit 1
fi

if [ ! -d "js" ]; then
    echo -e "${RED}❌ Ошибка: папка js не найдена${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Все файлы на месте${NC}"
echo ""

# Запрос пароля
echo -e "${YELLOW}Введите пароль для пользователя ${SERVER_USER}:${NC}"
read -s SERVER_PASSWORD
echo ""

# Создание временного файла для sshpass
export SSHPASS="$SERVER_PASSWORD"

# Функция проверки доступности сервера
check_server() {
    echo -e "${YELLOW}Проверка подключения к серверу...${NC}"
    if ping -c 1 $SERVER_HOST &> /dev/null; then
        echo -e "${GREEN}✅ Сервер $SERVER_HOST доступен${NC}"
        return 0
    else
        echo -e "${RED}❌ Сервер $SERVER_HOST недоступен${NC}"
        return 1
    fi
}

# Функция загрузки файлов с помощью sshpass + scp
upload_files() {
    echo ""
    echo -e "${BLUE}Загрузка файлов на сервер...${NC}"
    
    # Создание директории на сервере (если не существует)
    echo -e "${YELLOW}Создание директории на сервере...${NC}"
    sshpass -e ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}"
    
    # Загрузка HTML файла
    echo -e "${YELLOW}Загрузка admin.html...${NC}"
    sshpass -e scp -o StrictHostKeyChecking=no admin.html ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
    
    # Загрузка CSS файлов
    echo -e "${YELLOW}Загрузка CSS файлов...${NC}"
    sshpass -e ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}css"
    sshpass -e scp -o StrictHostKeyChecking=no css/*.css ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}css/
    
    # Загрузка JS файлов
    echo -e "${YELLOW}Загрузка JS файлов...${NC}"
    sshpass -e ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}js"
    sshpass -e scp -o StrictHostKeyChecking=no js/*.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}js/
    
    # Загрузка PWA файлов
    echo -e "${YELLOW}Загрузка PWA файлов (manifest, service worker)...${NC}"
    sshpass -e scp -o StrictHostKeyChecking=no manifest.json ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
    sshpass -e scp -o StrictHostKeyChecking=no sw.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
    
    # Загрузка иконок (если существуют)
    if [ -d "icons" ]; then
        echo -e "${YELLOW}Загрузка иконок для PWA...${NC}"
        sshpass -e ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} "mkdir -p ${SERVER_PATH}icons"
        sshpass -e scp -o StrictHostKeyChecking=no icons/*.png ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}icons/ 2>/dev/null || echo -e "${YELLOW}⚠️ Иконки не найдены (нужно создать)${NC}"
    fi
    
# Загрузка документации
echo -e "${YELLOW}Загрузка документации...${NC}"
sshpass -e scp -o StrictHostKeyChecking=no README.md ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
sshpass -e scp -o StrictHostKeyChecking=no ИЗМЕНЕНИЯ.txt ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH} 2>/dev/null
sshpass -e scp -o StrictHostKeyChecking=no ИЗМЕНЕНИЯ_v2.1.txt ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH} 2>/dev/null
sshpass -e scp -o StrictHostKeyChecking=no ИЗМЕНЕНИЯ_v2.2_APPLE_HIG.txt ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
sshpass -e scp -o StrictHostKeyChecking=no ОПТИМИЗАЦИЯ_ОТЧЁТ.md ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
sshpass -e scp -o StrictHostKeyChecking=no APPLE_HIG_COMPLIANCE.md ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
sshpass -e scp -o StrictHostKeyChecking=no МОБИЛЬНАЯ_ВЕРСИЯ.md ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
sshpass -e scp -o StrictHostKeyChecking=no МОБИЛЬНАЯ_ВЕРСИЯ_СВОДКА.txt ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH} 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Файлы успешно загружены${NC}"
        return 0
    else
        echo -e "${RED}❌ Ошибка при загрузке файлов${NC}"
        return 1
    fi
}

# Функция загрузки файлов с помощью rsync (альтернатива)
upload_files_rsync() {
    echo ""
    echo -e "${BLUE}Загрузка файлов на сервер (rsync)...${NC}"
    
    sshpass -e rsync -avz --progress \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='.DS_Store' \
        --exclude='deploy.sh' \
        -e "ssh -o StrictHostKeyChecking=no" \
        ./ ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Файлы успешно загружены${NC}"
        return 0
    else
        echo -e "${RED}❌ Ошибка при загрузке файлов${NC}"
        return 1
    fi
}

# Проверка наличия sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}❌ sshpass не установлен${NC}"
    echo -e "${YELLOW}Установка:${NC}"
    echo -e "  macOS: brew install sshpass"
    echo -e "  Ubuntu: sudo apt-get install sshpass"
    echo ""
    echo -e "${YELLOW}Или используйте обычный scp (потребуется ввод пароля):${NC}"
    echo -e "  scp -r ./* ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}"
    exit 1
fi

# Основной процесс
check_server

if [ $? -eq 0 ]; then
    # Выбор метода загрузки
    echo ""
    echo -e "${YELLOW}Выберите метод загрузки:${NC}"
    echo "1) SCP (по умолчанию)"
    echo "2) RSYNC (быстрее, синхронизация)"
    read -p "Ваш выбор [1]: " choice
    choice=${choice:-1}
    
    if [ "$choice" = "2" ]; then
        upload_files_rsync
    else
        upload_files
    fi
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}=====================================${NC}"
        echo -e "${GREEN}  ✅ Развертывание завершено!${NC}"
        echo -e "${GREEN}=====================================${NC}"
        echo ""
        echo -e "${BLUE}Админ-панель доступна по адресу:${NC}"
        echo -e "  ${GREEN}http://${SERVER_HOST}:8080/admin.html${NC}"
        echo -e "${YELLOW}(Сервер использует порт 8080)${NC}"
        echo ""
    fi
else
    echo -e "${RED}Не удалось подключиться к серверу${NC}"
    exit 1
fi

# Очистка пароля из окружения
unset SSHPASS

