# Защита — Ilona Movlyanova (Mobile Expo)

**Роль:** клиент покупателя на Expo / React Native: shell, Home, каталог, PDP, auth, cart/checkout (пакет #M00–#M10).  
**Стек:** Expo, SecureStore для JWT, тот же Product API + Auth.

---

### Чем ты занималась?

Mobile MVP: каркас Expo + api-клиент (#M01), навигация/меню (#M03), Home (#M04), каталог (#M05), PDP/медиа (#M06), стык с API на Android (#M09 In Progress).

### Почему Expo, а не отдельный бэкенд?

Бэкенд не переписываем: те же Auth и Product API. Mobile — тонкий клиент.

### Куда кладёте JWT?

SecureStore (не обычный AsyncStorage в проде). Logout очищает токен.

### Как эмулятор Android достучится до API на ПК?

`10.0.2.2` вместо `localhost`, либо LAN IP машины; Product CORS настроен под `:8081`/Expo.

### Как грузятся фото товаров?

Абсолютные URL из Product (часто CDN DummyJSON). Относительные `/uploads/...` склеиваем с origin API (`resolveMediaUrl`).

### Нужна ли админка на телефоне?

Нет. Admin и Internal Auth (#97) вне скоупа mobile.

### Что в MVP для демо?

Login → каталог + PDP с фото → (цель) cart → checkout → My orders. Reviews/wishlist — #M08.

### Чем mobile отличается от web Яны?

Отдельный UI под iPhone Figma, React Native; контракты API те же.

### Что зависит от бэка?

Точечно #M10: абсолютные URL картинок, pageSize, refresh/CORS для Expo Web. Каталог/JWT уже на Product/Auth.
