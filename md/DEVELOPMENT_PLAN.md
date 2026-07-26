# План развития «Мрачной деревни»

Обновлено: **2026-07-26** (ежедневный прогон Medieval Society Daily).

## Цель

Устойчивое, саморазвивающееся средневековое общество: еда → люди → труд → запасы → снова еда (замкнутый цикл с нелинейным равновесием, см. Malthusian feedback в симуляциях agrarian societies).

## Оценка целесообразности (этот цикл)

| Задача | Решение | Обоснование |
|--------|---------|-------------|
| Pathfinding A* | **Сделано** | Батраки и сборщики обходят воду; при блокировке прямого шага — кэшированный A* (8-связность). |
| Визуал стройки | **Сделано** | Пунктирная рамка + полоса прогресса на стройплощадке. |
| Государство / налог | **Берём следующим** | Нужна политика земли и очередь на жильё; pathfinding снимает блокер стройки. |
| Эпидемии | **Отложить** | Неурожай уже даёт вариативность; двойной шок рискован. |
| Спрайты / PixiJS | **Отложить** | Графика не блокирует симуляцию. |
| Выбор seed из UI | **Отложить** | Save/load уже хранит seed. |
| Звук | **Отказ на сейчас** | Нет ценности для автоматического прогона. |

## Следующие циклы (приоритет)

1. **Государство / налог** — доля урожая «старосте», очередь на еду, влияние на стройку.
2. **Эпидемии** — редкий шок смертности (отдельно от неурожая).
3. **Выбор seed и размер карты из UI**.
4. **Ремесло** — кроме склада еды.
5. **Миграция при перенаселении** — уход из деревни при критическом дефиците жилья.
6. **Path smoothing** — сглаживание углов A* для более естественного движения.

## Метрики стабильности (10 дней)

- Живых ≥ 50% от старта (≥ 11 при 22).
- Смертей ≤ 40% от старта за прогон.
- Амбар ≥ 8 мер к концу.
- Средний голод < 78.
- Население не вымерло.

Команда проверки: `npm run simulate` и `npm test`.

## Полезные ссылки

- [Might & Fealty — economy loop](https://mightandfealty.com/en/manual/economy) — связь еды и населения.
- [Village Craft — logistics](https://watchdocumentariesgames.github.io/village-craft.html) — склады, бутылочные горлышки.
- [Multilevel demography + food (SocArXiv)](https://ideas.repec.org/p/osf/socarx/5be6a.html) — agent-based agrarian model.
- [Seasonal agriculture (Wikipedia)](https://en.wikipedia.org/wiki/Crop_calendar) — календарь посевов/урожая как референс для сезонов.
- [localStorage API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — хранение сохранений в браузере.
- [Crop failure / famine dynamics (FAO)](https://www.fao.org/emergencies/crisis/famine/en/) — референс для редких продовольственных шоков.
- [Medieval village layout (Britannica)](https://www.britannica.com/topic/manorialism) — расширение поселения вокруг амбара.
- [A* pathfinding (Red Blob Games)](https://www.redblobgames.com/pathfinding/a-star/introduction.html) — референс для обхода воды на карте.
