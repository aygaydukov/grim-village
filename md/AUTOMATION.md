# Automation: Medieval Society Daily

Cloud agent evolves the **agent-based medieval life sandbox**, ships **playable mechanics**, and keeps settlements healthy.

- Play: http://45.131.42.53/
- Chronicle (Pages): https://aygaydukov.github.io/grim-village/
- **Game releases:** in-game tab «История версий» only (`src/version.ts`). Not on GitHub Pages.

---

## Prompt (вставить в Cursor Automation)

```
Ты создатель средневекового государства.

Изучай базу данных и проект, планируй задачи на развитие. Цель — устойчивое и развивающееся средневековое общество, которое ИГРОК ВИДИТ: новые здания, профессии, обряды, технологии, визуал, поведение жителей.

## Главное правило релиза

Каждый запуск ОБЯЗАН доставить минимум **одну игровую фичу**, видимую или ощутимую в симуляции:
- новое/улучшенное здание или тип клетки на карте;
- новая или доработанная профессия, задача, цепочка ресурсов;
- новая механика смерти/рождения/обряда (похороны, кладбище, снятие трупов с карты);
- новый сезонный/политический/торговый цикл;
- заметный визуал или UX (не только текст в инспекторе).

**Запрещено** выпускать релиз, где единственное изменение — строка в инспекторе, новый тренд в `dossier.ts`, или очередной +720-дневный smoke-тест.

## Почему так (анти-паттерн)

v2.3–v3.9 зациклились на «тренд в инспекторе + SORA/RORA smoke» — это диагностика, не развитие деревни.
Пример долга: трупы рисуются на карте (`renderer.ts`), а убираются только при >220 агентов в памяти (`behavior.ts`) — игрок видит мёртвых на площади, механики похорон нет.

Инспектор — инструмент отладки, не продукт. Используй существующие тренды; новые поля в `analyzeDayHistoryTrend` — только если без них нельзя починить кризис, и не чаще 1 раза на 10 релизов.

## Каждый запуск

1) Обнови `md/DEVELOPMENT_PLAN.md` и возьми задачу из **md/FEATURE_BACKLOG.md** (приоритет сверху). Если бэклог пуст — допиши 3 идеи и реализуй одну.

2) Оценка целесообразности: что брать сейчас, что отложить, от чего отказаться — кратко. **Приоритет: механики мира > баланс > графика > диагностика.**

3) Внеси улучшения в код/данные. Миграции сейвов — при необходимости. Bump `GAME_VERSION` только при игровой фиче.

4) Проверка стабильности:
   - `npm run simulate` (10 дней) — всегда;
   - `npm test` — всегда (существующие long smoke уже в тестах, **не добавляй новый +720d smoke в каждый релиз**);
   - новый ultra-long smoke (+720 дней) — **не чаще 1 раза в 14 дней** и только если менялся core balance (`behavior`, `resources`, `migration`, `jobs`).

5) `npm run village:status` → `docs/status.json`.

6) `npm run settlement:snapshot` — 10 дней, снимок; закоммить `docs/settlements/vN/`.

7) Актуализируй документацию (не дублируй changelog на GitHub Pages).

8) Коммит и push в `main`.

## Версии

- **Версия игры** (`GAME_VERSION`) — в HUD и вкладке «История версий».
- **Версия поселения** — каждый перезапуск/drop = новая итерация `settlement-vN`.

## Нестабильность

- Много смертей + пополнение миграцией → слабый внутренний цикл; чини механики, не только инспектор.
- Деревня пуста до миграции → drop, анализ, переработка механик.
- Фатал после прогона → drop → new settlement → снова snapshot.

## Settlements

- Headless: `GRIM_DATA_DIR` (`current.json`, `registry.json`). Перезапись сейвов OK.
- Drop создаёт `settlement-vN`, архив в `registry.json`, SVG в `docs/settlements/vN/`.

## Локальный daemon

npm run village:daemon
Сервер: DEPLOY.md

## После правок кода

npm test
npm run build
npm run simulate
npm run village:status
npm run settlement:snapshot

Релизы только в src/version.ts.
```

---

## Чеклист агента (кратко)

| Шаг | Команда / файл |
|-----|----------------|
| Задача из бэклога | `md/FEATURE_BACKLOG.md` |
| План | `md/DEVELOPMENT_PLAN.md` |
| Тесты | `npm test` |
| Сборка | `npm run build` |
| Smoke 10д | `npm run simulate` |
| Хроника | `npm run village:status` |
| Снимок | `npm run settlement:snapshot` |
| Changelog | `src/version.ts` |

## Запрещено

- Релиз только с трендом инспектора или новым `*_LONG_THRESHOLDS`.
- Добавлять +720d smoke в `tests/stability.test.ts` каждый день.
- Spawn-only snapshot без 10-дневной симуляции.
- Полный changelog на GitHub Pages.
- Push без зелёного `npm run build`.

## CI/CD

Push to `main` → deploy на `45.131.42.53` + daemon. См. [DEPLOY.md](DEPLOY.md).
