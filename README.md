# Portfolio Landing Page - VS Apps

Современный сайт-портфолио для iOS приложений, готовый для размещения на GitHub Pages.

## 📱 Приложения

Сайт представляет четыре iOS приложения:

1. **Watch Weather** - Приложение погоды для Apple Watch и iPhone
2. **Homie** - Управление умным домом через HomeKit
3. **Floralia** - Отслеживание женского здоровья
4. **CheckList** - Управление задачами и чек-листами

## 🎨 Особенности

- ✨ Современный минималистичный дизайн в стиле Apple
- 📱 Полностью адаптивная верстка (mobile-first)
- 🌙 Темная тема с градиентными акцентами
- ⚡ Плавные анимации и переходы
- 🎯 SEO-оптимизация
- ♿ Доступность (accessibility)
- 📄 Политика конфиденциальности и условия использования

## 🚀 Быстрый старт

### Локальный просмотр

Просто откройте `index.html` в браузере:

```bash
cd portfolio-site
open index.html  # macOS
# или
start index.html  # Windows
```

Или используйте локальный сервер:

```bash
# Python 3
python3 -m http.server 8000

# Node.js (если установлен http-server)
npx http-server

# Затем откройте http://localhost:8000
```

## 📦 Развертывание на GitHub Pages

### Вариант 1: Репозиторий username.github.io (рекомендуется)

1. Создайте новый репозиторий с именем `zerikc.github.io`
2. Склонируйте репозиторий и скопируйте файлы:

```bash
git clone https://github.com/zerikc/zerikc.github.io.git
cd zerikc.github.io

# Скопируйте все файлы из portfolio-site
cp -r /Users/zerikc/Project/portfolio-site/* .

# Добавьте и закоммитьте изменения
git add .
git commit -m "Initial commit: Portfolio landing page"
git push origin main
```

3. Ваш сайт будет доступен по адресу: `https://zerikc.github.io`

### Вариант 2: Отдельный репозиторий

1. Создайте новый репозиторий, например `ios-apps-portfolio`
2. Склонируйте и загрузите файлы:

```bash
git clone https://github.com/zerikc/ios-apps-portfolio.git
cd ios-apps-portfolio

# Скопируйте файлы
cp -r /Users/zerikc/Project/portfolio-site/* .

# Закоммитьте
git add .
git commit -m "Initial commit"
git push origin main
```

3. Включите GitHub Pages:
   - Перейдите в Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/root`
   - Сохраните

4. Сайт будет доступен: `https://zerikc.github.io/ios-apps-portfolio`

## 📝 Настройка контактной формы

