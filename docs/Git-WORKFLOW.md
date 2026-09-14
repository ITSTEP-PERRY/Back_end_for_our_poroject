# Git Workflow

## Обзор

В проекте Perry используется Git и GitHub для совместной разработки.

Основная ветка проекта:

```text
main

Для разработки новых функций и изменений используются отдельные feature-ветки.

Пример:

feature/название-задачи
Основной рабочий процесс

Изменения для новых задач выполняются в отдельной feature-ветке.

Общая схема:

main
  ↓
Создание feature-ветки
  ↓
Разработка
  ↓
Commit
  ↓
Push в GitHub
  ↓
Pull Request
  ↓
GitHub Actions CI
  ↓
Проверка
  ↓
Merge в main
Создание feature-ветки

Перед началом работы необходимо получить актуальную версию main:

git checkout main
git pull origin main

После этого создаётся новая feature-ветка:

git checkout -b feature/my-task

Название ветки должно соответствовать выполняемой задаче.

Примеры:

feature/docker
feature/health-check
feature/api-products
feature/frontend-catalog
Работа с изменениями

После выполнения изменений необходимо проверить состояние репозитория:

git status

При необходимости можно посмотреть внесённые изменения:

git diff

Добавить изменения:

git add .

Создать commit:

git commit -m "Описание изменения"

Сообщение commit должно кратко описывать выполненную работу.

Примеры:

Add health check
Update Docker configuration
Add CI/CD documentation
Fix API configuration
Отправка изменений в GitHub

Feature-ветка отправляется в GitHub командой:

git push -u origin feature/my-task

После этого в GitHub можно создать Pull Request.

Pull Request

Pull Request создаётся для объединения feature-ветки с main.

Схема:

feature/my-task → main

В Pull Request необходимо указать:

что было изменено;
зачем были внесены изменения;
какие проверки были выполнены.

После создания или обновления Pull Request GitHub Actions запускает CI.

Проверка CI

Во время Pull Request выполняется автоматическая проверка проекта.

CI проверяет:

получение исходного кода;
установку .NET 8;
восстановление зависимостей;
сборку решения;
тесты;
конфигурацию Docker Compose;
сборку Docker-образов;
запуск контейнеров;
доступность API через health check.

Если CI завершился с ошибкой, необходимо исправить проблему перед объединением изменений с main.

Merge в main

После успешного прохождения проверок Pull Request может быть объединён с main.

Схема:

feature/*
    ↓
Pull Request
    ↓
GitHub Actions
    ↓
CI успешно
    ↓
Merge
    ↓
main

После merge в main GitHub Actions снова запускает CI.

Для изменений в main также выполняется публикация Docker-образов в GitHub Container Registry.

Работа с актуальной версией main

После завершения задачи и перед началом следующей работы рекомендуется обновить локальную main:

git checkout main
git pull origin main

После этого создаётся новая feature-ветка:

git checkout -b feature/new-task
Разрешение конфликтов

Если при объединении веток возникает конфликт:

Определить конфликтующие файлы.
Открыть конфликтующие файлы.
Выбрать правильный вариант изменений.
Удалить конфликтующие маркеры Git.
Проверить проект.
Добавить исправленные файлы:
git add .
Создать commit:
git commit -m "Resolve merge conflicts"
Отправить изменения:
git push

После этого Pull Request обновится.

Рекомендуемый порядок работы
1. git checkout main
2. git pull origin main
3. git checkout -b feature/my-task
4. Выполнение задачи
5. git status
6. git diff
7. Проверка проекта
8. git add .
9. git commit -m "Описание изменения"
10. git push -u origin feature/my-task
11. Создание Pull Request
12. Ожидание успешного CI
13. Merge в main
14. Удаление feature-ветки
Основное правило

main должна содержать рабочую версию проекта.

Новые изменения сначала выполняются в feature-ветках, после чего проходят Pull Request и автоматические проверки GitHub Actions.

Только после успешной проверки изменения объединяются с main.

Такой подход позволяет снизить риск попадания неработающего кода в основную ветку проекта.