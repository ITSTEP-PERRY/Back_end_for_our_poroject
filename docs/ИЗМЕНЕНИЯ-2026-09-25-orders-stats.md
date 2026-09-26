# Изменения Perry — 25.09.2026 (вечер) · #93 Admin Orders stats

Срез фичи **Admin Orders: статусы, фильтры, агрегаты + compare %**.

Карточка Trello: [#93](https://trello.com/c/2OBrTUcb)

Репозитории:
- Backend: `feature/categories-facets-figma-storefront` (My_Amazon2 / Back_end_for_our_poroject)
- Frontend: `feature/figma-storefront-port` (perry-front)

---

## 1. Статусы заказа (`OrderStatus`)

| Значение (int) | Было | Стало |
|----------------|------|-------|
| 0 | Pending | **Ordered** |
| 1 | Paid | **Received** |
| 2 | Shipped | Shipped |
| 3 | Completed | **ReadyToPickup** |
| 4 | Cancelled | Cancelled |
| 5 | — | **Returned** (новый) |

Данные в БД не мигрируем по int — имена поменялись на месте. Новый заказ создаётся со статусом `Ordered`.

---

## 2. API `GET /api/orders/admin`

Query:
- `status` — один из enum
- `fromUtc` / `toUtc` — интервал по `OrderDateUtc` (`>= from`, `< to`)
- `orderId` — точный Guid или substring

Ответ:
```json
{
  "items": [ /* заказы */ ],
  "totalOrders": 12,
  "totalAmount": 1999.5,
  "statusCounts": {
    "Ordered": 2,
    "Received": 3,
    "Shipped": 1,
    "ReadyToPickup": 4,
    "Cancelled": 1,
    "Returned": 1
  },
  "totalOrderCompare": 20.0,
  "totalAmountCompare": -5.5,
  "period": { "fromUtc": "...", "toUtc": "..." },
  "comparePeriod": { "fromUtc": "...", "toUtc": "..." }
}
```

**Compare:** если заданы оба конца интервала — предыдущее окно той же длины сразу перед `fromUtc`.  
Формула: `((current - previous) / previous) * 100`. При `previous == 0`: `0` если current=0, иначе `100`.  
Без интервала: `totalOrderCompare` / `totalAmountCompare` = `null`.

Кнопка **This month** на FE задаёт `[startOfMonth, startOfNextMonth)` → сравнение с прошлым месяцем той же длины.

---

## 3. Frontend Admin `/admin/orders`

- Поиск по `orderId`
- Фильтр статуса + date range
- Чипы `statusCounts`
- Блок Orders / Total amount + % compare
- Select статуса заказа с новыми именами

Кабинет покупателя: лейблы статусов обновлены под новый enum (legacy Pending/Paid ещё мапятся).

---

## 4. Acceptance

- [x] Enum + UI/API новые имена
- [x] Фильтр status / from-to / orderId
- [x] statusCounts + totalAmount + totalOrders
- [x] totalOrderCompare / totalAmountCompare
- [x] Документация

---

*25.09.2026*
