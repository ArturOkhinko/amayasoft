# ---------- build ----------
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN npm run build

# ---------- runtime ----------
FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/paywall.db
COPY --from=build /app/.output ./.output
RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
