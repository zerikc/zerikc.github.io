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

### Вариант 1: Админ + авторизованные пользователи (РЕКОМЕНДУЕТСЯ для админки + мобильных приложений)

Этот вариант позволяет:
- ✅ Админ-панели иметь полный доступ ко всем коллекциям
- ✅ Мобильным приложениям работать через Firebase Auth

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Проверка: является ли пользователь администратором
    function isAdmin() {
      return request.auth != null && 
        request.auth.uid in ['XMLAFdKRgJcTRNt0bdQepvD37vF3'];
    }
    
    // Разрешить доступ ко всем allowed_users
    match /allowed_users/{phone} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к чеклистам
    match /checklist/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к новой коллекции чеклистов (для разработки)
    match /checklist_new/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к истории изменений чеклиста
    match /checklist_history/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к контактам
    match /contacts/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к реестру информационных систем
    match /information_systems/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к заметкам
    match /notes/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Ночное расписание — чтение и запись
    match /night_duty_schedule/{document} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешение на чтение и запись документов отчётов смен
    match /shift_reports/{date} {
      allow read, write: if request.auth != null || isAdmin();
      match /reports/{reportId} {
        allow read, write: if request.auth != null || isAdmin();
      }
    }
    
    // Разрешить доступ к кастомным задачам
    match /custom_tasks/{userId} {
      allow read, write: if request.auth != null || isAdmin();
      match /tasks/{taskId} {
        allow read, write: if request.auth != null || isAdmin();
      }
    }
    
    // Разрешить доступ к новой коллекции чат-сессий
    match /chat_sessions/{document=**} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // AI CHAT - персональные чаты с AI
    match /ai_chat_sessions/{userId} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Старая коллекция сообщений чата (УСТАРЕЛА)
    match /chat_messages/{messageId} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Старая коллекция личных бесед (УСТАРЕЛА)
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к настройкам чата
    match /chat_settings/{userId} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Разрешить доступ к уведомлениям чата
    match /chat_notifications/{userId} {
      allow read, write: if request.auth != null || isAdmin();
    }
    
    // Справка приложения (только чтение для пользователей, запись для админа)
    match /help_sections/{document} {
      allow read: if true;  // Публичное чтение
      allow write: if isAdmin();  // Запись только админу
    }
  }
}
```

**Важно:** Замените `XMLAFdKRgJcTRNt0bdQepvD37vF3` на ваш UID администратора, если он другой.

### Вариант 2: Только для авторизованных пользователей
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

### Вариант 3: Только для конкретных администраторов

**Как получить UID администратора:**
1. Перейдите в **Authentication** → **Users**
2. Найдите нужного пользователя
3. Скопируйте его **User UID**

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

