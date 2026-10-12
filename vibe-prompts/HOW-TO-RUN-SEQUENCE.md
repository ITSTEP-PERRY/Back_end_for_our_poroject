# Как запустить последовательный сценарий промптов

[← Оглавление](./README.md) · [Порядок и агенты](./AGENTS-AND-SEQUENCE.md)

## Что делает скрипт

`run-vibe-sequence.cmd` / `.ps1` ведёт тебя по шагам:

**PITFALLS → 00 → 01 → … → 12**

На каждом шаге:

1. Достаёт блок ` ```text ` из markdown  
2. Добавляет правила стека Perry  
3. **Копирует в буфер обмена**  
4. (Опционально) открывает `.md` в редакторе  
5. Ждёт: **Enter** = следующий · **S** = skip · **Q** = выход  

Прогресс пишется в `.vibe-sequence-state.json` — можно прерваться и продолжить.

> Скрипт **не** вызывает ИИ сам. Он готовит промпт; выполнение — в Cursor Agent (ты вставляешь Ctrl+V).

---

## Запуск (Windows)

### Вариант 1 — двойной клик

Открой папку `vibe-prompts/` → **`run-vibe-sequence.cmd`**

### Вариант 2 — PowerShell

```powershell
cd D:\Perry\My_Amazon2\vibe-prompts
.\run-vibe-sequence.ps1
```

### Полезные флаги

```powershell
.\run-vibe-sequence.ps1 -List          # только план шагов
.\run-vibe-sequence.ps1 -From 06       # начать с desktop Vite
.\run-vibe-sequence.ps1 -Reset         # сбросить прогресс
.\run-vibe-sequence.ps1 -NoOpen        # не открывать .md
.\run-vibe-sequence.ps1 -IncludeOneShot # добавить шаг 99 в конец
```

Через cmd:

```bat
run-vibe-sequence.cmd -From 03
run-vibe-sequence.cmd -Reset
```

---

## Типичный цикл одного шага

1. Запущен скрипт → в консоли «Шаг N/M»  
2. Переключись в **Cursor → Agent**  
3. **Ctrl+V** → отправь сообщение  
4. Дождись, пока агент закончит шаг (проверь DoD из промпта)  
5. Вернись в окно скрипта → **Enter**  
6. Повтори до конца  

На шагах Auth / reviews / cart / Figma скрипт уже кладёт в буфер текст из [PITFALLS](./PITFALLS.md) как первый шаг — не пропускай его без чтения.

---

## Связь с числом агентов

| Режим | Как использовать скрипт |
|-------|-------------------------|
| 1 агент | Один прогон `run-vibe-sequence` от начала до конца |
| 2–3 агента | Не гоняй один скрипт на всех. Раздели зоны по [AGENTS-AND-SEQUENCE](./AGENTS-AND-SEQUENCE.md); скрипт — для **своей** зоны с `-From` |
| Пример BE | `.\run-vibe-sequence.ps1 -From pitfalls` затем остановись после 05 (Q), Web начнёт `-From 06` |

---

## Файлы

| Файл | Назначение |
|------|------------|
| [run-vibe-sequence.cmd](./run-vibe-sequence.cmd) | Запуск двойным кликом |
| [run-vibe-sequence.ps1](./run-vibe-sequence.ps1) | Логика сценария |
| `.vibe-sequence-state.json` | Прогресс (локально, можно в .gitignore) |

---

## Если буфер не копируется

- Запускай из обычного PowerShell / cmd (не песочница без UI).  
- Или открой `.md` вручную и копируй блок «Промпт для ИИ».
