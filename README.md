# Мрачная деревня

Браузерная песочница с видом сверху: средневековая деревня живёт сама — крестьяне едят, спят, собирают в амбар, плодятся и умирают. Игрок только наблюдает.

## Стек

- TypeScript + Vite
- HTML5 Canvas 2D
- Симуляция отделена от отрисовки (`src/sim` / `src/render`)

## Запуск

```bash
cd /Users/machome_user/Desktop/Dev/My/game
npm install
npm run dev
```

Открой URL из терминала (обычно `http://localhost:5173`).

## Управление

| Действие | Клавиши / мышь |
|----------|----------------|
| Камера | WASD / стрелки |
| Зум | колёсико мыши |
| Карточка жителя | клик по крестьянину |
| Сводка деревни | клик по амбару/площади, кнопка «Деревня», V |
| История версий | кнопка «Версии», H — changelog по версиям |
| Версия игры | правый верх HUD — `v0.2.0` |
| Летопись | в инспекторе «Деревня» — последние 10 дней (с именами и шоками) |
| Сохранить / загрузить | кнопки в HUD — localStorage браузера |
| Новый мир | кнопка «Новый мир» — сброс сохранения |
| Легенда карты | верхний левый угол экрана |
| Стройплощадка | пунктирная рамка + полоса прогресса на карте |
| Снять выбор | Esc / клик по пустому полю |
| Пауза | Space или кнопка |
| Скорость | 1 / 2 / 4 |

## Архитектура

См. [md/ARCHITECTURE.md](md/ARCHITECTURE.md).  
Долги и планы: [md/TECHNICAL_DEBT.md](md/TECHNICAL_DEBT.md), [md/DEVELOPMENT_PLAN.md](md/DEVELOPMENT_PLAN.md).

## Проверка симуляции

```bash
npm run simulate      # 10 дней, seed 2026
npm run simulate 10 1337
npm run village:status  # обновить docs/status.json для GitHub Pages
npm test              # smoke-тесты стабильности
```

## Публичная витрина

Автономная летопись общества (метрики, хроника, changelog агента):  
**https://aygaydukov.github.io/grim-village/**

Игра на сервере (после CD): **http://45.131.42.53/**  
Настройка деплоя: [md/DEPLOY.md](md/DEPLOY.md).

Как устроено automation: [md/AUTOMATION.md](md/AUTOMATION.md).

## Репозиторий

Отдельный GitHub: [aygaydukov/grim-village](https://github.com/aygaydukov/grim-village) (public).  
CI: Pages из `docs/` · CD: `dist/` → `/var/www/grim-village` на `45.131.42.53`.
