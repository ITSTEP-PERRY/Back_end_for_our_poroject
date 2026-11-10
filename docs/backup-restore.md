# План Backup / Restore Perry — етап 7

**Станом на:** 10.11.2026. **Робочий контур:** `docker-desktop`, `perry-stage7` (PostgreSQL 16), **не** namespace `perry` (SQL Server).

## Об'єкти резервування

| Об'єкт | Реальний результат | Шлях до локальної копії |
|---|---|---|
| PostgreSQL `perry_stage7` | `pg_dump -Fc`, відновлення успішне | `$env:USERPROFILE\PerryBackups\stage7-private\postgres\perry_stage7-20261106-173833-5a123544.dump` |
| PVC `perry-api-uploads` | На час копіювання 0 файлів | `...\pvc-20261106-175141-815d6e2b\uploads` |
| PVC `perry-api-dpkeys` | 2 файли, сумарно з іншими PVC 5218 байт; SHA-256 збігається з джерелом | `...\pvc-20261106-175141-815d6e2b\dpkeys` |
| Kubernetes YAML/конфігурація | 11 ресурсів + 1 Nginx ConfigMap; 8 inline env values приховано | `...\k8s-config-20261106-180108-be45d3d3` |

Загальна коренева папка копій: `$env:USERPROFILE\PerryBackups\stage7-private`. Це приватні локальні копії за межами Pod і Git, **не** підтверджена віддалена/offsite копія. Папка має обмеження ACL; статус BitLocker 10.11.2026 повторно перевірити не вдалося (попередня перевірка підтверджувала захист). Усі копії можуть містити конфіденційні дані.

## PostgreSQL backup — перевірений результат

- Архів: **40919 байт**, `pg_dump` PostgreSQL **16.15**, формат custom.
- SHA-256: `92807c85c081a656f7cfa710a25df05abef042024c4878edfd48fbaeb3809256`.
- Архів скопійовано з Pod на Windows; збіг checksum з початковим файлом перевірено.
- `pg_restore` у новому ізольованому контейнері PostgreSQL 16: **PASS, 18 таблиць, 4 записи**.
- Perry API запущено з відновленою базою в ізольованій Docker-мережі: `/api/health` показав `database=up`. Тимчасові ресурси очищено.
- **Не проводився** комплексний Frontend → Backend → Database функціональний тест на цій відновленій БД.

## PVC Restore

Два файли Data Protection keys скопійовано і порівняно SHA-256 з Kubernetes-оригіналами. Файлова репетиція Restore в окремій папці Windows підтвердила 2/2 файли; uploads був порожнім. **Повне відновлення у новий Kubernetes PVC та перевірка власника/Unix permissions ще не виконані.** Копіювання працюючого PVC не є атомарним snapshot.

## Kubernetes конфігурації

JSON-знімки перевірено за SHA-256. Secrets не експортувалися, 8 inline environment values відредаговано. Дані файли призначені для аудиту, **не для безпосереднього `kubectl apply`**. Для повного recovery потрібні окремі джерела секретів і Git/Kubernetes manifests.

## Планова політика (потрібне узгодження)

- **Частота:** визначити RPO/частоту (наприклад, щоденні backup БД для демонстраційного staging); це пропозиція, ще не налаштована.
- **Зберігання:** призначити retention і захищене offsite storage з контролем доступу та шифруванням.
- **Валідація:** checksum, регулярний `pg_restore` у тестову БД, перевірка схеми й тестових записів, application smoke-test.
- **RTO:** заміряти фактичний час end-to-end recovery; у поточних логах не визначено.
- **Автоматизація:** наразі `0` CronJobs у `perry-stage7`; створити механізм лише після вибору надійного сховища поза Pod і погодження з командою.

## Безпека

Не передавати паролі в CLI-аргументах або Git; використовувати Kubernetes Secrets/кероване сховище. Не публікувати `.dump`, Data Protection keys та необроблені конфігурації. Не видаляти робочий PVC для демонстрації Restore.
