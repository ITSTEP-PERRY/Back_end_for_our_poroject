# Architecture Diagrams — сводка (Perry)

Полный список папок `01_`…`14_` — см. [README.md](./README.md).

## Рекомендуемый порядок на защите

1. **01** — «Из чего состоит система»
2. **02** — «Куда идут запросы с :3000»
3. **13** — «Почему три бэкенда» (Auth / Product / Admin)
4. **03–05** — структура и маршруты Product API
5. **07 + 10** — как логинимся
6. **08–09, 11** — фронт
7. **12** — корзина и checkout (главный user journey)
8. **04** — PostgreSQL
9. **14** — что сделали в спринте

## Картинки

В каждой папке уже лежит **`diagram.png`** (рендер Mermaid CLI, тёмная тема).  
Исходники: `diagram.mmd`, упрощённый `diagram.svg`.

Пересобрать все PNG из корня `project_defense`:

```powershell
cd D:\Perry\project_defense
Get-ChildItem -Recurse -Filter *.mmd | ForEach-Object {
  npx mmdc -i $_.FullName -o ([IO.Path]::ChangeExtension($_.FullName,'.png')) `
    -c .\mermaid-config.json -b '#0f1419' -s 2
}
```
