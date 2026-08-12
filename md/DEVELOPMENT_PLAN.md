# План развития «Мрачной деревни»

Обновлено: **2026-08-12** (ежедневный прогон Medieval Society Daily, v2.0.0).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Вторая больная изба при переполнении | **Сделано (v2.0.0)** | ≥5 семей → две дальние хижины; `sickHut2X/Y`, SAVE_VERSION=14. |
| Smoke 6480 дней (9 лет) | **Сделано (v2.0.0)** | `TERA_LONG_THRESHOLDS`, ≥9 рождений, стабильно seed=2026. |
| Семейный карантин в больной избе | **Сделано (v1.9.0)** | `householdUnderQuarantine` — вся семья уходит вместе, дети не остаются в заражённой хижине. |
| Smoke 5760 дней | **Сделано (v1.9.0)** | `GIGA_LONG_THRESHOLDS`, ≥8 рождений, стабильно seed=2026. |
| Больная изба (центр карантина) | **Сделано (v1.8.0)** | `quarantine.ts`: одна хижина на окраине, сильнее изоляция (×0.3 сон). |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |
| Отдельная профессия «лекарь» | **Отложить** | Старцы + больные избы + семейный карантин покрывают механику. |
| Smoke 7200+ дней (10 лет) | **Следующий цикл** | Стресс после девяти лет. |
| Выбор размера карты из UI | **Отложить** | Seed уже есть (v1.6.0). |

## Следующие циклы (приоритет)

1. **Спрайты** — замена силуэтов.
2. **Smoke 7200 дней** — десять игровых лет.
3. **Динамическое открытие второй избы** — по факту переполнения, не только при старте эпидемии.
4. **Выбор размера карты** из UI.

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
| 10 дней (v1.9.0) | smoke | **стабильно** |
| 100 дней CI (v1.9.0) | рождения, ≤ CI-порогов | **стабильно** (27 живых, 6 рождений) |
| 720 дней | LONG_THRESHOLDS — **стабильно** |
| 1440 дней | EXTRA_LONG — **стабильно** |
| 2160 дней | ULTRA_LONG, ≥3 рождений — **стабильно** |
| 2880 дней | MEGA_LONG, ≥4 рождений — **стабильно** |
| 3600 дней | SUPER_LONG, ≥5 рождений — **стабильно** |
| 4320 дней | HYPER_LONG, ≥6 рождений — **стабильно** |
| 5040 дней | OMEGA_LONG, ≥7 рождений — **стабильно** |
| 5760 дней (v1.9.0) | GIGA_LONG, ≥8 рождений — **стабильно** |
| 6480 дней (v2.0.0) | TERA_LONG, ≥9 рождений — **стабильно** |
| CI (`--ci`) 100 дней | 22+ живых, рождения | Стабильно по CI-порогам |

**Идеи для следующего цикла:** спрайты; smoke 7200 дней; динамическое открытие второй избы mid-epidemic.

### Диагностика нестабильности

- Много смертей от **голода/холода** + пополнение **беженцами** → внутренний цикл слаб (см. инспектор «Деревня»).
- Много смертей от **болезни** без голода → эпидемия; соль, старцы, больная изба и семейный карантин помогают.
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
- [Medieval plague response (Britannica)](https://www.britannica.com/science/epidemiology/History-of-epidemiology) — карантин и изоляция.
