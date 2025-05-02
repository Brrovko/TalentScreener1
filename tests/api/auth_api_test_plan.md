# План тестирования API аутентификации

## 1. Регистрация пользователя

### Название
Тест регистрации нового пользователя администратором

### Описание
Проверка функциональности регистрации нового пользователя через API при наличии прав администратора

### Шаги
1. Авторизоваться как администратор
2. Отправить POST запрос на `/api/register` с данными нового пользователя

### Ожидаемый результат
- Код ответа: 201 Created
- Тело ответа содержит информацию о созданном пользователе без пароля
- Пользователь сохранен в базе данных

### Тестовый скрипт
```bash
# Сначала авторизуемся как администратор
ADMIN_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep connect.sid | awk '{print $7}')

# Используем полученную cookie для регистрации нового пользователя
curl -X POST http://localhost:5005/api/register \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$ADMIN_COOKIE" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "fullName": "Test User",
    "email": "test@example.com",
    "role": "user",
    "active": true
  }'
```

## 2. Логин пользователя

### Название
Тест авторизации пользователя

### Описание
Проверка возможности входа в систему с правильными учетными данными

### Шаги
1. Отправить POST запрос на `/api/login` с корректными учетными данными

### Ожидаемый результат
- Код ответа: 200 OK
- Тело ответа содержит информацию о пользователе без пароля
- Устанавливается сессионный cookie

### Тестовый скрипт
```bash
curl -v -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## 3. Неудачная попытка логина

### Название
Тест авторизации с неверными учетными данными

### Описание
Проверка отказа в доступе при вводе неверных учетных данных

### Шаги
1. Отправить POST запрос на `/api/login` с неверным паролем

### Ожидаемый результат
- Код ответа: 401 Unauthorized
- Сообщение об ошибке: "Invalid credentials"

### Тестовый скрипт
```bash
curl -v -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrong_password"
  }'
```

## 4. Получение информации о текущем пользователе

### Название
Тест получения информации о текущем пользователе

### Описание
Проверка получения данных авторизованного пользователя

### Шаги
1. Авторизоваться как пользователь
2. Отправить GET запрос на `/api/user`

### Ожидаемый результат
- Код ответа: 200 OK
- Тело ответа содержит информацию о текущем пользователе без пароля

### Тестовый скрипт
```bash
# Сначала авторизуемся как пользователь
USER_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' | grep connect.sid | awk '{print $7}')

# Получаем информацию о текущем пользователе
curl -X GET http://localhost:5005/api/user \
  -H "Cookie: connect.sid=$USER_COOKIE"
```

## 5. Получение списка всех пользователей

### Название
Тест получения списка всех пользователей администратором

### Описание
Проверка возможности получения списка всех пользователей администратором

### Шаги
1. Авторизоваться как администратор
2. Отправить GET запрос на `/api/users`

### Ожидаемый результат
- Код ответа: 200 OK
- Тело ответа содержит массив пользователей без паролей

### Тестовый скрипт
```bash
# Сначала авторизуемся как администратор
ADMIN_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep connect.sid | awk '{print $7}')

# Получаем список всех пользователей
curl -X GET http://localhost:5005/api/users \
  -H "Cookie: connect.sid=$ADMIN_COOKIE"
```

## 6. Обновление данных пользователя

### Название
Тест обновления данных пользователя администратором

### Описание
Проверка возможности обновления данных пользователя администратором

### Шаги
1. Авторизоваться как администратор
2. Отправить PATCH запрос на `/api/users/:id` с новыми данными

### Ожидаемый результат
- Код ответа: 200 OK
- Тело ответа содержит обновленную информацию о пользователе без пароля

### Тестовый скрипт
```bash
# Сначала авторизуемся как администратор
ADMIN_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep connect.sid | awk '{print $7}')

# Обновляем данные пользователя (предполагается, что ID пользователя = 2)
curl -X PATCH http://localhost:5005/api/users/2 \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$ADMIN_COOKIE" \
  -d '{
    "fullName": "Updated User Name",
    "active": false
  }'
```

## 7. Сброс пароля пользователя

### Название
Тест сброса пароля пользователя администратором

### Описание
Проверка возможности сброса пароля пользователя администратором

### Шаги
1. Авторизоваться как администратор
2. Отправить POST запрос на `/api/users/:id/reset-password` с новым паролем

### Ожидаемый результат
- Код ответа: 200 OK
- Сообщение об успешном сбросе пароля
- Пользователь может войти в систему с новым паролем

### Тестовый скрипт
```bash
# Сначала авторизуемся как администратор
ADMIN_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep connect.sid | awk '{print $7}')

# Сбрасываем пароль пользователя (предполагается, что ID пользователя = 2)
curl -X POST http://localhost:5005/api/users/2/reset-password \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$ADMIN_COOKIE" \
  -d '{
    "newPassword": "new_password123"
  }'
```

## 8. Изменение пароля текущего пользователя

### Название
Тест изменения пароля текущим пользователем

### Описание
Проверка возможности изменения собственного пароля авторизованным пользователем

### Шаги
1. Авторизоваться как пользователь
2. Отправить POST запрос на `/api/change-password` с текущим и новым паролями

### Ожидаемый результат
- Код ответа: 200 OK
- Сообщение об успешном изменении пароля
- Пользователь может войти в систему с новым паролем

### Тестовый скрипт
```bash
# Сначала авторизуемся как пользователь
USER_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' | grep connect.sid | awk '{print $7}')

# Изменяем пароль пользователя
curl -X POST http://localhost:5005/api/change-password \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=$USER_COOKIE" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "new_password456"
  }'
```

## 9. Выход из системы

### Название
Тест выхода из системы

### Описание
Проверка возможности выхода из системы и уничтожения сессии

### Шаги
1. Авторизоваться как пользователь
2. Отправить POST запрос на `/api/logout`

### Ожидаемый результат
- Код ответа: 200 OK
- Сессия пользователя уничтожена
- Повторные запросы с тем же cookie вернут 401 Unauthorized

### Тестовый скрипт
```bash
# Сначала авторизуемся как пользователь
USER_COOKIE=$(curl -c - -X POST http://localhost:5005/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' | grep connect.sid | awk '{print $7}')

# Выходим из системы
curl -X POST http://localhost:5005/api/logout \
  -H "Cookie: connect.sid=$USER_COOKIE"

# Проверяем, что сессия недействительна, пытаясь получить информацию о пользователе
curl -v -X GET http://localhost:5005/api/user \
  -H "Cookie: connect.sid=$USER_COOKIE"
```

## 10. Доступ к защищенным ресурсам без авторизации

### Название
Тест доступа к защищенным ресурсам без авторизации

### Описание
Проверка защиты ресурсов от неавторизованного доступа

### Шаги
1. Не авторизуясь, отправить GET запрос на `/api/user`

### Ожидаемый результат
- Код ответа: 401 Unauthorized
- Сообщение об ошибке: "Not authenticated"

### Тестовый скрипт
```bash
curl -v -X GET http://localhost:5005/api/user
``` 