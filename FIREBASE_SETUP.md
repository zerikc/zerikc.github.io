# Настройка Firebase для админ-панели

## 1. Получение конфигурации Firebase

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект (или создайте новый)
3. Перейдите в **Project Settings** (⚙️ → Project settings)
4. Прокрутите вниз до раздела **Your apps**
5. Выберите веб-приложение или создайте новое (иконка `</>`)
6. Скопируйте конфигурацию из блока `const firebaseConfig = {...}`

## 2. Настройка конфигурации

Откройте файл `js/firebase-config.js` и замените значения на ваши:

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 3. Настройка Firebase Authentication

1. В Firebase Console перейдите в **Authentication** → **Sign-in method**
2. Включите следующие методы входа:
   - **Email/Password** (Enable)
   - **Google** (опционально, но рекомендуется)

## 4. Создание пользователей-администраторов

1. Перейдите в **Authentication** → **Users**
2. Нажмите **Add user**
3. Укажите email и пароль для администратора
4. Повторите для всех администраторов

## 5. Настройка Firestore Security Rules

⚠️ **ВАЖНО:** Настройте правила безопасности для защиты данных!

Перейдите в **Firestore Database** → **Rules** и замените правила на одно из следующих:

### Вариант 1: Только для авторизованных пользователей
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Вариант 2: Только для конкретных администраторов (РЕКОМЕНДУЕТСЯ)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid in ['ADMIN_UID_1', 'ADMIN_UID_2'];
    }
  }
}
```

**Как получить UID администратора:**
1. Перейдите в **Authentication** → **Users**
2. Найдите нужного пользователя
3. Скопируйте его **User UID**

### Вариант 3: По домену email
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.email.matches('.*@yourdomain\\.com$');
    }
  }
}
```

## 6. Размещение на GitHub Pages

1. Закоммитьте все файлы:
   ```bash
   git add admin.html js/admin.js js/firebase-config.js css/admin.css
   git commit -m "Add Firebase admin panel"
   git push
   ```

2. Админ-панель будет доступна по адресу:
   `https://YOUR_USERNAME.github.io/admin.html`

## 7. Использование админ-панели

1. Откройте админ-панель в браузере
2. Войдите с помощью созданного административного аккаунта
3. Введите название коллекции Firestore
4. Нажмите "Загрузить" для просмотра документов
5. Используйте кнопки для добавления, редактирования и удаления документов

## Безопасность

⚠️ **Важные замечания:**

- Firebase конфигурация (apiKey) видна всем на фронтенде - это нормально
- Реальная защита данных обеспечивается через Firestore Security Rules
- Обязательно настройте правила безопасности перед использованием в продакшене
- Не используйте правила `allow read, write: if true` в продакшене
- Регулярно проверяйте логи Firebase на подозрительную активность

## Дополнительные настройки (опционально)

### Ограничение доступа только с GitHub Pages домена

В Firestore Rules можно добавить проверку referer (менее надежно, но дополнительный уровень):

```
allow read, write: if request.auth != null && 
  request.headers.get('referer').contains('github.io');
```

### Настройка CORS (если нужно)

Обычно не требуется для GitHub Pages, но если возникают проблемы с CORS, проверьте настройки в Firebase Console.

## Поддержка

При возникновении проблем проверьте:
- Консоль браузера на ошибки JavaScript
- Firebase Console → Authentication → Users (убедитесь, что пользователь создан)
- Firestore Rules (правила должны разрешать доступ)
- Сеть браузера (проверьте запросы к Firebase)

