# 🚀 Быстрый старт

## Локальный просмотр

Откройте `index.html` в браузере или запустите локальный сервер:

```bash
cd /Users/zerikc/Project/portfolio-site
python3 -m http.server 8000
# Откройте http://localhost:8000
```

## Публикация на GitHub Pages (3 команды)

```bash
# 1. Запустите скрипт настройки
./setup-github.sh

# 2. Создайте репозиторий zerikc.github.io на GitHub, затем:
git remote add origin https://github.com/zerikc/zerikc.github.io.git

# 3. Отправьте на GitHub
git push -u origin main
```

Готово! Сайт будет доступен по адресу: `https://zerikc.github.io`

## Что нужно настроить после публикации

### 1. Контактная форма (5 минут)

1. Зарегистрируйтесь на [formspree.io](https://formspree.io/) (бесплатно)
2. Создайте новую форму
3. Скопируйте ID формы
4. В `index.html` найдите строку:
   ```html
   <form ... action="https://formspree.io/f/YOUR_FORM_ID" ...>
   ```
5. Замените `YOUR_FORM_ID` на ваш реальный ID
6. Закоммитьте и отправьте изменения:
   ```bash
   git add index.html
   git commit -m "Configure contact form"
   git push
   ```

### 2. URL для App Store

После публикации используйте эти URL в App Store Connect:

- **Marketing URL:** `https://zerikc.github.io`
- **Privacy Policy:** `https://zerikc.github.io/privacy.html`
- **Support URL:** `https://zerikc.github.io#contact`

## Структура проекта

```
portfolio-site/
├── index.html           # Главная страница (приложения)
├── privacy.html         # Политика конфиденциальности
├── terms.html           # Условия использования
├── css/styles.css       # Все стили
├── js/script.js         # Интерактивность
└── images/              # Иконки приложений
    ├── weather-icon.png
    ├── homie-icon.png
    ├── floralia-icon.png
    └── checklist-icon.png
```

## Что включено

✅ 4 приложения (Watch Weather, Homie, Floralia, CheckList)  
✅ Адаптивный дизайн (работает на всех устройствах)  
✅ Темная тема с градиентами  
✅ Политика конфиденциальности  
✅ Условия использования  
✅ Контактная форма  
✅ SEO оптимизация  
✅ Иконки приложений из Xcode проектов  

## Поддержка

Вопросы? → `support@vsapps.ru`

---

**Готово к публикации! 🎉**