Форма обратной связи настроена на использование [Formspree](https://formspree.io/).

### Настройка:

1. Зарегистрируйтесь на [formspree.io](https://formspree.io/)
2. Создайте новую форму
3. Скопируйте ID формы
4. Откройте `index.html` и замените:

```html
<form ... action="https://formspree.io/f/YOUR_FORM_ID" ...>
```

на

```html
<form ... action="https://formspree.io/f/ваш_реальный_id" ...>
```

### Альтернативы Formspree:

- [FormSubmit](https://formsubmit.co/) - бесплатно
- [Basin](https://usebasin.com/) - бесплатно до 100 сообщений/месяц
- [Netlify Forms](https://www.netlify.com/products/forms/) - если хостинг на Netlify

## 🖼️ Добавление иконок приложений

Иконки приложений должны быть размещены в папке `images/`:

```bash
images/
├── weather-icon.png      # 1024x1024px
├── homie-icon.png        # 1024x1024px
├── floralia-icon.png     # 1024x1024px
├── checklist-icon.png    # 1024x1024px
├── apple-touch-icon.png  # 180x180px
└── favicon.png           # 32x32px
```

### Извлечение иконок из Xcode проектов:

```bash
# Найдите AppIcon в Assets.xcassets каждого проекта
# Экспортируйте версию 1024x1024px

# Watch Weather
# /Users/zerikc/Project/Watch_Weather/Watch_Weather/Assets.xcassets/AppIcon.appiconset/

# Homie
# /Users/zerikc/Project/Home/Resources/Assets.xcassets/AppIcon.appiconset/

# Floralia
# /Users/zerikc/Project/Floralia/Floralia/Assets.xcassets/AppIcon.appiconset/

# CheckList
# /Users/zerikc/Project/CheckList_iOS/check list/Assets.xcassets/AppIcon.appiconset/
```

## 🎨 Кастомизация

### Цвета

Отредактируйте CSS переменные в `css/styles.css`:

```css
:root {
    --primary-color: #007AFF;      /* Основной цвет */
    --secondary-color: #5856D6;    /* Вторичный цвет */
    --accent-color: #FF375F;       /* Акцентный цвет */
    /* ... */
}
```

### Контактная информация

Обновите email и другие контакты в файлах:
- `index.html` (секция contact и footer)
- `privacy.html` (раздел контактов)
- `terms.html` (раздел контактов)

### Метатеги для SEO

Обновите в `index.html`:

```html
<meta property="og:url" content="https://zerikc.github.io">
<meta property="og:image" content="https://zerikc.github.io/images/og-image.png">
```

## 📊 Аналитика (опционально)

Для добавления Google Analytics, вставьте перед закрывающим `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🔧 Структура проекта

```
portfolio-site/
├── index.html              # Главная страница
├── privacy.html            # Политика конфиденциальности
├── terms.html              # Условия использования
├── README.md               # Этот файл
├── css/
│   └── styles.css          # Все стили
├── js/
│   └── script.js           # JavaScript
└── images/                 # Изображения и иконки
    ├── weather-icon.png
    ├── homie-icon.png
    ├── floralia-icon.png
    ├── checklist-icon.png
    ├── apple-touch-icon.png
    └── favicon.png
```

## ✅ Чек-лист перед публикацией

- [ ] Добавлены все иконки приложений в `images/`
- [ ] Настроена контактная форма (Formspree ID)
- [ ] Обновлены URL в Open Graph метатегах
- [ ] Проверена работа всех ссылок
- [ ] Протестирована адаптивность на мобильных
- [ ] Добавлен favicon
- [ ] Проверена орфография и грамматика
- [ ] Обновлены контактные данные
- [ ] (Опционально) Добавлена аналитика

## 🌐 Использование для App Store

После публикации сайта, используйте URL в App Store Connect:

- **Marketing URL:** `https://zerikc.github.io`
- **Privacy Policy URL:** `https://zerikc.github.io/privacy.html`
- **Support URL:** `https://zerikc.github.io#contact`

## 📱 Тестирование

Протестируйте сайт на:

- [ ] iPhone Safari
- [ ] iPad Safari
- [ ] macOS Safari
- [ ] Chrome (desktop)
- [ ] Firefox (desktop)

Инструменты для тестирования:
- [Responsive Design Mode](https://developer.chrome.com/docs/devtools/) в Chrome DevTools
- [BrowserStack](https://www.browserstack.com/) для тестирования на реальных устройствах
- [PageSpeed Insights](https://pagespeed.web.dev/) для оптимизации

## 🔒 Безопасность

- ✅ Все внешние ссылки используют `rel="noopener"`
- ✅ Нет встроенных скриптов (inline scripts)
- ✅ HTTPS используется автоматически на GitHub Pages
- ✅ Форма защищена от спама через Formspree

## 📄 Лицензия

© 2025 Владислав Сидельников. Все права защищены.

Сайт предназначен для представления iOS приложений в App Store.

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

- 📧 Email: support@vsapps.ru
- 💼 GitHub: [@zerikc](https://github.com/zerikc)

## 🎉 Готово!

Ваш сайт готов к публикации. После размещения на GitHub Pages он будет доступен пользователям и подходит для использования в качестве URL при публикации приложений в App Store.

---

**Дата создания:** 16 октября 2025  
**Технологии:** HTML5, CSS3, Vanilla JavaScript  
**Хостинг:** GitHub Pages

