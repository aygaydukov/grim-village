# План развития «Мрачной деревни»

Обновлено: **2026-07-28** (ежедневный прогон Medieval Society Daily, v0.7.0).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Ремесло (кроме еды) | **Сделано (v0.7.0)** | Ремесленники при полном амбаре, склад изделий, торговля → казна. 10-дневный smoke стабилен. |
| Эпидемии | **Отложить** | Демография уже вариативна (миграция, иммиграция, неурожай); двойной шок смертности рискован для smoke. |
| Path smoothing A* | **Отложить** | Pathfinding работает; сглаживание — косметика движения. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Выбор seed из UI | **Отложить** | Headless daemon хранит seed на сервере. |
| Торговля с соседями (расширенная) | **Берём следующим** | Базовый обмен изделий уже есть; дальше — караваны, сезонность, дефицит товаров. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |
| 100-дневный баланс рождений | **Частично / отложить** | Беременность 540 дн. — рождения в 100-дн. smoke невозможны; нужен отдельный CI-режим. |

## Следующие циклы (приоритет)

1. **Расширенная торговля** — караваны, сезонные цены, обмен еды на редкие товары.
2. **Эпидемии** — редкий шок смертности (отдельно от неурожая).
3. **Выбор seed и размер карты из UI**.
4. **Path smoothing** — сглаживание углов A* для более естественного движения.
5. **Укороченный smoke-прогон беременности** — отдельный тестовый режим или параметр для CI 100-дн.
6. **Мастерская как здание** — отдельная клетка на карте вместо абстрактного склада у амбара.

## Метрики стабильности (10 дней)

> 10 игровых дней ≈ **0.014 года** на новой шкале (это короткий smoke-прогон баланса еды/смертей, не поколение).
> Полный год = 720 игровых дней; 3 года ≈ 1 реальные сутки при ×1.

- Живых ≥ 50% от старта (≥ 11 при 22).
- Смертей ≤ 40% от старта за прогон.
- Амбар ≥ 8 мер к концу.
- Средний голод < 78.
- Население не вымерло.

Команда проверки: `npm run simulate` и `npm test`.

### Долгий прогон (100 дней)

Smoke-тест CI — 10 дней. На 100 днях (seed=2026): **6 живых, 24 смерти** — структурный спад без рождений (беременность = 540 игр. дней), не регрессия v0.7.0. Иммиграция и ремесло смягчают краткосрочный баланс; полный долгий баланс — через отдельный CI-режим с укороченной беременностью.

## Полезные ссылки

- [Might & Fealty — economy loop](https://mightandfealty.com/en/manual/economy) — связь еды и населения.
- [Village Craft — logistics](https://watchdocumentariesgames.github.io/village-craft.html) — склады, бутылочные горлышки.
- [Multilevel demography + food (SocArXiv)](https://ideas.repec.org/p/osf/socarx/5be6a.html) — agent-based agrarian model.
- [Seasonal agriculture (Wikipedia)](https://en.wikipedia.org/wiki/Crop_calendar) — календарь посевов/урожая как референс для сезонов.
- [Medieval guilds and crafts (Britannica)](https://www.britannica.com/topic/guild-trade-association) — референс для ремесленников и торговли.
- [Crop failure / famine dynamics (FAO)](https://www.fao.org/emergencies/crisis/famine/en/) — референс для редких продовольственных шоков.
- [Medieval village layout (Britannica)](https://www.britannica.com/topic/manorialism) — расширение поселения вокруг амбара.
- [A* pathfinding (Red Blob Games)](https://www.redblobgames.com/pathfinding/a-star/introduction.html) — референс для обхода воды на карте.
- [Medieval tithe (Britannica)](https://www.britannica.com/topic/tithe) — референс для десятины и казны.
- [Medieval migration patterns (Britannica)](https://www.britannica.com/topic/migration-human-behavior) — референс для исхода семей при перенаселении.
- [Medieval governance (Britannica)](https://www.britannica.com/topic/manorialism/Manorial-structure-and-land-tenure) — референс для политики старосты.
- [Medieval refugees and settlement (Britannica)](https://www.britannica.com/topic/refugee) — референс для приёма беженцев.
