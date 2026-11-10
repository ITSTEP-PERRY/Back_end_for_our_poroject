# Архітектура Perry — етап 7

**Статус:** робочий чернетковий опис для дипломного проєкту. **Оновлено:** 10.11.2026.

## Контур DevOps

Запланований ланцюг: GitHub → GitHub Actions CI/CD → Docker → Container Registry → Kubernetes → Monitoring & Logging. **Наскрізне виконання в GitHub Actions і публікацію в реєстрі в межах етапу 7 ще потрібно підтвердити.**

Локальна інтеграційна гілка: `integration/stage7-main-review`, коміт `1a1dc2f`; вихідна експериментальна гілка: `experiment/dotnet10-stage7`, `0a49778`. Коміт не відправлено на GitHub. CI-конфігурація містить збірку `linux/amd64` і `linux/arm64`; Actionlint успішно перевірив синтаксис. Наявність і права `GHCR_LOGIN` ще не перевірено.

## Kubernetes

Контекст: `docker-desktop`; namespace етапу 7: `perry-stage7`.

| Компонент | Kubernetes ресурс | Поточний образ / уточнення | Кількість |
|---|---|---|---|
| Backend | Deployment `perry-api` | `back_end_for_our_poroject-api:security-v4` (розгорнутий образ; **не плутати** з локальним .NET 10 кандидатом) | 1/1 |
| Frontend | Deployment `perry-frontend` | `perry-frontend:security-v3` | 1/1 |
| Database | StatefulSet `perry-postgres` | `postgres:16-alpine` | 1/1 |

Сервіси `perry-api` і `perry-frontend` мають тип ClusterIP (порт 8080); сервіс `perry-postgres` є headless, порт 5432. Присутня NetworkPolicy `allow-postgres-from-api`, яка вибирає Pod з міткою `app=perry-postgres`. Для доказу фактичного обмеження мережевого доступу потрібні додаткові негативні мережеві тести.

### Дані

| PVC | Розмір | Монтування |
|---|---:|---|
| `pgdata-perry-postgres-0` | 5Gi | Файли PostgreSQL |
| `perry-api-uploads` | 2Gi | `/app/wwwroot/uploads` |
| `perry-api-dpkeys` | 256Mi | `/home/app/.aspnet/DataProtection-Keys` |

Обидва `StorageClass` (`hostpath`, `standard`) використовують `rancher.io/local-path`, `ReclaimPolicy: Delete`. Поза життєвим циклом Pod зроблено копії бази, файлових PVC та конфігурацій (див. `backup-restore.md`).

### Спостережуваність

У namespace `monitoring` працюють Prometheus, Grafana, Alertmanager, Loki та Alloy. Прометеївські метрики CPU/RAM для `perry-stage7` доступні. `metrics-server` відсутній, тому `kubectl top` недоступний. 10.11.2026 Grafana періодично мала стан `2/3 Ready`, однак під час останньої перевірки всі три контейнери були Ready. Тривалу стабільність ще потрібно підтвердити.

## Відокремлений попередній namespace

`perry` — окремий контур із SQL Server (`perry-sql`), **не** PostgreSQL Stage 7. Під час відновлення й тестів не змінювався.

## Для фінального підтвердження

- Уточнити реальні зовнішні endpoints, ingress, DNS/TLS і Cloud; підтвердити актуальність діаграми фактично розгорнутому середовищу.
- Показати повний успішний CI/CD у GitHub, доступ до Container Registry й staging deployment.
- Узгодити з командою всі зміни, які впливають на спільну інфраструктуру.
