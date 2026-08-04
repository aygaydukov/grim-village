# План развития «Мрачной деревни»

Обновлено: **2026-08-04** (ежедневный прогон Medieval Society Daily, v1.3.0).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Эпидемии | **Сделано (v1.3.0)** | Редкий весенний/летний шок «болезнь», соль снижает смертность, отделена от голода в инспекторе. |
| Smoke 1440 дней | **Сделано (v1.3.0)** | `EXTRA_LONG_THRESHOLDS`: ≥2 рождений, стабильно на seed=2026. |
| Path smoothing A* | **Отложить** | Pathfinding работает; сглаживание — косметика. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Выбор seed из UI | **Отложить** | Headless daemon хранит seed на сервере. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |
| Двойные эпидемии + неурожай | **Отложить** | Шоки не пересекаются; баланс проверен на 1440д. |

## Следующие циклы (приоритет)

1. **Выбор seed и размер карты из UI**.
2. **Path smoothing** — сглаживание углов A*.
3. **Спрайты** — замена силуэтов.
4. **Расширенные эпидемии** — лекарь/старец снижает смертность, карантин хижин.
5. **Smoke 2160+ дней** — три игровых года, несколько эпидемий.

## Метрики стабильности (10 дней)

> 10 игровых дней ≈ **0.014 года** на новой шкале (короткий smoke-прогон баланса еды/смертей).
> Полный год = 720 игровых дней; 3 года ≈ 1 реальные сутки при ×1.

- Живых ≥ 50% от старта (≥ 11 при 22).
- Смертей ≤ 40% от старта за прогон.
- Амбар ≥ 8 мер к концу.
- Средний голод < 78.
- Население не вымерло.

Команда проверки: `npm run simulate` и `npm test`.

### Долгий прогон

| Режим | seed=2026 | Результат |
|-------|-----------|-----------|
| 10 дней (v1.3.0) | 22 живых, 0 смертей | Амбар 57 — **стабильно** |
| 100 дней CI (v1.3.0) | 27 живых, 1 смерть, 6 рождений | **стабильно** |
| 720 дней (v1.3.0) | LONG_THRESHOLDS — **стабильно** |
| 1440 дней (v1.3.0) | ≥2 рождений, EXTRA_LONG — **стабильно** |
| CI (`--ci`) 100 дней | 22+ живых, рождения | Стабильно по CI-порогам |

**Идеи для следующего цикла:** UI seed; лекарь при эпидемии; 2160-дневный smoke.

### Диагностика нестабильности

- Много смертей от **голода/холода** + пополнение **беженцами** → внутренний цикл слаб (см. инспектор «Деревня»).
- Много смертей от **болезни** без голода → эпидемия; соль помогает, это не провал еды.
- **Застряли ≥ 2** — агенты у воды или за leash; v1.2.2 сбрасывает путь автоматически.
- Деревня **пуста**, миграция ещё не сработала → фатал, нужен drop и анализ механик.

## Полезные ссылки

- [Might & Fealty — economy loop](https://mightandfealty.com/en/manual/economy) — связь еды и населения.
- [Village Craft — logistics](https://watchdocumentariesgames.github.io/village-craft.html) — склады, бутылочные горлышки.
- [Multilevel demography + food (SocArXiv)](https://ideas.repec.org/p/osf/socarx/5be6a.html) — agent-based agrarian model.
- [Seasonal agriculture (Wikipedia)](https://en.wikipedia.org/wiki/Crop_calendar) — календарь посевов/урожая.
- [Medieval guilds and crafts (Britannica)](https://www.britannica.com/topic/guild-trade-association) — ремесленники и торговля.
- [Medieval caravans (Britannica)](https://www.britannica.com/topic/caravan-trade-route) — сезонная торговля.
- [Medieval village layout (Britannica)](https://www.britannica.com/topic/manorialism) — расширение поселения.
- [A* pathfinding (Red Blob Games)](https://www.redblobgames.com/pathfinding/a-star/introduction.html) — обход воды.
- [Medieval tithe (Britannica)](https://www.britannica.com/topic/tithe) — десятина и казна.
- [Medieval migration patterns (Britannica)](https://www.britannica.com/topic/migration-human-behavior) — исход семей.
- [Medieval governance (Britannica)](https://www.britannica.com/topic/manorialism/Manorial-structure-and-land-tenure) — политика старосты.
- [Medieval refugees (Britannica)](https://www.britannica.com/topic/refugee) — приём беженцев.
- [Black Death — medieval epidemics (Britannica)](https://www.britannica.com/event/Black-Death) — контекст для механики эпидемий.
