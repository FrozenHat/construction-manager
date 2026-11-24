# Construction Manager

Система управления строительными проектами: этапами работ, задачами, исполнителями, финансами, документами и уведомлениями.

Проект состоит из React-интерфейса и NestJS API и предназначен для нескольких ролей — шефа, администратора, менеджера, закупщика, бухгалтера, технадзора, клиента и исполнителя.

> Репозиторий находится в активной разработке. Инфраструктурные сервисы готовы к запуску через Docker Compose, а backend и frontend запускаются отдельно.

## Возможности

- Регистрация и вход по email или телефону;
- JWT-аутентификация и авторизация на основе ролей и permissions;
- Глобальные роли пользователей и роли участников внутри проекта;
- Создание, просмотр, изменение и удаление проектов;
- Ограничение просмотра проектов через участие в `project_members`;
- Этапы проекта и задачи внутри этапов;
- Назначение прорабов и исполнителей;
- Конечный автомат статусов задачи с историей изменений;
- Уведомления менеджеров, технадзоров и исполнителей;
- Контроль проекта: поступления, расходы и баланс в MDL;
- Согласование и утверждение транзакций;
- Загрузка документов в MinIO с версионированием;
- Временные ссылки на скачивание документов сроком до одного часа;
- Различные интерфейсы для исполнителя и управляющей команды.

## Роли

В интерфейсе и сервисах используются следующие роли:

- `chief` — шеф, глобальный доступ ко всем проектам;
- `admin` — администратор;
- `manager` — менеджер проекта;
- `buyer` — закупщик;
- `accountant` — бухгалтер;
- `supervisor` — технадзор;
- `client` — клиент;
- `contractor` — исполнитель.

Роли имеют разное сочетание прав. Например:

- шеф и администратор имеют доступ ко всем проектам;
- остальные пользователи видят проекты, где они являются активными участниками;
- менеджер и шеф могут управлять этапами и задачами;
- бухгалтер и руководящие роли имеют доступ к финансовой вкладке;
- исполнители видят в основном назначенные им задачи.

## Технологический стек

### Frontend

- React 19;
- TypeScript;
- Vite 8;
- React Router 7;
- TanStack React Query;
- Axios;
- React Hook Form;
- Zod;
- Tailwind CSS 4.

### Backend

- NestJS 11;
- TypeScript;
- TypeORM;
- PostgreSQL 15;
- Passport и JWT;
- Redis и Bull;
- bcrypt;
- class-validator и class-transformer;
- MinIO SDK;
- Multer;
- Telegraf для Telegram-интеграции;
- Jest и Supertest для тестов.

## Структура проекта

```text
backend/
  src/
    main.ts                 Bootstrap NestJS, CORS и глобальный ValidationPipe
    app.module.ts           Подключение БД, Redis и feature-модулей
    config/                 Заготовки конфигурации приложений
    modules/
      auth/                 Регистрация, вход, JWT, guards и permissions
      users/                Пользователи, роли и назначение прав
      projects/             Проекты и составы проектных команд
      stages/               Этапы строительства
      tasks/                Задачи и конечный автомат статусов
      transactions/         Баланс и финансовые операции
      documents/            Версионирование и хранение файлов в MinIO
      notifications/        Пользовательские уведомления
  test/                     Unit/E2E-конфигурация
  api-tests/                Дополнительные HTTP-тесты

frontend/
  src/
    main.tsx                Точка входа React-приложения
    App.tsx                 Маршрутизация и защита страниц
    api/client.ts           Axios-клиент с Bearer-токеном
    pages/                  Вход, регистрация, проекты, детали и админка
    components/             Модальные окна, уведомления и UI-компоненты
    types/                  Общие TypeScript-типы доменной модели

docker-compose.yml          PostgreSQL, Redis и MinIO
cloudflared.exe             Локальный бинарник Cloudflare Tunnel
package.json                Корневая зависимость Nest mapped-types
```

## Архитектура

Frontend обращается к backend через Axios-клиент `frontend/src/api/client.ts`. Все запросы отправляются на `/api`, а JWT берётся из `localStorage.accessToken` и передаётся в заголовке `Authorization: Bearer <token>`.

Backend запускает NestJS на порту `3000` по умолчанию и устанавливает глобальный префикс `/api`. Поэтому, например, контроллер проектов доступен как `/api/projects`.

Основной поток работы:

```text
React Router и страницы
  → Axios /api/*
  → JwtAuthGuard и PermissionsGuard
  → NestJS controllers
  → services
  → TypeORM entities
  → PostgreSQL

Задачи и этапы
  → TasksService / StagesService
  → история статусов задачи
  → уведомления участников

Документы
  → DocumentsService
  → MinIO Object Storage
  → временная ссылка для скачивания

Финансы
  → TransactionsService
  → приход/расход/баланс проекта
```

### Проекты и задачи

Проект содержит этапы, задачи, участников и транзакции. Доступ определяется двумя способами:

- роль `chief` или `admin` даёт глобальный доступ;
- обычный участник получает доступ, если существует активная запись в `project_members`.

