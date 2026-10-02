# [MB01] Backend instruction — как подключить мобилку к бэку

**Для кого:** Илона (мобильный клиент)  
**Карточка Trello:** [MB01](https://trello.com/c/aSQ3QDvN) · список To Do  
**Репо Илоны:** [ITSTEP-PERRY/perry-mobile](https://github.com/ITSTEP-PERRY/perry-mobile) (React Native CLI)  
**Эталон у нас:** `mobile/` в [perry-front](https://github.com/ITSTEP-PERRY/perry-front) (Expo) — те же URL и контракты  
**Связанные:** [AUTH-INTEGRATION.md](../стыки/AUTH-INTEGRATION.md) · [MOBILE-BACKEND-И-ССЫЛКИ.md](./MOBILE-BACKEND-И-ССЫЛКИ.md) · [Гайд по нашей мобилке](./ГАЙД-ИЛОНА-НА-ОСНОВЕ-НАШЕЙ-МОБИЛКИ.md)

**Принцип:** бэкенд **не переписываем**. Auth и Product уже готовы как HTTP API. Нужен клиент: `fetch` + JWT + абсолютные URL картинок.

---

## 0. Два бэкенда (не путать)

| Роль | Где | Что даёт экранам |
|------|-----|------------------|
| **Auth Service** | Azure: `https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io` · репо [Backend-client](https://github.com/ITSTEP-PERRY/Backend-client) | Login, Register, `/auth/me`, forgot-password → **JWT** |
| **Product API** | Локально **`http://localhost:5272`** · репо [Back_end_for_our_poroject](https://github.com/ITSTEP-PERRY/Back_end_for_our_poroject) | Каталог, PDP, корзина, заказы, wishlist, reviews |

- Все пути Product начинаются с **`/api/...`** (например `/api/products`).  
- Все пути Auth тоже под **`/api/...`** на хосте Auth (например `/api/auth/login`).  
- После логина: заголовок `Authorization: Bearer <token>` на **оба** сервиса, где нужна авторизация (корзина merge, checkout, wishlist, orders, me).

**Скоуп MB01 (из названия карточки):**

1. **LogIn** → Auth  
2. **Main page (товары)** → Product (категории + ленты товаров)  
3. **Product list** → Product (`GET /api/products?...`)  
4. **Product page** → Product (`GET /api/products/{id}`)

Остальное (Cart / Checkout / Orders) — следующий шаг, контракты ниже в §8 для ориентира.

---

## 1. Перед кодом: проверить, что бэк живой

### Product (обязателен для Main / List / PDP)

1. Поднять Product API так, как принято у команды (Docker / `dotnet run` — см. их README). Порт витрины: **5272**.  
2. В браузере или curl:

```http
GET http://localhost:5272/api/health
GET http://localhost:5272/api/products?page=1&pageSize=1
GET http://localhost:5272/api/categories
```

Ожидание: JSON, статус 200. Если пустой каталог — попросить у Product-команды seed / DummyJSON (фото).

### Auth (обязателен для Login)

```http
GET https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io/api/health
```

(если health нет — достаточно успешного `POST /api/auth/login` тестовым аккаунтом из чата команды.)

### Эмулятор / устройство → localhost

| Где крутится приложение | `PRODUCT_URL` |
|-------------------------|---------------|
| iOS Simulator | `http://localhost:5272` |
| Android Emulator | `http://10.0.2.2:5272` |
| Физический телефон | `http://<твой-LAN-IP>:5272` (ПК и телефон в одной Wi‑Fi; firewall пускает 5272) |

Auth остаётся на Azure HTTPS — с телефона ходит нормально.

**Android cleartext:** для `http://` в `AndroidManifest` / network security config разрешить cleartext к Product (иначе эмулятор молча режет HTTP).

---

## 2. Конфиг в проекте Илоны (RN CLI)

Expo у нас использует `EXPO_PUBLIC_*`. У тебя CLI — достаточно своего `.env` + `react-native-config` **или** простой `src/config.ts` (не коммитить секреты; URL Auth/Product — не секреты):

```ts
// src/config.ts
export const PRODUCT_URL =
  __DEV__ ? "http://10.0.2.2:5272" : "https://<prod-product-если-будет>";
export const AUTH_URL =
  "https://perry-auth-service.orangeplant-910928aa.swedencentral.azurecontainerapps.io";
```

Для iOS Simulator в DEV подставь `http://localhost:5272` (или ветка `Platform.OS`).

---

## 3. Минимальный API-клиент

Скопируй идею с эталона: `mobile/src/api/client.ts` + `token.ts` + `types.ts` + `index.ts` в perry-front.

### 3.1. Хранение JWT

- Android/iOS: **Keychain / EncryptedSharedPreferences** или `@react-native-async-storage/async-storage` на MVP; лучше позже `react-native-keychain`.  
- Ключ: например `perry_access_token`.  
- При каждом запросе: если токен есть → `Authorization: Bearer …`.

### 3.2. `apiFetch` (схема)

```ts
async function apiFetch<T>(
  path: string,
  init: RequestInit & { base?: "product" | "auth" } = {},
): Promise<T> {
  const base = init.base === "auth" ? AUTH_URL : PRODUCT_URL;
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/api") ? path : `/api${path.startsWith("/") ? path : `/${path}`}`}`;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = await getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message || data.title)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data as T;
}
```

Нормализация путей: удобно вызывать `apiFetch("/products")` → реально `…/api/products`.

### 3.3. Картинки

Product часто отдаёт:

- абсолютный `https://…` (DummyJSON / CDN) — использовать как есть;  
- относительный `/uploads/...` — **склеить** с `PRODUCT_URL`:

```ts
function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${PRODUCT_URL}${path}`;
}
```

В `<Image source={{ uri: resolveMediaUrl(item.imageUrl) }} />` без абсолютного URI фото не откроется.

---

## 4. LogIn (Auth)

### Endpoint

```http
POST {AUTH_URL}/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "login": "user@example.com",
  "password": "..."
}
```

Тело как у web/Expo: шлём и `email`, и `login` (Auth принимает логин или почту — см. [API.md Auth](https://github.com/ITSTEP-PERRY/Backend-client/blob/main/docs/API.md)).

### Ответ (нормализовать поля)

Разные оболочки возможны. В эталоне:

```ts
token = raw.token ?? raw.accessToken ?? raw.access_token ?? raw.data?.accessToken
user  = raw.user ?? raw.data?.user ?? raw
```

Пользователь:

| Поле UI | Откуда |
|---------|--------|
| id | `id` / `userId` |
| name | `name` / `fullName` / `firstName+lastName` / email |
| email | `email` |
| login | `login` / email |
| role | `role` / `roleId` / `roles[0]` → `"User"` \| `"Admin"` |

### После успешного login

1. `await setToken(token)`  
2. Сохранить user в Context / Zustand  
3. Перейти на Main (Home)

### Проверка сессии при старте приложения

```http
GET {AUTH_URL}/api/auth/me
Authorization: Bearer <token>
```

401 → очистить токен, показать Login.

### Register (рядом, не в названии MB01, но тот же слой)

```http
POST {AUTH_URL}/api/auth/register
{ "email", "password", "name", "login" }
```

Ответ — как login (token + user).

### Пример вызова с экрана

```ts
const res = await apiFetch("/auth/login", {
  method: "POST",
  base: "auth",
  body: JSON.stringify({ email: login, login, password }),
});
await setToken(normalizeAuth(res).token);
```

**Не** ходи за login на Product `:5272` — там пользователей нет.

---

## 5. Main page (товары)

Экран главной: категории + 1–2 ленты товаров (как Figma Main / как наш `HomeScreen`).

### Запросы (параллельно)

```http
GET {PRODUCT_URL}/api/categories
GET {PRODUCT_URL}/api/products?pageSize=12&sort=newest
GET {PRODUCT_URL}/api/products?pageSize=12&sort=rating
```

В коде эталона:

```ts
const [cats, newest, byRating] = await Promise.all([
  categoriesApi.tree(),                           // GET /categories
  productsApi.list({ pageSize: 12, sort: "newest" }),
  productsApi.list({ pageSize: 12, sort: "rating" }),
]);
```

### `CategoryDto` (дерево)

```ts
{
  id, name, slug, description?, imageUrl?, iconUrl?,
  parentCategoryId?, subCategories?: CategoryDto[]
}
```

Клик по категории → Product list с `categoryId=<id>`.

### Элемент ленты (`ProductListItem`)

| Поле | UI |
|------|----|
| `id` | навигация на PDP |
| `name`, `brand` | текст |
| `price`, `oldPrice`, `discountPercent` | цена / скидка |
| `averageRating`, `reviewCount` | звёзды |
| `imageUrl` | `resolveMediaUrl` |
| `isBestSeller`, `status` | бейджи (по желанию) |

Ответ списка:

```ts
{
  page, pageSize, total, totalPages,
  items: ProductListItem[],
  facets?: { brands, fabrics, sizes, colors }
}
```

На Main facets не обязательны.

### Состояния UI

- loading → spinner  
- error (сеть / 0) → текст + Retry  
- pull-to-refresh → те же три запроса  

JWT на Main **не обязателен** (каталог публичный).

---

## 6. Product list (каталог)

```http
GET {PRODUCT_URL}/api/products?page=1&pageSize=20&sort=newest&categoryId=...&search=...
```

### Query-параметры (все опциональны)

| Параметр | Пример | Назначение |
|----------|--------|------------|
| `page`, `pageSize` | `1`, `20` | пагинация |
| `sort` | `newest`, `rating`, … | сортировка (как на web) |
| `categoryId` | guid | фильтр категории |
| `search` | строка | поиск |
| `brands`, `fabrics`, `sizes`, `colors` | повторяющиеся query | facets |
| `minPrice`, `maxPrice`, `minRating` | числа | фильтры |

Массивы: `?brands=Nike&brands=Adidas` (`URLSearchParams.append`).

### UI-поток

1. Первый заход: `page=1`, показать `items`.  
2. Infinite scroll / «Ещё»: `page++`, `append`.  
3. Смена sort / filters / search / category → снова `page=1`, заменить список.  
4. Facets из ответа → панель фильтров (можно отложить после MVP списка).

Клик по карточке → Product page с `id`.

Эталон: `mobile/src/screens/ProductsScreen.tsx`.

---

## 7. Product page (PDP)

```http
GET {PRODUCT_URL}/api/products/{id}
```

### Важные поля `ProductDetail`

| Поле | UI |
|------|----|
| `name`, `brand`, `sku` | шапка |
| `price`, `oldPrice`, `discountPercent` | цена |
| `description` | описание |
| `stockQuantity`, `status` | наличие |
| `averageRating`, `reviewCount` | рейтинг |
| `images[]` | `{ id, url, isPrimary, isVideo, altText? }` → галерея, `resolveMediaUrl(url)` |
| `attributes[]` | `{ name, value }` |
| `aboutItems[]` | аккордеоны `{ title, description }` |
| `reviews[]` | отзывы на PDP |
| `related[]`, `saleRelated[]` | «похожие» / sale — те же `ProductListItem` |

### Поведение

- Смена `id` в навигации → новый `GET`, сброс галереи/qty.  
- Loading / error обязательны.  
- «Add to cart» — уже Cart API (§8); для MB01 достаточно кнопки-заглушки или сразу `POST /api/cart/add`.

Эталон: `mobile/src/screens/ProductScreen.tsx`.

---

## 8. Что дальше (не блокер MB01, но тот же клиент)

### Корзина (нужен `sessionId` гостя)

Сгенерируй UUID один раз, храни рядом с токеном (`perry_cart_session`).

```http
GET  /api/cart?sessionId=...
POST /api/cart/add?sessionId=...   { "productId", "quantity" }
PUT  /api/cart/quantity?sessionId=... { "productId", "quantity" }
DELETE /api/cart/item/{productId}?sessionId=...
POST /api/cart/merge   { "sessionId" }   // после login, с Bearer
```

### Wishlist / Orders (нужен Bearer)

```http
GET/POST/DELETE /api/wishlist...
GET /api/orders
POST /api/orders/checkout  { sessionId, shippingAddress?, paymentType?, recipientName? }
```

---

## 9. Чеклист приёмки MB01

- [ ] Product `:5272` отвечает `/api/products`  
- [ ] Auth Azure: login возвращает token  
- [ ] Экран Login: ошибка при неверном пароле; успех → токен сохранён → Main  
- [ ] Main: видны категории и карточки с **фото**  
- [ ] Product list: пагинация / смена категории / search (хотя бы одно)  
- [ ] Product page: галерея, цена, related кликабельны  
- [ ] Android emulator: URL `10.0.2.2`, cleartext разрешён  
- [ ] Без хардкода чужих секретов JWT в репо  

---

## 10. Типичные ошибки

| Симптом | Причина |
|---------|---------|
| Network / failed fetch на Android | `localhost` вместо `10.0.2.2`; cleartext |
| CORS в логах | на native CORS нет; если тестируешь в RN Web — нужен proxy как у Expo Metro |
| 401 на `/auth/me` | протух/битый token → logout |
| Пустые картинки | забыли `resolveMediaUrl` для `/uploads/...` |
| Login 404 на `:5272` | login шлётся на Product, а надо на Auth |
| Пустой каталог | Product без seed — не баг мобилки |

---

## 11. Куда смотреть код (эталон)

В клоне perry-front (или спросить у Product/Front команду ссылку на ветку):

| Файл | Зачем |
|------|--------|
| `mobile/src/api/client.ts` | URL Product/Auth, Bearer, ошибки |
| `mobile/src/api/index.ts` | `authApi`, `productsApi`, `categoriesApi` |
| `mobile/src/api/types.ts` | DTO |
| `mobile/src/api/media.ts` | картинки |
| `mobile/src/api/token.ts` | JWT + cart session |
| `mobile/src/auth/AuthContext.tsx` | login / me / logout |
| `mobile/src/screens/LoginScreen.tsx` | UI login |
| `mobile/src/screens/HomeScreen.tsx` | Main |
| `mobile/src/screens/ProductsScreen.tsx` | list |
| `mobile/src/screens/ProductScreen.tsx` | PDP |

**Не копируй** admin, Vite-only proxy, Expo Router целиком — у тебя React Navigation Stack уже в зависимостях.

---

*Документ закрывает карточку [MB01](https://trello.com/c/aSQ3QDvN). Практический перенос экранов с нашей Expo-мобилки → твой RN CLI: [ГАЙД-ИЛОНА-НА-ОСНОВЕ-НАШЕЙ-МОБИЛКИ.md](./ГАЙД-ИЛОНА-НА-ОСНОВЕ-НАШЕЙ-МОБИЛКИ.md).*
