# Paywall для детской игры — Nuxt 4 + TypeScript + SQLite

| | |
| --- | --- |
| **Демо** | https://paywall.okhinko-test-task.ru (резервный адрес: http://191.44.47.199) |
| **Макет** | [Figma «Paywall — mobile»](https://www.figma.com/design/pfNVucVOFjpRHAquVMjS2N) — 4 экрана 390×844: выбор тарифа, загрузка, ошибка, успех |
| **Код** | https://github.com/ArturOkhinko/amayasoft |

Сценарии: выбрать тариф → «Продолжить» → экран успеха. Ошибка оплаты — `/?fail=1`. После покупки работает «Восстановить покупки». Покупка тестовая, без платёжного SDK и ключей.

## Запуск локально

Нужен Node.js 22.13+.

```bash
npm install
npm run dev    # http://localhost:3000, БД создастся в ./data/paywall.db
```

Через Docker: `docker build -t paywall . && docker run -p 3000:3000 -v "$(pwd)/data:/data" paywall`.

## Где что лежит

- **Frontend:** `app/app.vue` — состояние экрана (тарифы, покупка, восстановление); `app/components/` — `PaywallView`, `SuccessView`, `PlanCard`, `PrimaryButton`, `ErrorAlert`; стили и токены из Figma — `app/assets/css/`.
- **Server routes:** `server/api/offers.get.ts` (`GET /api/offers`), `server/api/purchase.post.ts` (`POST /api/purchase`), `server/api/restore.post.ts` (`POST /api/restore`).
- **БД:** `server/utils/db.ts` — схема, тарифы, запись покупок. Таблица `purchases`: `offer_id`, `device_id` (UUID устройства из `localStorage`), `amount_rub`, `created_at`.
- **Общие типы** клиента и сервера: `shared/types/paywall.ts`.

## Деплой и БД: что выбрал и почему

- **SQLite** через встроенный `node:sqlite`: для одной таблицы покупок не нужен отдельный сервис, нет нативных зависимостей, файл БД лежит на диске сервера и переживает перезапуски.
- **VPS (Sprintbox) + Docker + Caddy:** полноценный Node-сервер, поэтому server routes и запись в файл работают без ограничений serverless. Caddy сам выпускает HTTPS-сертификат. Пошаговая инструкция — [docs/DEPLOY.md](docs/DEPLOY.md), обновление — `./deploy/deploy.sh`.

## AI-инструменты и что проверил сам

- **Claude** (через Figma MCP): отрисовка макета в Figma, генерация кода Nuxt и серверной части, инструкции по деплою.
- **Проверил сам:**
  - запуск локально и на сервере;
  - ответ `GET /api/offers` на проде;
  - сценарии покупки, ошибки и восстановления в браузере;
  - запись покупки в SQLite на сервере (`sqlite3 … "SELECT * FROM purchases"`);
  - отображение на мобильной ширине.
- **Сверка с Figma:** скриншоты 390×844 попиксельно сравнены с экспортом из Figma — совпадение 99,2–99,7 % (допуск 1 px на сглаживание шрифта), координаты текстов совпадают в пределах 1 px. Сравнения лежат в `docs/compare`.

## Что сделал бы ещё за 2 часа

1. **Родительский контроль** перед покупкой: простой вопрос «для взрослых» — стандарт для детских приложений и требование сторов.
2. **Мост в нативное приложение:** CTA отправляет `postMessage` в webview, покупка проходит через IAP стора, сервер проверяет чек.
3. **Идемпотентность `POST /api/purchase`:** ключ запроса, чтобы двойной тап или повтор после таймаута не создавал дубль.
4. **Тесты:** e2e на Playwright (успех, ошибка, восстановление) и визуальная регрессия против экспорта Figma в CI.
5. **Сборка Docker-образа в GitHub Actions:** Nuxt на слабом VPS собирается слишком долго.
