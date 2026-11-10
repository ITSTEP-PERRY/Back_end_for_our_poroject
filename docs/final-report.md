# Підсумковий звіт: Perry, етап 7 — Security & Optimization

**Версія:** чернетка від 10.11.2026. **Увага:** це звіт за підтвердженою частиною етапу 7, **не фінальна звітність за всіма сімома етапами**; дані етапів 1–6 потрібно додати окремо.

## 1. Мета

Аудит GitHub/CI/CD/Docker/Kubernetes, посилення захисту, оцінка ресурсів, резервне копіювання та тестове відновлення, перевірка rollback, фінальне тестування і документація.

## 2. Підтверджені результати

| Критерій | Результат |
|---|---|
| Локальна інтеграція Git | Гілка `integration/stage7-main-review`, merge `1a1dc2f`, чистий working tree, push не виконувався |
| .NET / JWT / CORS | .NET 10 локальний кандидат; 25/25 unit tests; JWT production guard; CORS 8/8 HTTP тестів |
| Docker | AMD64 (~103MB), ARM64 (~99MB), обидві збірки PASS; Scout/Trivy 0 HIGH/CRITICAL на час перевірки |
| PostgreSQL Backup | Custom `.dump` 40919 байт, SHA-256 звірено |
| PostgreSQL Restore | В ізольованому PostgreSQL 16 відновлено 18 таблиць, 4 записи |
| Backend після Restore | Окремий API підключився до відновленої БД; `/api/health`: `database=up` |
| PVC | 2 Data Protection key files скопійовано, SHA-256 звірено, файловий Restore у Windows PASS; uploads — порожній каталог |
| Kubernetes config | Збережено 11 ресурсів і Nginx ConfigMap, 8 inline env values приховано; checksum PASS |
| Rollback | В окремому namespace збій через `ErrImageNeverPull`; `rollout undo` відновив робочий Deployment, 1/1 Ready |
| Optimization | CPU/RAM Requests/Limits та фактичні метрики й піки 24 год за Prometheus, див. `optimization.md` |

## 3. Незакриті питання

1. Перевірка історичних секретів Git і `Perry.bak`, ротація за потреби та узгодження дій з командою.
2. Перевірка GitHub branch protection, PR, `GHCR_LOGIN`, реальний Actions run/Registry/Cloud.
3. Grafana **періодично 2/3 Ready, остання перевірка 3/3 Ready** (10.11.2026): зафіксовано 576 подій timeout, 78 HTTP 503, readiness timeout 1 с; пікова RAM 368.85MiB при limit 384MiB. Pod proxy `/api/health` відповів `database=ok`, під час інциденту `Ready=False`, проте остання перевірка показала `Ready=True`; причина попередніх збоїв не доведена. Helm CLI на Windows відсутній; потрібні аналіз Helm values/плагінів, безпечне коригування і повторна перевірка readiness.
4. Навантажувальні та наскрізні Frontend → Backend → Database тести на відновленій базі.
5. Backup CronJob відсутній; retention/offsite/encryption політика й RTO/RPO не затверджені.
6. Повноцінний PVC restore усередині Kubernetes, перевірка Linux file ownership.
7. Докази повної CI/CD демонстрації; звіт за етапами 1–6 і фінальні скриншоти.

## 4. Висновок

Базові процедури безпеки, локального складання, сканування, резервного копіювання PostgreSQL, відновлення й ізольованого rollback підтверджені. Повне завершення дипломного етапу можливе після закриття питань у розділі 3 та фінальної демонстрації.

## 5. Матеріали

`architecture.md`, `security-audit.md`, `optimization.md`, `backup-restore.md`, `rollback.md`, `monitoring.md`. При фіналізації звіту додати дату, авторство, GitHub PR/Actions URLs і докази; не додавати приватні backup або секрети.
