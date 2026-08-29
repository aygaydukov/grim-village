# Technical Debt / TODO / Рекомендации

## Сделано недавно

- [x] Амбар: сбор, склад, еда из запаса
- [x] Семьи в инспекторе (супруг, родители, дети)
- [x] Баланс голода / регена / мягкий потолок популяции
- [x] Старт семьями, а не толпой одиночек
- [x] Карточка жителя (текст + показатели)
- [x] Выбор деревни: ресурсы, демография, список жителей
- [x] Профессии, задачи, привязка к участку (без разбредания)
- [x] **2026-07-24:** фамилии / роды по хижинам, наследование от отца
- [x] **2026-07-24:** динамический рынок труда (ежедневная перебалансировка от запасов амбара)
- [x] **2026-07-24:** `dayHistory` — снимки показателей (до 30 дней)
- [x] **2026-07-24:** headless-модуляция (`npm run simulate`) и smoke-тесты (`npm test`)
- [x] **2026-07-24:** вода убрана с центральной площади, hunger > leash, тропы и улучшенный `moveToward`
- [x] **2026-07-25:** UI летописи по `dayHistory` (инспектор «Деревня»)
- [x] **2026-07-25:** расширенные снимки дня — `birthsToday`, `deathsToday`, `highHunger`, `season`
- [x] **2026-07-25:** сезонный цикл (8 дней/сезон) и мягкий множитель regen еды (`season.ts`)
- [x] **2026-07-25 (вечер):** именованные события летописи — рождения, смерти с причиной, смена профессий (`events.ts`)
- [x] **2026-07-25 (вечер):** сохранение/загрузка мира в localStorage (`persist.ts`, кнопки в HUD)
- [x] **2026-07-25 (ночь):** сезонный шок «неурожай» — редкий regen-множитель в осень/зиму (`shocks.ts`)
- [x] **2026-07-26:** постройка хижин батраками при перенаселении (`housing.ts`, `SAVE_VERSION=3`)
- [x] **2026-07-26 (утро):** A* pathfinding — обход воды (`pathfind.ts`, интеграция в `moveToward`)
- [x] **2026-07-26 (утро):** визуал стройплощадки — рамка и прогресс-бар на карте
- [x] **2026-07-26 (вечер):** headless daemon + settlement versions + SVG snapshots; релизы только в игре
- [x] **2026-07-26 (вечер):** шкала времени — 3 года / реальные сутки (`time.ts`), сезоны 180 дн., беременность ~9 мес.
- [x] **2026-07-26 (день):** государство — десятина, казна, староста, очередь еды (`government.ts`, `SAVE_VERSION=4`)
- [x] **2026-07-26 (день):** версия игры в HUD и вкладка «История версий» (`src/version.ts`)
- [x] **2026-07-26 (вечер):** миграция при перенаселении (`migration.ts`, `SAVE_VERSION=5`)
- [x] **2026-07-26 (вечер):** политика старосты — 4 режима, динамическая десятина (`government.ts`, `SAVE_VERSION=6`)
- [x] **2026-07-27:** иммиграция беженцев при разрежении (`migration.ts`, `SAVE_VERSION=7`)
- [x] **2026-07-28:** ремесло — ремесленники, склад изделий, торговля (`craft.ts`, `SAVE_VERSION=8`)
- [x] **2026-07-28 (вечер):** караваны — сезонная торговля, кризисное зерно (`caravan.ts`, `SAVE_VERSION=9`)
- [x] **2026-07-28 (вечер):** версия поселения в HUD, аналитика причин смерти, предупреждение о миграционной нестабильности
- [x] **2026-07-29:** мастерская как здание на карте — `workshop` tile, якорь ремесленников, визуал склада (`map.ts`, `SAVE_VERSION=10`)
- [x] **2026-07-30:** расширенная торговля караванов — соль, железо, сезонные маршруты (`caravan.ts`, `resources.ts`, `SAVE_VERSION=11`)
- [x] **2026-07-31:** CI-режим 100 дней — укороченная беременность, `simulate:ci`, тест демографии
- [x] **2026-07-31:** гарантированный сезонный караван — принудительный визит в конце сезона
- [x] **2026-07-31:** тепло от полного амбара — `barnWarmthMultiplier` в `resources.ts`
- [x] **2026-08-01:** баланс 100-дн. режима — ночной отдых, экстренная еда, ранний караван соли (`behavior.ts`, `government.ts`, `caravan.ts`, v1.2.0)
- [x] **2026-08-02:** баланс 100-дн. режима — ранний перехват голода, приоритет амбара (`behavior.ts`, v1.2.1; 10→4 смерти seed=2026)
- [x] **2026-08-03:** диагностика застревания — `stuckTicks`, сброс пути, инспектор; smoke 720 дней (`behavior.ts`, `modulate.ts`, v1.2.2; 100д 0 смертей)
- [x] **2026-08-04:** эпидемии — весенний/летний шок «болезнь», соль, smoke 1440 дней (`shocks.ts`, `SAVE_VERSION=12`, v1.3.0)
- [x] **2026-08-06:** карантин и лекари-старцы при эпидемии, smoke 2160 дней (`shocks.ts`, `behavior.ts`, v1.4.0)
- [x] **2026-08-07:** визуал карантина на карте, seed в HUD, smoke 2880 дней (`renderer.ts`, `modulate.ts`, v1.5.0)
- [x] **2026-08-08:** изоляция в хижине при эпидемии (`quarantine.ts`, v1.6.0); smoke 3600 дней; локальный выбор seed
- [x] **2026-08-09:** path smoothing A* (`pathfind.ts`, v1.7.0); smoke 4320 дней; `HYPER_LONG_THRESHOLDS`
- [x] **2026-08-10:** больная изба — центр карантина (`quarantine.ts`, v1.8.0); smoke 5040 дней; `OMEGA_LONG_THRESHOLDS`; SAVE_VERSION=13
- [x] **2026-08-11:** семейный карантин — вся семья в больной избе (`quarantine.ts`, v1.9.0); smoke 5760 дней; `GIGA_LONG_THRESHOLDS`
- [x] **2026-08-12:** вторая больная изба при переполнении (`quarantine.ts`, v2.0.0); smoke 6480 дней; `TERA_LONG_THRESHOLDS`; SAVE_VERSION=14
- [x] **2026-08-13:** динамическое открытие второй избы mid-epidemic (`maybeOpenSecondSickHut`, v2.1.0); smoke 7200 дней; `PETA_LONG_THRESHOLDS`
- [x] **2026-08-14:** ранний drop при вымирании в daemon (`village-daemon.ts`, v2.2.0); smoke 7920 дней; `EXA_LONG_THRESHOLDS`
- [x] **2026-08-15:** тренды смертей/миграции в инспекторе (`dossier.ts`, v2.3.0); smoke 8640 дней; `ZETTA_LONG_THRESHOLDS`
- [x] **2026-08-16:** тренд смертей от болезни в инспекторе (`dossier.ts`, v2.4.0); smoke 9360 дней; `YOTTA_LONG_THRESHOLDS`
- [x] **2026-08-17:** тренд смертей от холода в инспекторе (`dossier.ts`, v2.5.0); smoke 10080 дней; `ROMA_LONG_THRESHOLDS`
- [x] **2026-08-19:** тренд исхода семей в инспекторе (`dossier.ts`, v2.6.0); smoke 10800 дней; `NOVA_LONG_THRESHOLDS`
- [x] **2026-08-20:** тренд рождений в инспекторе (`dossier.ts`, v2.7.0); smoke 11520 дней; `LUNA_LONG_THRESHOLDS`
- [x] **2026-08-28:** тренд нарастающего голода в инспекторе (`dossier.ts`, v2.9.0); smoke 12960 дней; `SOLA_LONG_THRESHOLDS`
- [x] **2026-08-29:** тренд нарастающего застревания в инспекторе (`dossier.ts`, v3.0.0); `stuckAgents` в dayHistory; smoke 13680 дней; `ASTRA_LONG_THRESHOLDS`

