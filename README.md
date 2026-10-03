# Perry (Teslyar75)

Product API + **актуальная** Desktop-витрина (Figma) + Mobile (Expo).

Старый Razor-фронт **`Perry.Web` удалён** из репозитория. Не используйте командный `perry-front` / `main` — там старая витрина до полной Figma-переписи.

## Быстрый запуск с ярлыка (после clone)

1. Установите **[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)**, **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**, **[Node.js 18+](https://nodejs.org/)**.  
2. `git clone https://github.com/Teslyar75/My_Amazon2.git` → откройте папку клона.  
3. Дважды кликните **`Create-Shortcuts.cmd`** (или `Создать-ярлык.cmd`).  
4. Порядок запуска: **Perry API** → затем **Perry Desktop** и/или **Perry Mobile**.  

Если скрипт ярлыков ругался на кодировку — сделайте `git pull` и используйте именно **`Create-Shortcuts.cmd`** (ASCII, без поломки PowerShell).

| Ярлык / скрипт | Что | URL |
|----------------|-----|-----|
| **Perry API** · `start-api.cmd` | Postgres + Product API | http://localhost:5272/swagger |
| **Perry Desktop** · `start-desktop.cmd` | Витрина Figma (Vite) в `frontend/` | http://localhost:3000 |
| **Perry Mobile** · `start-mobile.cmd` | Expo Web в `mobile/` | http://localhost:8081 |

Инструкция API: [docs/инструкции/КАК-ЗАПУСКАТЬ-API.md](./docs/инструкции/КАК-ЗАПУСКАТЬ-API.md) · frontend: [frontend/README.md](./frontend/README.md)

---

Бэкенд: **ASP.NET Core 8** (`Perry.Domain` · `Perry.Infrastructure` · `Perry.Api`).  
UI: папки **`frontend/`** (React/Vite под Figma) и **`mobile/`** (Expo).

| | |
|--|--|
| **Доска Trello** | https://trello.com/b/bwEYs3Kq/itstep-perry |
| **Auth Service** | https://github.com/ITSTEP-PERRY/Backend-client |
| **Командный mirror API** | https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject |
| **Защита: Product API (без админки)** | **[project_defense/DEFENSE_BACKEND.md](./project_defense/DEFENSE_BACKEND.md)** |
| **Словарик аббревиатур** | [GLOSSARY-BACKEND.md](./project_defense/GLOSSARY-BACKEND.md) · [СЛОВАРИК-БЭКЕНД.md](./project_defense/СЛОВАРИК-БЭКЕНД.md) |

---

## Как читать (гайд для студента)

0. **Отчёт перед комиссией (бэкенд):** **[project_defense/DEFENSE_BACKEND.md](./project_defense/DEFENSE_BACKEND.md)** — архитектура, слайды, Trello Done, словарик в конце файла · индекс материалов защиты: [project_defense/README.md](./project_defense/README.md)  
1. **[docs/ГАЙД-ДЛЯ-СТУДЕНТА.md](./docs/ГАЙД-ДЛЯ-СТУДЕНТА.md)** — шаги, как собрать похожий проект  
2. Ниже — **вся документация по дням**, затем **по темам**, затем **скрины с описанием**  
3. Этапы целиком: **[docs/ХРОНИКА-РАБОТЫ.md](./docs/ХРОНИКА-РАБОТЫ.md)**  
4. Папки: `журнал/` · `инструкции/` · `стыки/` · `продукт/` · `screenshots/`
5. **Готовность (02.10):** [продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-02.md](./docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-02.md) · [ЧТО-ЕЩЁ-СДЕЛАТЬ.md](./docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md)

---

## 1. Документация по дням (журнал)

Единая лента: раньше «ИЗМЕНЕНИЯ» и «ОТЧЁТ» — одно и то же. Читать сверху вниз.

| Дата | Тема дня | Документ |
|------|----------|----------|
| **17.09.2026** | Каталог, PDP API, React-порт | [журнал/2026-09-17.md](./docs/журнал/2026-09-17.md) |
| 17.09.2026 | Личный кабинет (Wishlist / Orders / Settings) | [журнал/2026-09-17-account.md](./docs/журнал/2026-09-17-account.md) |
| **19.09.2026** | Спринт к защите (админка, PDP, Docker, smoke) | [журнал/2026-09-19.md](./docs/журнал/2026-09-19.md) |
| **25.09.2026** | AuthTokens, lightbox, корзина по JWT | [журнал/2026-09-25.md](./docs/журнал/2026-09-25.md) |
| 25.09.2026 | Admin Orders: фильтры и статистика | [журнал/2026-09-25-orders-stats.md](./docs/журнал/2026-09-25-orders-stats.md) |
| **26.09.2026** | Users вынесены в Auth; JWT; две линии фронта | [журнал/2026-09-26.md](./docs/журнал/2026-09-26.md) |
| 26.09.2026 | Срез деталей того же дня | [журнал/2026-09-26-срез.md](./docs/журнал/2026-09-26-срез.md) |
| **28.09.2026** | Seed заказов, reviews API, checkout, health, popular | [журнал/2026-09-28.md](./docs/журнал/2026-09-28.md) |
| 28.09.2026 | Срез backend-задач дня + CI | [журнал/2026-09-28-a03-a07.md](./docs/журнал/2026-09-28-a03-a07.md) |
| 28.09.2026 | Общий JWT-секрет Auth → Product | [журнал/2026-09-28-auth-95.md](./docs/журнал/2026-09-28-auth-95.md) |
| **29.09.2026** | Internal Auth, Reviews, Dev Admin | [журнал/2026-09-29.md](./docs/журнал/2026-09-29.md) |
| 29.09.2026 | PostgreSQL + admin orders | [журнал/2026-09-29-a08-a09.md](./docs/журнал/2026-09-29-a08-a09.md) |
| 29.09.2026 | Orders: last update / смена статуса | [журнал/2026-09-29-a10.md](./docs/журнал/2026-09-29-a10.md) |
| **30.09.2026** | SellerId, OrderNumber, письма по заказу | [журнал/2026-09-30-a11-a13.md](./docs/журнал/2026-09-30-a11-a13.md) |
| **01.10.2026** | Mobile Expo под Figma + CORS `:8081` | [журнал/2026-10-01.md](./docs/журнал/2026-10-01.md) |
| 01.10.2026 | Mobile: сверка окон с макетом | [журнал/2026-10-01-mobile-figma-1в1.md](./docs/журнал/2026-10-01-mobile-figma-1в1.md) |
| 01.10.2026 | Mobile: аудит ссылок и навигации | [журнал/2026-10-01-mobile-аудит.md](./docs/журнал/2026-10-01-mobile-аудит.md) |
| **02.10.2026** | DummyJSON: реальные фото витрин по разделам | [журнал/2026-10-02.md](./docs/журнал/2026-10-02.md) |
| 02.10.2026 | Готовность проекта + открытый бэклог | [готовность](./docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-02.md) · [бэклог](./docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md) |

Оглавление журнала: [docs/журнал/README.md](./docs/журнал/README.md).

---

## 2. Документация по темам

### Запуск и эксплуатация

| Документ | О чём |
|----------|--------|
| [инструкции/КАК-ЗАПУСКАТЬ-API.md](./docs/инструкции/КАК-ЗАПУСКАТЬ-API.md) | **Запуск этого репо (Product API)** |
| [инструкции/КАК-ЗАПУСКАТЬ.md](./docs/инструкции/КАК-ЗАПУСКАТЬ.md) | Desktop + Mobile витрина (ярлыки FE) |
| [инструкции/НАПОЛНЕНИЕ-ФОТО-DUMMYJSON.md](./docs/инструкции/НАПОЛНЕНИЕ-ФОТО-DUMMYJSON.md) | Как залить фото витрины у себя |
| [инструкции/docker.md](./docs/инструкции/docker.md) | PostgreSQL + docker compose + env |
| [инструкции/deployment.md](./docs/инструкции/deployment.md) | Деплой |
| [инструкции/ci-cd.md](./docs/инструкции/ci-cd.md) | CI/CD |
| [инструкции/troubleshooting.md](./docs/инструкции/troubleshooting.md) | Типовые сбои |
| [инструкции/Git-WORKFLOW.md](./docs/инструкции/Git-WORKFLOW.md) | Git |
| [инструкции/КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md](./docs/инструкции/КАК-ВЫПОЛНЯТЬ-ЗАДАНИЕ.md) | Запуск solution и разбор кода |
| [инструкции/SMOKE-ЗАЩИТА.md](./docs/инструкции/SMOKE-ЗАЩИТА.md) | Чеклист демо |
| [инструкции/SMTP-НАСТРОЙКА.md](./docs/инструкции/SMTP-НАСТРОЙКА.md) | Stub → Gmail App Password |
| [инструкции/РЕЧЬ-SMTP-ДЕМО.md](./docs/инструкции/РЕЧЬ-SMTP-ДЕМО.md) | Речь на защиту |
| [инструкции/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md](./docs/инструкции/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md) | Forgot / Reset / Finishing |
| [инструкции/TRELLO-TODO.md](./docs/инструкции/TRELLO-TODO.md) | Статусы работ на доске |
| [инструкции/КОМАНДА-КАРТОЧКИ-TRELLO.md](./docs/инструкции/КОМАНДА-КАРТОЧКИ-TRELLO.md) | Обзор доски команды |

### Стыки Auth ↔ Product

| Документ | О чём |
|----------|--------|
| [стыки/СТЫКИ-МИКРОСЕРВИСОВ.md](./docs/стыки/СТЫКИ-МИКРОСЕРВИСОВ.md) | Полный разбор стыков |
| [стыки/РЕШЕНИЕ-СТЫКОВ-С-КОДОМ.md](./docs/стыки/РЕШЕНИЕ-СТЫКОВ-С-КОДОМ.md) | Что куда вставить + код |
| [стыки/AUTH-INTEGRATION.md](./docs/стыки/AUTH-INTEGRATION.md) | JWT / claims / FE |
| [стыки/СТЫКИ-ЛОКАЛЬНО.md](./docs/стыки/СТЫКИ-ЛОКАЛЬНО.md) | Локальный статус |
| [стыки/СООБЩЕНИЕ-В-ЧАТ-СТЫКИ.md](./docs/стыки/СООБЩЕНИЕ-В-ЧАТ-СТЫКИ.md) | Текст в командный чат |
| [стыки/ЗАПРОС-ВЛАДУ-97.md](./docs/стыки/ЗАПРОС-ВЛАДУ-97.md) | Internal Auth (запрос) |
| [стыки/ВОПРОСЫ-КОМАНДЕ.md](./docs/стыки/ВОПРОСЫ-КОМАНДЕ.md) | Открытые вопросы |

### Каталог, кабинет, админка, mobile

| Документ | О чём |
|----------|--------|
| [продукт/architecture.md](./docs/продукт/architecture.md) | Архитектура API |
| [продукт/КАТАЛОГ-ТОВАРОВ-АРХИТЕКТУРА.md](./docs/продукт/КАТАЛОГ-ТОВАРОВ-АРХИТЕКТУРА.md) | Product + Variants |
| [продукт/КАТЕГОРИИ.md](./docs/продукт/КАТЕГОРИИ.md) | Categories API / seed |
| [продукт/ACCOUNT-КАБИНЕТ.md](./docs/продукт/ACCOUNT-КАБИНЕТ.md) | Wishlist / Orders / Settings |
| [продукт/ОТЗЫВЫ-ПОКУПАТЕЛЕЙ.md](./docs/продукт/ОТЗЫВЫ-ПОКУПАТЕЛЕЙ.md) | Модель и API отзывов |
| [продукт/НАША-АДМИНКА.md](./docs/продукт/НАША-АДМИНКА.md) | React `/admin` |
| [продукт/ADMIN-КОМАНДА.md](./docs/продукт/ADMIN-КОМАНДА.md) | Админка команды |
| [продукт/РЕШЕНИЕ-ФРОНТ-АДМИН.md](./docs/продукт/РЕШЕНИЕ-ФРОНТ-АДМИН.md) | Разделение с командой |
| [продукт/СВЕСТИ-ДВЕ-ЛИНИИ.md](./docs/продукт/СВЕСТИ-ДВЕ-ЛИНИИ.md) | Figma-порт vs вторая линия фронта |
| [продукт/МОБИЛЬНОЕ-ПРИЛОЖЕНИЕ-REACT.md](./docs/продукт/МОБИЛЬНОЕ-ПРИЛОЖЕНИЕ-REACT.md) | План Expo / RN |
| [продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-02.md](./docs/продукт/ГОТОВНОСТЬ-ПРОЕКТА-2026-10-02.md) | Срез готовности + Trello (репо-источники) |
| [продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md](./docs/продукт/ЧТО-ЕЩЁ-СДЕЛАТЬ.md) | Открытый бэклог и зачем каждая задача |

### Корень docs + скрины (оглавления)

| Документ | О чём |
|----------|--------|
| [docs/ГАЙД-ДЛЯ-СТУДЕНТА.md](./docs/ГАЙД-ДЛЯ-СТУДЕНТА.md) | Методичка |
| [docs/ХРОНИКА-РАБОТЫ.md](./docs/ХРОНИКА-РАБОТЫ.md) | Хроника этапов |
| [docs/README.md](./docs/README.md) | Оглавление папок |
| [docs/screenshots/README.md](./docs/screenshots/README.md) | Все скрины витрины / auth / Account |
| [docs/screenshots/sprint-2026-09-19/README.md](./docs/screenshots/sprint-2026-09-19/README.md) | Спринт 19.09 |
| [`project_defense/`](./project_defense/) | Схемы архитектуры к защите |

---

## 3. Быстрый запуск

### Product API

```bash
cp .env.example .env
docker compose up -d postgres
dotnet run --project src/Perry.Api --launch-profile http
```

- Swagger: http://localhost:5272/swagger  
- Health: http://localhost:5272/api/health  

### Витрина (perry-front)

| Ярлык | URL |
|-------|-----|
| **Perry Desktop** | http://localhost:3000 |
| **Perry Mobile** | http://localhost:8081 |

`powershell -ExecutionPolicy Bypass -File .\Install-Perry-Shortcuts.ps1`  
Нужен API на **`:5272`**. Секреты — только в локальном `.env`.

---

## 4. Скрины спринта 19.09.2026 (с описанием)

Сводка дня: [журнал/2026-09-19.md](./docs/журнал/2026-09-19.md)

### 01 · 404 Product not found

![404 Product not found](./docs/screenshots/sprint-2026-09-19/01-404-product-not-found.png)

Товар не найден — Browse catalog / Go to home.

### 02 · Admin Products

![Admin Products](./docs/screenshots/sprint-2026-09-19/02-admin-products.png)

Список товаров + фильтр Category / Search.

### 03 · Admin Categories

![Admin Categories](./docs/screenshots/sprint-2026-09-19/03-admin-categories.png)

Корневые категории, Active, создание «+».

### 04 · Admin Reviews

![Admin Reviews](./docs/screenshots/sprint-2026-09-19/04-admin-reviews.png)

Модерация: All / Hidden / Visible.

### 05 · Admin Orders

![Admin Orders](./docs/screenshots/sprint-2026-09-19/05-admin-orders.png)

Список заказов Date / Customer / Status / Total.

### 07 · Admin Products — category dropdown

![Admin Products category dropdown](./docs/screenshots/sprint-2026-09-19/07-admin-products-category-dropdown.png)

Иерархия категорий в тулбаре.

### 08 · Admin Products — фильтр Streaming

![Admin Products filtered](./docs/screenshots/sprint-2026-09-19/08-admin-products-filter-streaming.png)

Отфильтрованный список (Roku Express 4K+).

### 09 · Admin Users — Active

![Admin Users Active](./docs/screenshots/sprint-2026-09-19/09-admin-users-filters.png)

Активные пользователи, ellipsis на длинных email.

### 10 · Admin Orders — детали

![Admin Order details](./docs/screenshots/sprint-2026-09-19/10-admin-orders-details.png)

Состав заказа + смена Status.

### 11 · Admin Reviews — Hide

![Admin Review Hide](./docs/screenshots/sprint-2026-09-19/11-admin-reviews-moderate-hide.png)

Скрыть отзыв с витрины (Hide / Delete).

### 12 · Account — My orders

![My orders](./docs/screenshots/sprint-2026-09-19/12-account-my-orders.png)

Кабинет: заказы Ordered / Ready for pickup.

### 13 · Admin Reviews — Approve

![Admin Review Approve](./docs/screenshots/sprint-2026-09-19/13-admin-reviews-approve.png)

Вернуть скрытый отзыв (Approve / Delete).

### 14 · Account — Order details

![Order details modal](./docs/screenshots/sprint-2026-09-19/14-account-order-details-modal.png)

Модалка: позиции, Total, How to cancel.

### 15 · Account — Order details #2

![Order details modal 2](./docs/screenshots/sprint-2026-09-19/15-account-order-details-modal-2.png)

Второй заказ, Total $178.

### 16 · Account — Change email

![Change email modal](./docs/screenshots/sprint-2026-09-19/17-account-change-email-modal.png)

Смена email: пароль + 6-digit code + Send code.

---

## 5. Скрины витрины / auth / legal

Подробно: [docs/screenshots/README.md](./docs/screenshots/README.md)  
Forgot / Reset / Finishing: [инструкции/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md](./docs/инструкции/ВОССТАНОВЛЕНИЕ-ПАРОЛЯ.md)

| Экран | Описание | Превью |
|-------|----------|--------|
| **Главная (витрина)** | Hero Sale, категории, Trending deals | ![Home storefront](./docs/screenshots/26-home-storefront.png) |
| **Product Page** | Галерея, About, buy-box, Product details | ![Product Page](./docs/screenshots/27-product-page.png) |
| **Каталог + фильтры** | Material / Size / Color, grid | ![Catalog filters](./docs/screenshots/28-catalog-filters.png) |
| **Customer reviews** | Сводка, tags, Helpful / Translate | ![Reviews](./docs/screenshots/29-product-reviews.png) |
| **Related + footer** | Fashion: sale и подвал | ![Related footer](./docs/screenshots/32-product-related-footer.png) |
| **Terms** | Terms and conditions | ![Terms](./docs/screenshots/33-terms.png) |
| **License** | License agreement | ![License](./docs/screenshots/30-license.png) |
| **Privacy** | Privacy policy | ![Privacy](./docs/screenshots/31-privacy.png) |
| Sign in (старый кадр) | Ранний кадр входа | ![Login](./docs/screenshots/03-login.png) |
| **Welcome back** | Вход покупателя (Email / Password) | ![Welcome back](./docs/screenshots/12-auth-login.png) |
| Welcome back — ошибки | Пустые поля: сообщения валидации | ![Login errors](./docs/screenshots/13-auth-login-errors.png) |
| **Create account** | Регистрация Email + Password + Confirm | ![Create account](./docs/screenshots/14-auth-register.png) |
| Create account — ошибки | Неверный email / слабый пароль / mismatch | ![Register errors](./docs/screenshots/15-auth-register-errors.png) |
| **Send code** (пусто) | 6 полей кода после 3 fails Login | ![Send code](./docs/screenshots/16-auth-verify-empty.png) |
| Send code — ввод + таймер | Код введён, Resend 0:59 | ![Send code filled](./docs/screenshots/17-auth-verify-filled.png) |
| Send code — ошибка | Incorrect code, try again | ![Send code error](./docs/screenshots/18-auth-verify-error.png) |
| **Forgot password** | Ввод email для сброса пароля | ![Forgot password](./docs/screenshots/19-auth-forgot.png) |
| Forgot password — ошибка | Wrong or invalid email address | ![Forgot error](./docs/screenshots/20-auth-forgot-error.png) |
| **Reset password** | New password + Repeat password | ![Reset password](./docs/screenshots/21-auth-reset.png) |
| Reset password — ошибки | Necessary to continue / Passwords must match | ![Reset error](./docs/screenshots/22-auth-reset-error.png) |
| **Finishing touches** | First name + Last name после Register | ![Finishing](./docs/screenshots/23-auth-finishing.png) |
| Finishing touches — ошибки | First/Last name is required | ![Finishing error](./docs/screenshots/24-auth-finishing-error.png) |
| **Congratulations!** | Успех регистрации или сброса пароля | ![Success](./docs/screenshots/25-auth-success.png) |

---

## 6. Скрины Account (14)

Срез: [журнал/2026-09-17-account.md](./docs/журнал/2026-09-17-account.md) · описания: [screenshots/README.md](./docs/screenshots/README.md)

| # | Экран | Файл |
|---|--------|------|
| A01 | Wishlist | [01-wishlist.png](./docs/screenshots/account/01-wishlist.png) |
| A02 | Wishlist — Remove confirm | [02-wishlist-remove-modal.png](./docs/screenshots/account/02-wishlist-remove-modal.png) |
| A03 | My orders | [03-my-orders.png](./docs/screenshots/account/03-my-orders.png) |
| A04 | Account settings — photo tip | [04-account-settings-photo-tip.png](./docs/screenshots/account/04-account-settings-photo-tip.png) |
| A05 | Order details (Ordered) | [05-order-details-modal.png](./docs/screenshots/account/05-order-details-modal.png) |
| A06 | Order details (Received) | [06-order-details-received.png](./docs/screenshots/account/06-order-details-received.png) |
| A07 | Account settings | [07-account-settings.png](./docs/screenshots/account/07-account-settings.png) |
| A08 | Change name | [08-change-name-modal.png](./docs/screenshots/account/08-change-name-modal.png) |
| A09 | Change password | [09-change-password-modal.png](./docs/screenshots/account/09-change-password-modal.png) |
| A10 | Change password — validation | [10-change-password-validation.png](./docs/screenshots/account/10-change-password-validation.png) |
| A11 | Change email | [11-change-email-modal.png](./docs/screenshots/account/11-change-email-modal.png) |
| A12 | Change email — validation | [12-change-email-validation.png](./docs/screenshots/account/12-change-email-validation.png) |
| A13 | Log out? | [13-logout-confirm.png](./docs/screenshots/account/13-logout-confirm.png) |
| A14 | Delete account? | [14-delete-account-confirm.png](./docs/screenshots/account/14-delete-account-confirm.png) |

![Wishlist](./docs/screenshots/account/01-wishlist.png)

![My orders](./docs/screenshots/account/03-my-orders.png)

![Account settings](./docs/screenshots/account/07-account-settings.png)

![Change password](./docs/screenshots/account/09-change-password-modal.png)

![Change email](./docs/screenshots/account/11-change-email-modal.png)

![Delete account](./docs/screenshots/account/14-delete-account-confirm.png)
