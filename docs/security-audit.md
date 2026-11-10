# Аудит безпеки Perry — етап 7

**Станом на:** 10.11.2026. **Статус:** частково завершений; невирішені питання зазначені явно.

## Проведені перевірки

| Область | Факт / результат |
|---|---|
| .NET Backend | Міграція локального кандидата на .NET 10; тести `25/25 PASS` |
| JWT | Виробничий guard забороняє `Jwt:SkipSignatureValidation`; регресійні тести PASS |
| CORS | Після інтеграції `origin/main` виконано 8/8 локальних HTTP перевірок; небажані Origin відхилено |
| Docker | Локальні AMD64 й ARM64 образи зібрано; ARM64 .NET 10 runtime запустився |
| Сканування | Docker Scout та Trivy для AMD64/ARM64: **0 HIGH / CRITICAL** на час сканування; не гарантує відсутності інших вразливостей |
| CI | `actionlint` PASS; наявні security-gates, multi-platform Buildx/QEMU; фактичний GitHub Actions run не підтверджено |
| Kubernetes API/Frontend/PostgreSQL | Pod-level `runAsNonRoot=true`, `seccompProfile=RuntimeDefault`; `automountServiceAccountToken=false`; container-level `allowPrivilegeEscalation=false`, `capabilities.drop=[ALL]` |
| Kubernetes Secrets | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` завантажуються через `SecretKeyRef`, без виведення їхніх значень |
| Мережа | ClusterIP для API/frontend, headless PostgreSQL, NetworkPolicy `allow-postgres-from-api` існує |
| Відновлення | PostgreSQL backup/restore і health-check API з відновленою БД успішні; тестовий rollback Kubernetes успішний |

Локальний API-кандидат запускається як непривілейований користувач UID 1654. Його runtime-поведінка тестувалася в ізольованій мережі Docker. Це **не тотожне** повній перевірці розгорнутого в Kubernetes кандидата.

## Виявлені проблеми й дії

1. **Потенційні секрети в історії Git.** Історичні `.env` і `Perry.bak` залишалися в комітах/гілках; видалення файлу з поточного HEAD не стирає історію. Потрібно спільно перевірити валідність секретів, відкликати/ротувати їх за потреби й погодити очищення історії. Жодного force-push без рішення команди.
2. **`GHCR_LOGIN` в CI.** Перевірити існування секрету, мінімальні права та безпечне використання токена. Push/PR поки не виконано.
3. **GitHub repo policy.** Ще перевірити захист `main`, PR review rules, обов'язкові checks, доступи учасників і сторонніх користувачів.
4. **Cloud/RBAC.** Повний аудит Cloud credentials, зовнішніх портів, cluster-wide RBAC і доступу до API поки не підтверджено.
5. **Grafana.** 10.11.2026 спостерігалися `2/3 Ready`, timeout і HTTP 503; остання перевірка показала `3/3 Ready`. Стійкість не підтверджено, деталі в `monitoring.md`.
6. **Root filesystem.** `readOnlyRootFilesystem` не встановлено в показаних container securityContext; не міняти без перевірки write paths (uploads/DP keys, PostgreSQL) і compatibility test.
7. **Secrets backup.** Зі знімка Kubernetes Secrets і inline env values вилучені/редаговані; такий знімок не є повною автономною інструкцією відновлення.

## Обмеження висновку

Нуль HIGH/CRITICAL означає тільки результат конкретних сканерів, набору баз уразливостей і сканованих локальних образів. Не проводилися penetration test, повний secrets audit на всі remote refs, фактичні CI jobs у GitHub або наскрізні Cloud/network тести.

## Правила роботи

Не друкувати секрети, Data Protection keys, `.env` або вміст backup. Не публікувати файли приватних копій. Зміни Kubernetes/CI, ротація секретів та очищення історії — тільки після погодження з командою.
