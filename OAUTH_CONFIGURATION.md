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

### 4. Включение необходимых APIs
⚠️ **ВАЖНО**: Для автоматической загрузки проектов нужно включить следующие APIs в проекте `firebase-476911`:

1. Перейдите в **APIs & Services** → **Library**
2. Включите следующие APIs:
   - **Cloud Resource Manager API** (для списка проектов)
   - **Firebase Management API** (для проверки Firebase проектов)
   
**Как включить API:**
1. Найдите API по названию в поиске
2. Нажмите на API
3. Нажмите кнопку **Enable** (Включить)
4. Дождитесь активации

## Шаги настройки

### Шаг 1: Настройка OAuth Client

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

⚠️ **КРИТИЧЕСКИ ВАЖНО**: Настройте тип доступа!

1. Перейдите в **APIs & Services** → **OAuth consent screen**
2. Выберите **User type**:
   - **Internal** — только для пользователей вашей организации (требует Google Workspace)
   - **External** — для всех пользователей (рекомендуется для публичных приложений)
3. Заполните обязательные поля:
   - **App name**: `Firebase Admin Console`
   - **User support email**: ваш email
   - **Developer contact**: ваш email
4. Добавьте все необходимые scopes в разделе **Scopes**:
   - `https://www.googleapis.com/auth/cloud-platform`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
5. В разделе **Test users** добавьте email: `zerikc123@gmail.com`
6. **Save and Continue** через все шаги
7. Если приложение **External**, отправьте на проверку Google (при необходимости)

## Тестирование

После настройки попробуйте авторизоваться:
1. Откройте `https://zerikc.github.io/admin.html`
2. Нажмите "Войти через Google"
3. Должна открыться popup с выбором аккаунта
4. После входа должны автоматически загрузиться ваши Firebase проекты

## Примечание

⚠️ **ВАЖНО**: Файл `client_secret_*.json` содержит секретный ключ и НЕ должен быть загружен в Git.
Он уже добавлен в `.gitignore`.

