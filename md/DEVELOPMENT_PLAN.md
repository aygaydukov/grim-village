# План развития «Мрачной деревни»

Обновлено: **2026-08-08** (ежедневный прогон Medieval Society Daily, v1.6.0).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Изоляция больных хижин (механика) | **Сделано (v1.6.0)** | `quarantine.ts`: сон дома ×0.38 уязвимости; визуал только занятых хижин. |
| Smoke 3600 дней | **Сделано (v1.6.0)** | `SUPER_LONG_THRESHOLDS`, ≥5 рождений, стабильно seed=2026. |
| Интерактивный выбор seed | **Сделано (v1.6.0)** | Локальный «Новый мир» в HUD; daemon не затрагивается. |
| Smoke 2880 дней | **Сделано (v1.5.0)** | `MEGA_LONG_THRESHOLDS`, ≥4 рождений. |
| Path smoothing A* | **Отложить** | Pathfinding работает; сглаживание — косметика. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |
| Отдельная профессия «лекарь» | **Отложить** | Старцы + изоляция покрывают механику. |
| Smoke 4320+ дней (6 лет) | **Следующий цикл** | Стресс после пяти лет. |

## Следующие циклы (приоритет)

1. **Path smoothing** — сглаживание углов A*.
2. **Спрайты** — замена силуэтов.
3. **Smoke 4320 дней** — шесть игровых лет.
4. **Отдельная «больная хижина»** — переселение заражённых в одну избу (сейчас изоляция по дому семьи).

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
| 10 дней (v1.6.0) | smoke | **стабильно** |
| 100 дней CI (v1.6.0) | рождения, ≤ CI-порогов | **стабильно** |
| 720 дней | LONG_THRESHOLDS — **стабильно** |
| 1440 дней | EXTRA_LONG — **стабильно** |
| 2160 дней | ULTRA_LONG, ≥3 рождений — **стабильно** |
| 2880 дней | MEGA_LONG, ≥4 рождений — **стабильно** |
| 3600 дней (v1.6.0) | SUPER_LONG, ≥5 рождений — **стабильно** |
| CI (`--ci`) 100 дней | 22+ живых, рождения | Стабильно по CI-порогам |

**Идеи для следующего цикла:** path smoothing; спрайты; smoke 4320 дней; центральная «больная изба».

### Диагностика нестабильности

- Много смертей от **голода/холода** + пополнение **беженцами** → внутренний цикл слаб (см. инспектор «Деревня»).
- Много смертей от **болезни** без голода → эпидемия; соль, старцы и изоляция в хижине помогают.
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
