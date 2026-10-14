# Paywall — Nuxt 4 + TypeScript + SQLite

Тестовое задание: мобильный экран покупки подписки. Макет в Figma, вёрстка на Nuxt 4, server routes, запись тестовой покупки в SQLite, деплой на VPS.

| | |
| --- | --- |
| **Демо** | https://paywall.okhinko-test-task.ru (пока DNS не обновился — http://191.44.47.199) |
| **Макет** | [Figma «Paywall — mobile»](https://www.figma.com/design/pfNVucVOFjpRHAquVMjS2N) |
| **Репозиторий** | https://github.com/ArturOkhinko/amayasoft |

«Покупка» — тестовая операция: никакого платёжного SDK, реальных денег и секретных ключей.

## Что проверить

| Сценарий | Как |
| --- | --- |
| Выбор тарифа | карточки «Год» / «Месяц», выбранная выделена обводкой, заливкой и галочкой; текст CTA меняется вместе с ценой |
| Успешная покупка | «Продолжить» → спиннер ~1,2 с → экран «Premium активирован» с номером покупки и датой |
| Ошибка оплаты | открыть `/?fail=1` и нажать CTA → плашка ошибки и кнопка «Повторить оплату», запись в БД не создаётся |
| Восстановить покупки | после покупки обновить страницу → «Восстановить покупки» → показывается последняя покупка этого устройства |
| Ошибка загрузки тарифов | если `GET /api/offers` не ответил — плашка «Не удалось загрузить тарифы» и кнопка «Повторить» |

## Макет

В Figma четыре экрана 390×844: выбор тарифа, загрузка, ошибка, успех. Карточка тарифа и кнопка — компоненты с вариантами (`Default / Selected`, `Default / Loading`).

- Иерархия: заголовок → одна строка ценности → 3 преимущества → тарифы → CTA внизу, в зоне большого пальца.
- Зоны нажатия: CTA 56 px, крестик 44×44, «Восстановить покупки» 44 px в высоту, карточка тарифа кликабельна целиком (76 px).
- В состоянии загрузки тарифы, крестик и ссылка приглушены и заблокированы; при ошибке выбранный тариф сохраняется.

## Стек и архитектура

- **Nuxt 4 + TypeScript** — фронтенд и backend (Nitro server routes) в одном проекте.
- **SQLite** через встроенный в Node модуль `node:sqlite` — без нативных зависимостей и внешних сервисов.
- **Docker + Caddy** на VPS: Caddy принимает 80/443 и выпускает HTTPS-сертификат, приложение работает в контейнере, файл БД лежит на диске сервера.

```
Браузер ──HTTPS──▶ Caddy (:443) ──▶ Docker: Nuxt/Nitro (:3000) ──▶ /opt/paywall-data/paywall.db
```

### API

| Метод | Путь | Ответ |
| --- | --- | --- |
| GET | `/api/offers` | `{ offers: Offer[] }` — тарифы из БД |
| POST | `/api/purchase` | тело `{ offerId, deviceId, simulateFailure? }` → `201 { purchase }`; 400 — невалидный запрос, 404 — нет тарифа, 502 — тестовая ошибка |
| POST | `/api/restore` | тело `{ deviceId }` → `{ purchase }` (последняя покупка) или 404 |

Типы общие для клиента и сервера: `shared/types/paywall.ts`. `deviceId` — условный идентификатор устройства: UUID, который генерируется в браузере и хранится в `localStorage`.

### База данных

Файл задаётся переменной `DATABASE_PATH` (по умолчанию `./data/paywall.db`). Схема создаётся при первом запросе, тарифы синхронизируются из `server/utils/db.ts`.

```sql
offers    (id TEXT PK, title, subtitle, price_rub, period, badge, sort, is_default)
purchases (id INTEGER PK AUTOINCREMENT,
           offer_id   TEXT → offers.id,
           device_id  TEXT,
           amount_rub INTEGER,
           created_at TEXT  -- ISO 8601, UTC)
```

## Как запустить

### Требования

- Node.js **22.13+** (рекомендуется 24 LTS) — проверить: `node -v`
- npm 10+
- Для варианта с Docker — Docker Desktop / Docker Engine

### 1. Режим разработки

```bash
git clone https://github.com/ArturOkhinko/amayasoft.git
cd amayasoft
npm install
npm run dev
```

Откройте http://localhost:3000. Сервер перезапускается при изменении файлов.

База создаётся автоматически в `./data/paywall.db` при первом запросе — ничего настраивать не нужно. Другой путь к файлу БД можно задать через `.env`:

```bash
cp .env.example .env    # DATABASE_PATH=./data/paywall.db
```

В консоли будет предупреждение `ExperimentalWarning: SQLite is an experimental feature` — это нормально для `node:sqlite`.

### 2. Продакшен-сборка без Docker

```bash
npm install
npm run build
DATABASE_PATH=./data/paywall.db PORT=3000 node .output/server/index.mjs
```

### 3. Через Docker

```bash
docker build -t paywall .
docker run -d --name paywall -p 3000:3000 -v "$(pwd)/data:/data" paywall
```

Приложение — на http://localhost:3000, файл БД — в `./data/paywall.db` на хосте.
Остановить: `docker rm -f paywall`.

### Проверка, что всё работает

```bash
curl http://localhost:3000/api/offers
curl -X POST http://localhost:3000/api/purchase \
  -H 'Content-Type: application/json' \
  -d '{"offerId":"premium_year","deviceId":"test-device-0001"}'
sqlite3 data/paywall.db "SELECT * FROM purchases;"
```

Первый запрос вернёт два тарифа, второй — созданную покупку (`201`), третий покажет её в БД.

### Полезные команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | dev-сервер с hot reload |
| `npm run build` | сборка в `.output/` |
| `npm start` | запуск собранного приложения |
| `npm run typecheck` | проверка типов |

## Деплой

Сервис развёрнут на VPS (Ubuntu 24.04, Sprintbox) в Docker, перед ним стоит Caddy.

### Первый запуск на чистом сервере

```bash
# Docker, Caddy, sqlite3
curl -fsSL https://get.docker.com | sh
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg sqlite3
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update && apt install -y caddy

# Код и данные
git clone https://github.com/ArturOkhinko/amayasoft.git ~/amayasoft
mkdir -p /opt/paywall-data

# Приложение
cd ~/amayasoft && ./deploy/deploy.sh

# Прокси и HTTPS
cp deploy/Caddyfile /etc/caddy/Caddyfile && systemctl reload caddy
```

Для домена нужна A-запись `paywall` → IP сервера. Порты 80 и 443 должны быть открыты.

### Обновление

```bash
cd ~/amayasoft && ./deploy/deploy.sh
```

Скрипт делает `git pull`, пересобирает образ и перезапускает контейнер. База в `/opt/paywall-data` не затрагивается: покупки переживают обновления и перезагрузку сервера (`--restart unless-stopped`).

> Сборка Nuxt требует ~1–2 ГБ RAM. На слабом сервере быстрее собрать локально (`npm run build`) и залить готовую папку: `rsync -az --delete .output/ root@SERVER:/opt/paywall-app/.output/`, затем запустить её в `node:24-bookworm-slim` с теми же томами.

### Проверка, что покупки пишутся в БД

```bash
sqlite3 /opt/paywall-data/paywall.db "SELECT * FROM purchases ORDER BY id DESC LIMIT 10;"
docker logs paywall --tail 50
```

## Вёрстка и соответствие макету

- Mobile-first: базовые стили рассчитаны на 360–430 px; на широких экранах колонка ограничена 430 px и центрирована, ниже 360 px отступы уменьшаются до 16 px.
- Размеры, цвета, радиусы и межстрочные интервалы перенесены из Figma 1:1, токены — в `app/assets/css/main.css`.
- Обводка карточек — `box-shadow: inset`, как inside-stroke в Figma: при выборе тарифа размеры не меняются.
- Шрифт Inter (латиница + кириллица) подключён локально из `public/fonts`.
- Доступность: тарифы — `radiogroup` со стрелками, ошибки — `role="alert"`, после покупки фокус переходит на заголовок.

Сверка на 390×844 (Chromium, DPR 1; пиксель совпадает при Δ ≤ 32 с допуском 1 px на сглаживание шрифта):

| Экран | Совпадение |
| --- | --- |
| Выбор тарифа | 99,32 % |
| Загрузка | 99,42 % |
| Ошибка | 99,20 % |
| Успех | 99,71 % |

Координаты всех текстовых блоков совпадают с Figma в пределах 1 px; остаток — разница сглаживания шрифта в Figma и браузере. Сравнения — в `docs/compare` (слева Figma, в центре вёрстка, справа красным отличающиеся пиксели), рендеры макета — в `docs/figma`.

## Структура

```
app/
  app.vue                   состояние экрана: тарифы, покупка, восстановление
  components/               PaywallView, SuccessView, PlanCard, PrimaryButton, ErrorAlert, AppIcon
  composables/useDeviceId.ts
  utils/format.ts
  assets/css/               токены и стили экрана
server/
  api/offers.get.ts
  api/purchase.post.ts
  api/restore.post.ts
  utils/db.ts               SQLite: схема, тарифы, покупки
shared/types/paywall.ts     общие типы клиента и сервера
deploy/
  deploy.sh                 обновление на сервере
  Caddyfile                 конфиг reverse proxy + HTTPS
Dockerfile
```
