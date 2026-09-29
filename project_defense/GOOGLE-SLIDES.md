# Как открыть презентацию в Google Slides (бесплатно)

Файл: **`Perry-Defense-Presentation.pptx`** (11 слайдов + заметки докладчика из речи).

## Вариант A — Google Drive

1. [drive.google.com](https://drive.google.com) → **Создать** → **Загрузка файлов** → выберите `Perry-Defense-Presentation.pptx`
2. ПКМ по файлу → **Открыть с помощью** → **Google Презентации**
3. Файл → **Сохранить как Google Презентации** (появится копия в Drive)

Дальше можно править вручную или попросить **Gemini** в Workspace: «сократи текст на слайде 1», «добавь буллет про PostgreSQL» — схемы уже ваши PNG.

## Вариант B — PowerPoint

Откройте `.pptx` двойным щелчком (если установлен Office).

## Пересборка после правок схем

```powershell
cd D:\Perry\project_defense
python build_pptx.py
```

Слайды берут PNG из `views_project/`.