## Automation (Cursor)

- Ежедневный cloud-агент (**Medieval Society Daily**): развитие симуляции, планы + оценка целесообразности, прогон 10 дней, обновление витрины (`npm run village:status` → `docs/status.json`), коммиты в `main`.
- Репозиторий: `https://github.com/aygaydukov/grim-village` (**public**).
- Витрина GitHub Pages: https://aygaydukov.github.io/grim-village/
- CI/CD: Pages (`docs/`) + deploy `dist/` на сервер (secrets `DEPLOY_*`).
- Инструкция для промпта: [md/AUTOMATION.md](AUTOMATION.md)
- План развития: [md/DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)
- **2026-08-11:** CD снова зелёный — фикс `tsc` (`behavior.ts` unused import, `quarantine.ts` dead `"sleep"` compare после сужения типа). С v1.6.0 по v1.8.0 деплой падал после тестов на `npm run build`.

## Бэклог

- [x] Сохранение / загрузка мира
- [x] Фамилии / роды
- [x] Постройка хижин самими жителями (`housing.ts`)
- [x] Смена профессии по нужде деревни (динамический рынок труда)
- [x] Неурожай (сезонный шок regen в `shocks.ts`)
- [x] Государство — десятина, казна, староста (`government.ts`)
- [x] Версия игры и вкладка changelog (`src/version.ts`)
- [x] Миграция при перенаселении (`migration.ts`)
- [x] Политика старосты — 4 режима, динамическая десятина (`government.ts`)
- [x] Иммиграция — редкий приток беженцев (`migration.ts`)
- [x] Ремесло — ремесленники, craftStock, торговля (`craft.ts`)
- [x] Караваны — сезонные визиты, экспорт/импорт (`caravan.ts`)
- [x] Версия поселения в HUD + аналитика смертей
- [x] Мастерская как здание на карте (`workshop` tile, `workshopX/Y`)
- [x] Расширенная торговля караванов — соль, железо (`resources.ts`, `caravan.ts`)
- [x] Дописать CD: secrets `DEPLOY_*` → `45.131.42.53:/var/www/grim-village` (см. [DEPLOY.md](DEPLOY.md); один раз поднять nginx на сервере)
- [x] Болезни / эпидемии — редкий шок «болезнь» (`shocks.ts`, v1.3.0, SAVE_VERSION=12)
- [x] Smoke 1440 дней — `EXTRA_LONG_THRESHOLDS`, тест демографии (v1.3.0)
- [x] Карантин и лекари-старцы при эпидемии (v1.4.0)
- [x] Smoke 2160 дней — `ULTRA_LONG_THRESHOLDS`, тест демографии (v1.4.0)
- [x] Визуал карантина на карте при эпидемии (v1.5.0)
- [x] Smoke 2880 дней — `MEGA_LONG_THRESHOLDS`, тест демографии (v1.5.0)
- [x] Seed в HUD (read-only) (v1.5.0)
- [x] Изоляция больных хижин — механика `quarantine.ts` (v1.6.0)
- [x] Smoke 3600 дней — `SUPER_LONG_THRESHOLDS` (v1.6.0)
- [x] Выбор seed из UI — локальный «Новый мир» (v1.6.0)
- [x] Path smoothing A* — `smoothPath`, `hasLineOfSight` (v1.7.0)
- [x] Smoke 4320 дней — `HYPER_LONG_THRESHOLDS` (v1.7.0)
- [x] Больная изба — центр карантина (`quarantine.ts`, v1.8.0)
- [x] Smoke 5040 дней — `OMEGA_LONG_THRESHOLDS` (v1.8.0)
- [x] Семейный карантин в больной избе (`quarantine.ts`, v1.9.0)
- [x] Smoke 5760 дней — `GIGA_LONG_THRESHOLDS` (v1.9.0)
- [x] Вторая больная изба при переполнении (`quarantine.ts`, v2.0.0)
- [x] Smoke 6480 дней — `TERA_LONG_THRESHOLDS` (v2.0.0)
- [x] Динамическое открытие второй избы mid-epidemic — `maybeOpenSecondSickHut` (v2.1.0)
- [x] Smoke 7200 дней — `PETA_LONG_THRESHOLDS` (v2.1.0)
- [x] Ранний drop при вымирании в daemon — `village-daemon.ts` (v2.2.0)
- [x] Smoke 7920 дней — `EXA_LONG_THRESHOLDS` (v2.2.0)
- [x] Диагностика трендов миграции — `analyzeDayHistoryTrend` (v2.3.0)
- [x] Smoke 8640 дней — `ZETTA_LONG_THRESHOLDS` (v2.3.0)
- [x] Тренд смертей от болезни — `diseaseDeathsInWindow` (v2.4.0)
- [x] Smoke 9360 дней — `YOTTA_LONG_THRESHOLDS` (v2.4.0)
- [x] Тренд смертей от холода — `coldDeathsInWindow` (v2.5.0)
- [x] Smoke 10080 дней — `ROMA_LONG_THRESHOLDS` (v2.5.0)
- [x] Тренд исхода семей — `emigrationInWindow` (v2.6.0)
- [x] Smoke 10800 дней — `NOVA_LONG_THRESHOLDS` (v2.6.0)
- [x] Тренд рождений — `birthsInWindow` (v2.7.0)
- [x] Smoke 11520 дней — `LUNA_LONG_THRESHOLDS` (v2.7.0)
- [x] Тренд опустошения амбара — `barnFoodTrend` (v2.8.0)
- [x] Smoke 12240 дней — `SOL_LONG_THRESHOLDS` (v2.8.0)
- [x] Тренд нарастающего голода — `highHungerTrend` (v2.9.0)
- [x] Smoke 12960 дней — `SOLA_LONG_THRESHOLDS` (v2.9.0)
- [x] Тренд нарастающего застревания — `stuckTrend`, `stuckAgents` в dayHistory (v3.0.0)
- [x] Smoke 13680 дней — `ASTRA_LONG_THRESHOLDS` (v3.0.0)
- [ ] Звук (ветер, шаги, ночь)
- [ ] Спрайты вместо силуэтов
- [x] Pathfinding (A*) — `pathfind.ts`, кэш пути на агента
- [x] Миграция при перенаселении — `migration.ts`
- [x] Юнит-тесты симуляции в `tests/` (smoke стабильности)
- [ ] Выбор seed и размер карты из UI (интерактивный перезапуск) — seed сделан (v1.6.0); размер карты в бэклоге
- [x] Гарантированный сезонный караван — `seasonStartDay` + принудительный визит
- [x] Баланс 100-дневного обычного режима — 0 смертей на seed=2026 (v1.2.2)
- [x] Диагностика застревания — `stuckTicks`, recovery, инспектор (v1.2.2)
- [x] Smoke 720 дней — `LONG_THRESHOLDS`, тест демографии (v1.2.2)

