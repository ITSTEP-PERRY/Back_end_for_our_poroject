# Rollback Kubernetes — етап 7

**Тест:** 06.11.2026 у кластері `docker-desktop`.

## Принцип

Повернення попереднього Pod template через `kubectl rollout undo deployment/<name> --to-revision=<N>`; після цього перевірка `kubectl rollout status` і працездатності. **Rollback Deployment не відновлює попередні дані чи схему БД.**

## Проведений ізольований тест

1. Пройшли safety preflight: реальний namespace `perry-stage7` та Deployment `perry-api` не змінювали.
2. Створили тимчасовий namespace `perry-rollback-test-2bcd296c` і Deployment `rollback-demo`.
3. Revision 1: образ `postgres:16-alpine`, Pod `1/1 Ready` — **PASS**.
4. Revision 2: навмисно неіснуючий образ `postgres:stage7-rollback-invalid-2bcd296c`; `kubectl rollout status` закінчився timeout, Pod мав `ErrImageNeverPull` — очікуваний збій **підтверджено**.
5. Виконали `kubectl rollout undo deployment/rollback-demo --to-revision=1` — **PASS**.
6. Перевірили: відновлений `postgres:16-alpine`, `1/1 Ready` — **PASS**.
7. Перевірили `perry-api` з оригінальним образом `back_end_for_our_poroject-api:security-v4` і `1/1 Ready`; namespace тесту видалено, Git не змінено.

У тесті з'явилося стандартне застереження про `last-applied-configuration` після `kubectl apply` та `rollout undo`; тимчасовий Deployment було видалено.

## Історія реального Perry API

Станом на 06.11.2026 поточна ревізія: **5**, образ `security-v4`; попередні 1–3 мали `security-v3`, ревізія 4 — `security-v4`. Реальне розгортання Perry **не відкотували**.

## Обмеження / наступні дії

- Це перевірка **механізму Kubernetes** в ізольованому Deployment, не тест реального downgrade Perry API.
- Перевірити сумісність змін схеми, EF migrations та чинних секретів до будь-якого реального відкоту API.
- Описати процедуру команди: зафіксувати поточний образ і Git SHA, перевірити резервну копію БД, виконати rollout у staging, оцінити endpoints, після дозволу координатора проводити rollback.
- Заборонено пробний rollback у робочому `perry` або `perry-stage7` без погодження.
