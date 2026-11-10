# Monitoring & Logging Perry — етап 7

**Оновлено:** 10.11.2026. **Середовище:** локальний Kubernetes `docker-desktop`.

## Склад

Namespace `monitoring`: Prometheus, Grafana, Alertmanager, kube-state-metrics, node-exporter, Loki та Alloy. Раніше тестовий email для контактної точки Perry Email Alerts успішно відправлявся; правила `Perry API Down` / `Perry API High CPU Usage` були налаштовані, але **їхню актуальну доставку та спрацювання станом на 10.11 не підтверджено**.

## Перевірені метрики Perry

Prometheus API повернув CPU (`rate(container_cpu_usage_seconds_total[5m])`) і RAM (`container_memory_working_set_bytes`) за Pod. Поточні та пікові значення наведені в `optimization.md`. `metrics-server` не встановлено, тому `kubectl top` не працює; для дипломного звіту метрики зібрано безпосередньо з Prometheus.

## Відкрита проблема Grafana

10.11.2026 Grafana Pod `kube-prometheus-stack-1792153688-grafana-646cf7bcbc-c6nn8` під час діагностики мав **2/3 Ready**. Остання перевірка показала **3/3 Ready**, але стабільність ще потребує підтвердження.

- Контейнер `grafana`: **Running, Ready=False** під час інциденту (остання перевірка **Ready=True**), restart count 9, останній exit code **137**, reason `Error`.
- Sidecars `grafana-sc-dashboard` і `grafana-sc-datasources`: Ready=True.
- Станом на діагностику 10.11.2026 Kubernetes events `Unhealthy` — **576** тайм-аутів і **78** відповідей `HTTP 503`; лічильники подій накопичувальні й не дорівнюють кількості збоїв за останні 24 години.
- Readiness endpoint `/api/health`: `timeoutSeconds=1`, `periodSeconds=10`, `failureThreshold=3`; liveness timeout — 30 секунд. Через Kubernetes Service proxy перевірка `/api/health` не вдалася, проте **пізніше той самий endpoint через Pod proxy відповів, `database=ok`**. Це підтверджує доступність endpoint у момент перевірки. Попередні timeout/503 і ризик нестабільної readiness ще потребують аналізу.
- Обмеження Grafana: RAM request **128Mi**, limit **384Mi**, CPU request **100m**, limit **500m**. Prometheus зафіксував **295.23 MiB** поточної RAM, **368.85 MiB** піку за 24 години та **318.57 mCPU** пікового CPU. Пікова RAM близька до ліміту, але факт OOM не підтверджено.
- За останні 500 рядків журналу (без публікації сирого тексту): **105** збігів за шаблоном timeout, **37** за plugin/error, **9** за HTTP 5xx, **228** за `error` (ці категорії перетинаються; не трактувати їх як кількість незалежних збоїв).
- **Кореневу причину не встановлено.** Exit 137 сам по собі не доводить OOM; потрібно перевірити probe failures, контейнерні ресурси, endpoint і журнали без витоку секретів.

Додаткова перевірка 10.11: на Windows **Helm CLI не встановлено**, назва інстансу за Pod label — `kube-prometheus-stack-1792153688`. Перед зміною Helm values треба отримати поточні значення і забезпечити rollback; не змінювати спільний monitoring без узгодження.

## План діагностики

1. Уточнити причину exit 137 за минулими станами та метриками OOM/eviction, окремо перевірити поточний стан Grafana на 10.11.2026.
2. Оцінити частоту/тип probe failures: timeout, HTTP 5xx, connection refused.
3. Дослідити, чому Grafana наближається до 384Mi, і чи потрібно змінювати ліміти; перевірити часові ряди RAM та OOM, не робити висновку лише за кодом 137.
4. Повторити `/api/health` через Pod proxy, перевірити datasource-стан; не друкувати токени/заголовки чи конфіденційні журнали.
5. Якщо встановлено, що `timeoutSeconds=1` замалий, узгодити корекцію через **Helm values**, а не безконтрольний patch живого Deployment.

## Перевірка сценарію моніторингу для демонстрації

Підготувати безпечний контрольований тест: симулювати збій у тестовому namespace, перевірити метрики, лог, alert state та доставку повідомлення. Не порушувати основний Perry API. Зафіксувати скриншоти dashboard і час спрацювання.

<!-- stage7-grafana-helm-rev4-20261110 -->
### Grafana Helm remediation — 2026-11-10

The Grafana container experienced intermittent readiness failures and restarts.

Observed before remediation:
- Memory limit: 384Mi.
- Memory working set peak over 24 hours: approximately 382.3Mi.
- Readiness probe timeout: 1 second.
- Ten Grafana container restarts were observed.
- The application sometimes returned Ready=False.

Remediation:
- Kubernetes context: docker-desktop.
- Namespace: monitoring.
- Helm release: kube-prometheus-stack-1792153688.
- Chart version: kube-prometheus-stack 92.10.1 (unchanged).
- Helm revision: 3 -> 4.
- Grafana memory limit: 384Mi -> 768Mi.
- Grafana readiness timeout: 1 -> 5 seconds.
- Existing Helm values reused; hooks disabled.
- Rollback-on-failure enabled during upgrade.

Safety validation:
- Server-side dry-run succeeded.
- All 116 rendered resources were compared.
- Only the Grafana Deployment manifest changed.
- Grafana Secret and administrator password were preserved.

Post-upgrade verification:
- Helm status: deployed, revision 4.
- Grafana: 3/3 containers Ready, 0 restarts.
- Five additional readiness samples: 5/5 successful.
- Grafana /api/health: database ok.
- Prometheus query: success, 18 returned metric series.
- Alertmanager readiness: passed.
- Perry API health: database up.
- Final audit: 7 checks passed, 0 warnings.

This confirms successful initial validation, not 24-hour stability.
Continue observing readiness, restarts, and resource usage.

Rollback reference: the previous successful Helm revision is 3.
Before rollback, confirm current release state and operational impact.
