#!/bin/bash

# Скрипт для быстрой настройки GitHub Pages
# Использование: ./setup-github.sh

echo "🚀 Настройка GitHub Pages для VS Apps Portfolio"
echo "================================================"
echo ""

# Проверка, инициализирован ли уже git
if [ -d ".git" ]; then
    echo "⚠️  Git репозиторий уже инициализирован"
    read -p "Продолжить? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Отменено"
        exit 1
    fi
else
    # Инициализация git
    echo "📦 Инициализация git репозитория..."
    git init
    git branch -M main
fi

# Добавление файлов
echo "📝 Добавление файлов..."
git add .

# Первый коммит
echo "💾 Создание первого коммита..."
git commit -m "Initial commit: Portfolio landing page for iOS apps

- Added 4 app showcases: Watch Weather, Homie, Floralia, CheckList
- Implemented responsive design with dark theme
- Added privacy policy and terms of service
- Included contact form integration
- Added app icons from Xcode projects"

echo ""
echo "✅ Локальный репозиторий готов!"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1️⃣  Создайте репозиторий на GitHub:"
echo "   • Вариант A (рекомендуется): zerikc.github.io"
echo "   • Вариант B: любое другое имя (например, ios-apps-portfolio)"
echo ""
echo "2️⃣  Привяжите удаленный репозиторий:"
echo "   git remote add origin https://github.com/zerikc/REPOSITORY_NAME.git"
echo ""
echo "3️⃣  Отправьте изменения:"
echo "   git push -u origin main"
echo ""
echo "4️⃣  Включите GitHub Pages (если вариант B):"
echo "   Settings → Pages → Source: main branch → Save"
echo ""
echo "5️⃣  Настройте контактную форму:"
echo "   • Зарегистрируйтесь на https://formspree.io"
echo "   • Замените YOUR_FORM_ID в index.html"
echo ""
echo "🌐 Ваш сайт будет доступен по адресу:"
echo "   • Вариант A: https://zerikc.github.io"
echo "   • Вариант B: https://zerikc.github.io/REPOSITORY_NAME"
echo ""
echo "================================================"
echo "Удачи с публикацией приложений! 🎉"

