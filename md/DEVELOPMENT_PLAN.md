# План развития «Мрачной деревни»

Обновлено: **2026-08-06** (ежедневный прогон Medieval Society Daily, v1.4.0).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Лекарь / карантин при эпидемии | **Сделано (v1.4.0)** | Карантин в хижинах, старцы снижают смертность, староста-старец усиливает эффект. |
| Smoke 2160 дней | **Сделано (v1.4.0)** | `ULTRA_LONG_THRESHOLDS`: ≥3 рождений, стабильно на seed=2026. |
| Path smoothing A* | **Отложить** | Pathfinding работает; сглаживание — косметика. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Выбор seed из UI | **Отложить** | Headless daemon хранит seed на сервере. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |
| Отдельная профессия «лекарь» | **Отложить** | Старцы уже покрывают механику; новая роль — после UI seed. |

## Следующие циклы (приоритет)

1. **Выбор seed и размер карты из UI**.
2. **Path smoothing** — сглаживание углов A*.
3. **Спрайты** — замена силуэтов.
4. **Smoke 2880+ дней** — четыре игровых года, стресс-тест караванов и миграции.
5. **Расширенный карантин** — изоляция хижин с больными, визуал на карте.

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
| 10 дней (v1.4.0) | 22 живых, 0 смертей | **стабильно** |
| 100 дней CI (v1.4.0) | рождения, ≤ CI-порогов | **стабильно** |
| 720 дней (v1.4.0) | LONG_THRESHOLDS — **стабильно** |
| 1440 дней (v1.4.0) | EXTRA_LONG — **стабильно** |
| 2160 дней (v1.4.0) | ULTRA_LONG, ≥3 рождений — **стабильно** |
| CI (`--ci`) 100 дней | 22+ живых, рождения | Стабильно по CI-порогам |

**Идеи для следующего цикла:** UI seed; визуал карантина на карте; 2880-дневный smoke.

### Диагностика нестабильности

- Много смертей от **голода/холода** + пополнение **беженцами** → внутренний цикл слаб (см. инспектор «Деревня»).
- Много смертей от **болезни** без голода → эпидемия; соль и старцы помогают, это не провал еды.
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
