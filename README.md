# Paywall — Nuxt 4 + TypeScript + SQLite

Мобильный экран покупки подписки по макету
[Figma «Paywall — mobile»](https://www.figma.com/design/pfNVucVOFjpRHAquVMjS2N).
Frontend и backend живут в одном Nuxt-проекте, покупка тестовая (без платёжного SDK и реальных денег).

## Запуск

```bash
npm install
npm run dev          # http://localhost:3000
```

Продакшен-сборка:

```bash
npm run build
DATABASE_PATH=./data/paywall.db npm start
```

Нужен Node.js 22.13+ (рекомендуется 24 LTS): база работает на встроенном модуле `node:sqlite`, нативных зависимостей нет.

## Сценарии для проверки

| Что | Как |
| --- | --- |
| Успешная покупка | выбрать тариф → «Продолжить» → экран «Premium активирован» |
| Загрузка | после нажатия CTA сервер отвечает ~1,2 с, кнопка показывает спиннер, тарифы и ссылки заблокированы |
| Ошибка оплаты | открыть `/?fail=1` и нажать CTA → плашка ошибки и кнопка «Повторить оплату» |
| Восстановить покупки | после покупки обновить страницу → «Восстановить покупки» → показывается последняя покупка этого устройства |
| Ошибка загрузки тарифов | если `GET /api/offers` упал — плашка «Не удалось загрузить тарифы» с кнопкой «Повторить» |

## API (server routes)

| Метод | Путь | Описание |
| --- | --- | --- |
| GET | `/api/offers` | список тарифов из БД: `{ offers: Offer[] }` |
| POST | `/api/purchase` | `{ offerId, deviceId, simulateFailure? }` → `201 { purchase }`; 400 — невалидный запрос, 404 — нет тарифа, 502 — тестовая ошибка |
| POST | `/api/restore` | `{ deviceId }` → `{ purchase }` (последняя покупка) или 404 |

Типы запросов и ответов общие для клиента и сервера: `shared/types/paywall.ts`.

`deviceId` — условный идентификатор устройства: UUID, который создаётся в браузере и хранится в `localStorage`.

## База данных

SQLite через встроенный в Node модуль `node:sqlite`. Файл задаётся переменной `DATABASE_PATH` (по умолчанию `./data/paywall.db`).
Схема создаётся автоматически при первом запросе, тарифы синхронизируются из `server/utils/db.ts`.

```sql
offers(id TEXT PK, title, subtitle, price_rub, period, badge, sort, is_default)
purchases(id INTEGER PK AUTOINCREMENT, offer_id → offers.id, device_id, amount_rub, created_at ISO-8601)
```

Посмотреть покупки:

```bash
sqlite3 data/paywall.db "SELECT * FROM purchases ORDER BY id DESC LIMIT 10;"
```

## Деплой (Fly.io, SQLite на persistent volume)

```bash
fly launch --no-deploy --copy-config        # имя приложения в fly.toml можно поменять
fly volumes create paywall_data --size 1    # том монтируется в /data
fly deploy
```

В `fly.toml` уже прописаны том `/data` и `DATABASE_PATH=/data/paywall.db`, поэтому покупки переживают
передеплой и перезапуск машины. Используется одна машина: SQLite не рассчитан на запись из нескольких инстансов.

Тот же `Dockerfile` подходит для Railway или Render: подключите volume/disk в `/data` и задайте `DATABASE_PATH=/data/paywall.db`.

## Вёрстка и соответствие макету

- Mobile-first: базовые стили рассчитаны на 360–430 px; на широких экранах колонка ограничена 430 px и центрирована.
  Ниже 360 px боковые отступы уменьшаются до 16 px.
- Все размеры, цвета, радиусы и межстрочные интервалы перенесены из Figma 1:1, токены лежат в `app/assets/css/main.css`.
- Зоны нажатия: CTA 56 px, крестик 44×44, «Восстановить покупки» 44 px в высоту, карточка тарифа целиком (76 px).
- Обводка карточек сделана через `box-shadow: inset`, как inside-stroke в Figma: при выборе тарифа размеры не меняются.
- Шрифт Inter (латиница + кириллица) подключён локально из `public/fonts`.
- Доступность: тарифы — `radiogroup` со стрелками, у ошибок `role="alert"`, после успешной покупки фокус переводится на заголовок.

Сверка с макетом на 390×844 (Chromium, DPR 1, пиксель совпадает, если Δ ≤ 32 с допуском 1 px на сглаживание шрифта):

| Экран | Совпадение |
| --- | --- |
| Выбор тарифа | 99,32 % |
| Загрузка | 99,42 % |
| Ошибка | 99,20 % |
| Успех | 99,71 % |

Координаты всех текстовых блоков совпадают с Figma с точностью до 1 px. Оставшееся расхождение даёт
растеризация шрифта (Figma и браузер по-разному сглаживают глифы). Сравнения лежат в `docs/compare`
(слева Figma, в центре вёрстка, справа красным отличающиеся пиксели), рендеры макета — в `docs/figma`.

## Структура

```
app/
  app.vue                  состояние экрана: тарифы, покупка, восстановление
  components/              PaywallView, SuccessView, PlanCard, PrimaryButton, ErrorAlert, AppIcon
  composables/useDeviceId.ts
  utils/format.ts
  assets/css/              токены и стили экрана
server/
  api/offers.get.ts
  api/purchase.post.ts
  api/restore.post.ts
  utils/db.ts              SQLite: схема, тарифы, покупки
shared/types/paywall.ts    общие типы клиента и сервера
```