## Риски

- Амбар сглаживает голод, но при пустом складе и выбитом лесе деревня всё ещё мрёт — так и задумано.
- Десятина 10% снижает приток в амбар, но казна подпитывает склад при кризисе — баланс проверен на 10-дневных прогонах.
- Супружество пока «мягкое»: пара закрепляется при ухаживании.
- Трупы копятся (обрезка старых тел при >40).
- Центр поселения принудительно очищается от воды (радиус ~7 клеток) — иначе голод у амбара.
- Сохранение в localStorage — только локально в браузере; экспорт файла — в бэклог.
- `SAVE_VERSION = 14` — `sickHut2X`, `sickHut2Y`; v13 — `sickHutX`, `sickHutY`; v12 — `lastEpidemicDay`, шок `epidemic`; v11 — `saltStock`, `ironStock`; v10 — `workshopX`, `workshopY`, tile `workshop`; v9 — `lastCaravanDay`, `settlementVersion`, `settlementId`; v8 — `craftStock`; v7 — `lastImmigrationDay`; v6 — `starostaPolicy`; v5 — `lastMigrationDay`; v4 — `treasury`, `starostaId`; v3 — `buildProject`, `lastHutBuiltDay`; v2 — `activeShock`; v1 — `activeShock = null`.

## Полезные ссылки

- [Vite](https://vite.dev/)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [localStorage (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [FAO — famine dynamics](https://www.fao.org/emergencies/crisis/famine/en/)
- [Medieval caravans (Britannica)](https://www.britannica.com/topic/caravan-trade-route) — сезонная торговля
