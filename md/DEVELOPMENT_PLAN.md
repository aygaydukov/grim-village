# План развития «Мрачной деревни»

Обновлено: **2026-08-03** (ежедневный прогон Medieval Society Daily, v1.2.2).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Диагностика застревания | **Сделано (v1.2.2)** | `stuckTicks`, сброс A* и принудительная цель у амбара/якоря; счётчик в инспекторе. |
| Smoke 720 дней / рождения | **Сделано (v1.2.2)** | Тест с `LONG_THRESHOLDS`: 1 рождение, 19 живых, стабильно. |
| Баланс 100-дневного режима | **Улучшено (v1.2.2)** | seed=2026: 0 смертей (было 4 в v1.2.1) — застревание у воды устранено. |
| Эпидемии | **Отложить** | Смертность снижена; двойной шок рискован. |
| Path smoothing A* | **Отложить** | Pathfinding работает; сглаживание — косметика. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Выбор seed из UI | **Отложить** | Headless daemon хранит seed на сервере. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |

## Следующие циклы (приоритет)

1. **Эпидемии** — редкий шок смертности (отдельно от неурожая).
2. **Расширенная демография** — smoke на 1440+ дней (2 игровых года) для нескольких рождений.
3. **Выбор seed и размер карты из UI**.
4. **Path smoothing** — сглаживание углов A*.
5. **Спрайты** — замена силуэтов.

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
| 10 дней (v1.2.2) | 22 живых, 0 смертей | Амбар 57 — **стабильно** |
| 100 дней (v1.2.2) | 22 живых, 0 смертей | Амбар 65 — **стабильно** |
| 720 дней (v1.2.2) | 19 живых, 11 смертей, 1 рождение | LONG_THRESHOLDS — **стабильно** |
| CI (`--ci`) 100 дней | 22 живых, 4 смерти, 4 рождения | Стабильно по CI-порогам |

**Идеи для следующего цикла:** эпидемии; 1440-дневный smoke; UI seed.

### Диагностика нестабильности

- Много смертей от **голода/холода** + пополнение **беженцами** → внутренний цикл слаб (см. инспектор «Деревня»).
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
