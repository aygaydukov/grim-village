# Automation: Medieval Society Daily

Ежедневный cloud-агент обновляет симуляцию и **публичную витрину** GitHub Pages.

Витрина: https://aygaydukov.github.io/grim-village/  
Репо: https://github.com/aygaydukov/grim-village

## Добавить в промпт automation

После модуляции на 10 дней и перед коммитом:

1. Выполни `npm run village:status` (обновит `docs/status.json`).
2. Убедись, что `docs/index.html` на месте; при необходимости улучши тексты витрины, не ломая разметку.
3. Закоммить и запушь в `main` вместе с кодом симуляции: изменения в `docs/` триггерят публикацию Pages.
4. В коммите кратко укажи итог прогона (стабильно/нет, живые, амбар).

## Локально

```bash
npm run village:status
# открыть docs/index.html через любой static server, либо после push — Pages
```

## CI/CD

- `.github/workflows/pages.yml` — деплой `docs/` на GitHub Pages
- `.github/workflows/deploy-server.yml` — `npm test` + `npm run build` + SCP `dist/` на сервер (нужны secrets)
