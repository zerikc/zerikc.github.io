# Настройка OAuth Client для Firebase Admin Panel

## Текущий OAuth Client ID
`974852900993-neldo0t6ldgo1qfpo51tfdkla9a0pvps.apps.googleusercontent.com`

## Необходимые настройки в Google Cloud Console

### 1. Authorized JavaScript Origins
⚠️ **КРИТИЧЕСКИ ВАЖНО**: Добавьте следующие origins для локальной разработки и продакшена:

```
http://localhost
http://localhost:3000
http://localhost:8080
https://zerikc.github.io
http://192.168.1.138
https://192.168.1.138
```

**Примечание**: В "JavaScript Origins" НЕ добавляйте завершающий слеш `/`!

### 2. Authorized Redirect URIs
⚠️ **ВАЖНО**: Для Google Identity Services **ОБЯЗАТЕЛЬНО** нужно добавить все эти redirect URIs:

```
http://localhost
http://localhost/
http://localhost:3000
http://localhost:3000/
http://localhost:8080
http://localhost:8080/
https://zerikc.github.io
https://zerikc.github.io/
https://zerikc.github.io/admin.html
http://192.168.1.138
http://192.168.1.138/
https://192.168.1.138
https://192.168.1.138/
```

**Примечание**: Google Identity Services использует popup, но всё равно требует правильной настройки redirect URIs.

### 3. Scopes (области доступа)
Убедитесь, что запрашиваемые области одобрены в OAuth Consent Screen:
- `https://www.googleapis.com/auth/cloud-platform`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

## Шаги настройки

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Выберите проект `firebase-476911`
3. Перейдите в **APIs & Services** → **Credentials**
4. Найдите OAuth Client ID `974852900993-neldo0t6ldgo1qfpo51tfdkla9a0pvps`
5. Нажмите **Edit** (Edit OAuth client)
6. Добавьте **Authorized JavaScript origins** (см. выше)
7. ⚠️ **ВАЖНО**: Добавьте **Authorized redirect URIs** (см. выше)
   - Сейчас у вас только `https://zerikc.github.io/oauth.php?provider=google`
   - Нужно добавить все URIs из списка выше
8. Сохраните изменения

## OAuth Consent Screen

Если запрошена проверка приложения:
1. Перейдите в **APIs & Services** → **OAuth consent screen**
2. Добавьте все необходимые scopes
3. Заполните описание приложения
4. Отправьте на проверку (если требуется)

## Тестирование

После настройки попробуйте авторизоваться:
1. Откройте `https://zerikc.github.io/admin.html`
2. Нажмите "Войти через Google"
3. Должна открыться popup с выбором аккаунта
4. После входа должны автоматически загрузиться ваши Firebase проекты

## Примечание

⚠️ **ВАЖНО**: Файл `client_secret_*.json` содержит секретный ключ и НЕ должен быть загружен в Git.
Он уже добавлен в `.gitignore`.

