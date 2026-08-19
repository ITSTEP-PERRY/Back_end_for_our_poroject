# Скриншоты Perry (для README)

Скриншоты рабочей витрины и админки (`http://localhost:5122`).  
Картинки товаров в seed — placeholder с picsum.photos (для демо бэкенда).

---

## 1. Главная страница

**Файл:** [`01-home.png`](./01-home.png)  
**URL:** `/`

![Главная](./01-home.png)

Hero «Everything you love, delivered», блок Shop by category, Trending deals. Шапка: поиск, Catalog, Sign in, Register, Cart.

---

## 2. Каталог (Product List)

**Файл:** [`02-catalog.png`](./02-catalog.png)  
**URL:** `/Products`

![Каталог](./02-catalog.png)

Сайдбар фильтров: Category, Brand, Price, Customer reviews. Сетка товаров со скидками, рейтингом, бейджами Best seller / Out of stock.

---

## 3. Вход покупателя

**Файл:** [`03-login.png`](./03-login.png)  
**URL:** `/Account/Login`

![Sign in](./03-login.png)

UI из perry-front: «Welcome back», Email / Password, Stay signed in, кнопка Log in, иллюстрация справа. Layout `_AuthLayout` (без старой Amazon-шапки).

---

## 4. Админ — Dashboard

**Файл:** [`04-admin-dashboard.png`](./04-admin-dashboard.png)  
**URL:** `/Admin`

![Admin Dashboard](./04-admin-dashboard.png)

Статистика (товары, категории, out of stock, отзывы). Формы «Создать категорию» и «Создать товар». Ссылки: Заказы, Пользователи, В магазин, Выход.

---

## 5. Админ — списки категорий и товаров

**Файл:** [`05-admin-catalog.png`](./05-admin-catalog.png)  
**URL:** `/Admin` (нижняя часть)

![Admin catalog tables](./05-admin-catalog.png)

Таблица категорий (Deactivate) и товаров (Edit / Archive).

---

## 6. Админ — пользователи

**Файл:** [`06-admin-users.png`](./06-admin-users.png)  
**URL:** `/Admin/Users`

![Admin Users](./06-admin-users.png)

Список пользователей: Name, Email, Login, Role, Registered (seed Admin).

---

## 7. Карточка товара (PDP)

**Файл:** [`07-product-details.png`](./07-product-details.png)  
**URL:** `/Products/Details/{id}`

![Product details](./07-product-details.png)

Галерея, About product, цена/скидка, Add to cart («Added to cart»), specs (Brand, Color, Weight). Корзина в шапке с бейджем.

---

## 8. Корзина (обновление количества)

**Файл:** [`08-cart-update.png`](./08-cart-update.png)  
**URL:** `/Cart`

![Cart update](./08-cart-update.png)

Сообщение «Количество обновлено», Qty / Update / Remove, Order summary, Proceed to checkout, блок Recently viewed.

---

## 9. Профиль

**Файл:** [`09-profile.png`](./09-profile.png)  
**URL:** `/Account/Profile`

![Profile](./09-profile.png)

Данные аккаунта, правка Name/Email, Save changes, Delete account, Recent orders.

---

## 10. Рекомендации на PDP

**Файл:** [`10-related-products.png`](./10-related-products.png)  
**URL:** `/Products/Details/...` (блоки внизу)

![Related products](./10-related-products.png)

Секции «You may also like» и «Best sellers in …» с бейджами скидки / Out of stock.

---

## 11. Корзина (несколько позиций)

**Файл:** [`11-cart-full.png`](./11-cart-full.png)  
**URL:** `/Cart`

![Full cart](./11-cart-full.png)

Несколько товаров, итог Items / Total, checkout, Recently viewed под корзиной.

---

## 12. Welcome back (вход)

**Файл:** [`12-auth-login.png`](./12-auth-login.png)  
**URL:** `/Account/Login`

![Welcome back](./12-auth-login.png)

Отдельное окно входа: «Welcome back» / «Login into your account», Email + Password, Stay signed in, Forgot password?, кнопка Log in, ссылка Sign Up, иллюстрация справа.

---

## 13. Welcome back — ошибки валидации

**Файл:** [`13-auth-login-errors.png`](./13-auth-login-errors.png)  
**URL:** `/Account/Login` (пустой submit)

![Login validation errors](./13-auth-login-errors.png)

Красные лейблы и рамки. Под Email: «Wrong or invalid email address». Под Password: «Incorrect password».

---

## 14. Create account (регистрация)

**Файл:** [`14-auth-register.png`](./14-auth-register.png)  
**URL:** `/Account/Register`

![Create account](./14-auth-register.png)

Отдельное окно регистрации в том же дизайне: «Create account» / «Shop in the marketplace while traveling», Email, Password, Confirm password, Continue, Log in, PERRY Terms and Conditions.

---

## 15. Create account — ошибки валидации

**Файл:** [`15-auth-register-errors.png`](./15-auth-register-errors.png)  
**URL:** `/Account/Register` (пустой Continuе)

![Register validation errors](./15-auth-register-errors.png)

Email: «Wrong or invalid email adress». Password: правила сложности (8+ символов, upper/lower/digit). Confirm: «Passwords must match».

---

## 16. Send code — пустые поля

**Файл:** [`16-auth-verify-empty.png`](./16-auth-verify-empty.png)  
**URL:** `/Account/VerifyCode?email=...` (после 3 неудачных Login)

![Send code empty](./16-auth-verify-empty.png)

Начальное состояние экрана подтверждения email: заголовок «Send code», подзаголовок «Enter the code to confirm your email», шесть пустых квадратных полей для цифр, ссылка **Send code** (повторная отправка), кнопка **Continue**, Back слева, иллюстрация справа (тот же Perry auth layout).

---

## 17. Send code — код введён, таймер Resend

**Файл:** [`17-auth-verify-filled.png`](./17-auth-verify-filled.png)  
**URL:** `/Account/VerifyCode`

![Send code filled](./17-auth-verify-filled.png)

В поля введён пример кода `123456`. Под полями таймер **Resend code 0:59** (повторная отправка недоступна до конца минуты). Кнопка Continue активна.

---

## 18. Send code — неверный код

**Файл:** [`18-auth-verify-error.png`](./18-auth-verify-error.png)  
**URL:** `/Account/VerifyCode` (неверный Continue)

![Send code error](./18-auth-verify-error.png)

После неверного кода: красное сообщение **Incorrect code, try again**, поля в состоянии ошибки, доступна ссылка **Resend code**. Поток и stub SMTP: [ПРОДЕЛАННАЯ-РАБОТА.md](../ПРОДЕЛАННАЯ-РАБОТА.md) §11 п.6.
