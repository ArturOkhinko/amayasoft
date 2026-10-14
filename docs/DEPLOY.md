# Деплой на VPS

Сервис развёрнут на VPS (Ubuntu 24.04, Sprintbox) в Docker, перед ним стоит Caddy.

## Первый запуск на чистом сервере

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

## Обновление

```bash
cd ~/amayasoft && ./deploy/deploy.sh
```

Скрипт делает `git pull`, пересобирает образ и перезапускает контейнер. База в `/opt/paywall-data` не затрагивается: покупки переживают обновления и перезагрузку сервера (`--restart unless-stopped`).

> Сборка Nuxt требует ~1–2 ГБ RAM. На слабом сервере быстрее собрать локально (`npm run build`) и залить готовую папку: `rsync -az --delete .output/ root@SERVER:/opt/paywall-app/.output/`, затем запустить её в `node:24-bookworm-slim` с теми же томами.

## Проверка, что покупки пишутся в БД

```bash
sqlite3 /opt/paywall-data/paywall.db "SELECT * FROM purchases ORDER BY id DESC LIMIT 10;"
docker logs paywall --tail 50
```