Задача проходит через статусы:

```text
DRAFT
  → PENDING_APPROVAL
  → SENT_TO_CONTRACTOR
  → IN_PROGRESS
  → ON_REVIEW
  → ACCEPTED
  → COMPLETED

Дополнительно возможны PAUSED, REJECTED и CANCELLED,
а для PAUSED обязательно указывать причину materials, finance или quality.
```

Исполнитель принимает предложенную задачу, фиксирует собственную стоимость и переводит работу в процесс. После сдачи технадзор может принять работу или поставить задачу на доработку. После завершения сервис создаёт системные транзакции на гонорары исполнителя и прораба.

### Документы

При загрузке файла в MinIO сохраняются метаданные документа в PostgreSQL:

- проект и владелец документа;
- исходное имя файла;
- MIME-тип и размер;
- ключ объекта в MinIO;
- номер версии;
- автор загрузки;
- ссылка на предыдущую версию.

Повторная загрузка файла с тем же именем для того же владельца увеличивает номер версии.

## Быстрый запуск для разработки

### 1. Запустите инфраструктуру

Из корня репозитория:

```bash
docker compose up -d
```

Будут запущены:

- PostgreSQL на порту `5432`;
- Redis на порту `6379`;
- MinIO API на порту `9000`;
- MinIO Console на порту `9001`.

### 2. Настройте backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend слушает `http://localhost:3000`.

Минимальный пример `.env` для локального запуска должен соответствовать сервисам Compose:

```dotenv
NODE_ENV=development
PORT=3000
APP_NAME=construction-manager

DB_HOST=localhost
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=construction_db

REDIS_HOST=localhost
REDIS_PORT=6379

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=construction-documents

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
```

Значения PostgreSQL в примере соответствуют `docker-compose.yml`:

- база: `construction_db`;
- пользователь: `app_user`;
- пароль: `app_password`.

### 3. Запустите frontend

В отдельном терминале:

```bash
cd frontend
npm install
npm run dev
```

Vite использует обычный адрес разработки на порту `5173`, если порт не занят другим процессом.

Axios отправляет запросы на `/api`. Для работы в отдельных dev-серверах нужно настроить proxy в Vite или запускать frontend через reverse proxy, который перенаправит `/api` на backend.

## Основные frontend-маршруты

- `/` — публичная landing-страница;
- `/login` — вход;
- `/register` — регистрация;
- `/projects` — доступные пользователю проекты;
- `/projects/:id` — этапы, задачи, финансы и документы;
- `/admin` — назначение ролей пользователям.

Страницы `/projects`, `/projects/:id` и `/admin` закрыты проверкой наличия `accessToken` в `localStorage`. Дополнительные права проверяются backend-guards.

## API-маршруты

Основные контроллеры backend:

- `/api/auth/register` — регистрация;
- `/api/auth/login` — вход;
- `/api/auth/me` — текущий пользователь;
- `/api/users` — пользователи и роли;
- `/api/projects` — проекты;
- `/api/projects/:id/members` — участники проекта;
- `/api/projects/:projectId/stages` — этапы;
- `/api/projects/:projectId/stages/:stageId/tasks` — задачи;
- `/api/projects/:projectId/transactions` — транзакции;
- `/api/projects/:projectId/documents` — документы.

Все изменяющие endpoint’ы и защищённые endpoint’ы используют DTO и `ValidationPipe`. Неизвестные свойства запросов отклоняются из-за настроек `whitelist` и `forbidNonWhitelisted`.

## Проверка backend

Из каталога `backend` доступны:

```bash
npm run test
npm run test:e2e
npm run test:cov
npm run lint
npm run build
npm run start:prod
```

Скомпилированное production-приложение запускается из `backend/dist/main` после `npm run build`.

## Важные замечания

- `TypeORM synchronize: true` включён для разработки. Перед production-развертыванием следует отключить sync и создать миграции.
- В репозитории нет полноценного Dockerfile для backend/frontend; Docker Compose запускает только PostgreSQL, Redis и MinIO.
- Корневой `package.json` содержит только одну зависимость и не является главным скриптом запуска монорепозитория.
- Корневой README был заполнен впервые. README каталогов backend и frontend ранее представляли типовые шаблоны NestJS и Vite.
- Конфигурационные файлы `backend/src/config/*.ts` пока являются пустыми заглушками: основная конфигурация выполняется через `ConfigModule` и переменные окружения в `AppModule`.
- В Compose используются учебные учётные данные PostgreSQL и MinIO. Их необходимо заменить перед реальным deployment.
- `Vite allowedHosts: true` удобен для Cloudflare Tunnel, но небезопасен для открытого production-сервера.
- В некоторых местах frontend хранит данные пользователя в `localStorage`, а backend может проверять актуальные роли при запросах через токен и загрузку пользователя.
- Telegram-пакет подключён к backend, но конкретная доменная интеграция требует отдельной проверки и настройки webhook-токена.
- В репозитории не указана лицензия.

## Лицензия

Лицензия проекта пока не указана.
