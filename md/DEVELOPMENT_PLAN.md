# План развития «Мрачной деревни»

Обновлено: **2026-07-27** (ежедневный прогон Medieval Society Daily, v0.6.0).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Иммиграция беженцев | **Сделано (v0.6.0)** | Симметрия исходу: приток при ratio < 2.0/хижину, амбар ≥ 35, кулдаун 8 дн. |
| Эпидемии | **Отложить** | Иммиграция + миграция + неурожай дают демографическую вариативность; двойной шок смертности рискован для 10-дневного smoke. |
| Path smoothing A* | **Отложить** | Pathfinding работает; сглаживание — косметика движения. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Выбор seed из UI | **Отложить** | Headless daemon хранит seed на сервере. |
| Ремесло (кроме еды) | **Берём следующим** | Казна и торговля — логичное продолжение после стабилизации демографии. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |
| 100-дневный баланс рождений | **Частично** | Иммиграция смягчает спад; беременность 540 дн. — рождения в 100-дн. smoke невозможны без укорочения цикла. |

## Следующие циклы (приоритет)

1. **Ремесло** — кроме склада еды; связь с казной и рынком труда.
2. **Эпидемии** — редкий шок смертности (отдельно от неурожая).
3. **Выбор seed и размер карты из UI**.
4. **Path smoothing** — сглаживание углов A* для более естественного движения.
5. **Укороченный smoke-прогон беременности** — отдельный тестовый режим или параметр для CI 100-дн.
6. **Торговля с соседями** — обмен излишками амбара на ремесленные товары.

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

Smoke-тест CI — 10 дней. На 100 днях все seed дают спад без рождений: **беременность = 540 игровых дней** — структурный дисбаланс, не регрессия. Иммиграция (v0.6.0) частично компенсирует исходы; полный долгий баланс — через отдельный CI-режим с укороченной беременностью.

## Полезные ссылки

- [Might & Fealty — economy loop](https://mightandfealty.com/en/manual/economy) — связь еды и населения.
- [Village Craft — logistics](https://watchdocumentariesgames.github.io/village-craft.html) — склады, бутылочные горлышки.
- [Multilevel demography + food (SocArXiv)](https://ideas.repec.org/p/osf/socarx/5be6a.html) — agent-based agrarian model.
- [Seasonal agriculture (Wikipedia)](https://en.wikipedia.org/wiki/Crop_calendar) — календарь посевов/урожая как референс для сезонов.
- [localStorage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — хранение сохранений в браузере.
- [Crop failure / famine dynamics (FAO)](https://www.fao.org/emergencies/crisis/famine/en/) — референс для редких продовольственных шоков.
- [Medieval village layout (Britannica)](https://www.britannica.com/topic/manorialism) — расширение поселения вокруг амбара.
- [A* pathfinding (Red Blob Games)](https://www.redblobgames.com/pathfinding/a-star/introduction.html) — референс для обхода воды на карте.
- [Medieval tithe (Britannica)](https://www.britannica.com/topic/tithe) — референс для десятины и казны.
- [Medieval migration patterns (Britannica)](https://www.britannica.com/topic/migration-human-behavior) — референс для исхода семей при перенаселении.
- [Medieval governance (Britannica)](https://www.britannica.com/topic/manorialism/Manorial-structure-and-land-tenure) — референс для политики старосты.
- [Medieval refugees and settlement (Britannica)](https://www.britannica.com/topic/refugee) — референс для приёма беженцев.
