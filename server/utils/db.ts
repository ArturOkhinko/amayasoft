import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { Offer, Purchase } from '#shared/types/paywall'

/**
 * SQLite-файл. В проде путь указывает на persistent volume
 * (например, DATABASE_PATH=/data/paywall.db на Fly.io), локально — ./data.
 * Драйвер — встроенный в Node модуль node:sqlite (Node 22.13+), нативная сборка не нужна.
 */
const DB_PATH = resolve(process.env.DATABASE_PATH || './data/paywall.db')

interface OfferRow {
  id: string
  title: string
  subtitle: string
  price_rub: number
  period: 'year' | 'month'
  badge: string | null
  sort: number
  is_default: number
}

interface PurchaseRow {
  id: number
  offer_id: string
  device_id: string
  created_at: string
  title: string
  amount_rub: number
}

/** Справочник тарифов. При старте синхронизируется в таблицу offers. */
const SEED_OFFERS: Omit<OfferRow, 'sort'>[] = [
  { id: 'premium_year', title: 'Год', subtitle: '249 ₽ в месяц', price_rub: 2990, period: 'year', badge: '−50%', is_default: 1 },
  { id: 'premium_month', title: 'Месяц', subtitle: 'Списание каждый месяц', price_rub: 499, period: 'month', badge: null, is_default: 0 },
]

let db: DatabaseSync | undefined

export function useDb(): DatabaseSync {
  if (db) return db

  mkdirSync(dirname(DB_PATH), { recursive: true })
  db = new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

  db.exec(`
    CREATE TABLE IF NOT EXISTS offers (
      id         TEXT PRIMARY KEY,
      title      TEXT    NOT NULL,
      subtitle   TEXT    NOT NULL,
      price_rub  INTEGER NOT NULL,
      period     TEXT    NOT NULL CHECK (period IN ('year', 'month')),
      badge      TEXT,
      sort       INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id   TEXT NOT NULL REFERENCES offers(id),
      device_id  TEXT NOT NULL,
      amount_rub INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_purchases_device ON purchases(device_id);
  `)

  const upsert = db.prepare(`
    INSERT INTO offers (id, title, subtitle, price_rub, period, badge, sort, is_default)
    VALUES (@id, @title, @subtitle, @price_rub, @period, @badge, @sort, @is_default)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title, subtitle = excluded.subtitle, price_rub = excluded.price_rub,
      period = excluded.period, badge = excluded.badge, sort = excluded.sort,
      is_default = excluded.is_default
  `)
  db.exec('BEGIN')
  try {
    SEED_OFFERS.forEach((offer, sort) => upsert.run({ ...offer, sort }))
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }

  return db
}

/** 2990 → «2 990 ₽» (неразрывные пробелы, чтобы цена не переносилась) */
export function formatRub(value: number): string {
  return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`
}

const PERIOD_LABEL = { year: 'в год', month: 'в месяц' } as const

function toOffer(row: OfferRow): Offer {
  const priceLabel = formatRub(row.price_rub)
  const periodLabel = PERIOD_LABEL[row.period]
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    priceRub: row.price_rub,
    priceLabel,
    periodLabel,
    badge: row.badge,
    ctaLabel: `Продолжить — ${priceLabel} ${periodLabel}`,
    isDefault: row.is_default === 1,
  }
}

export function listOffers(): Offer[] {
  const rows = useDb().prepare('SELECT * FROM offers ORDER BY sort ASC').all() as unknown as OfferRow[]
  return rows.map(toOffer)
}

export function findOffer(id: string): Offer | undefined {
  const row = useDb().prepare('SELECT * FROM offers WHERE id = ?').get(id) as unknown as OfferRow | undefined
  return row ? toOffer(row) : undefined
}

const PURCHASE_SELECT = `
  SELECT p.id, p.offer_id, p.device_id, p.amount_rub, p.created_at, o.title
  FROM purchases p JOIN offers o ON o.id = p.offer_id`

export function createPurchase(offer: Offer, deviceId: string): Purchase {
  const conn = useDb()
  const createdAt = new Date().toISOString()
  const { lastInsertRowid } = conn
    .prepare('INSERT INTO purchases (offer_id, device_id, amount_rub, created_at) VALUES (?, ?, ?, ?)')
    .run(offer.id, deviceId, offer.priceRub, createdAt)

  const row = conn.prepare(`${PURCHASE_SELECT} WHERE p.id = ?`).get(lastInsertRowid) as unknown as PurchaseRow
  return toPurchase(row)
}

/** Последняя покупка устройства — для «Восстановить покупки». */
export function findLatestPurchase(deviceId: string): Purchase | undefined {
  const row = useDb()
    .prepare(`${PURCHASE_SELECT} WHERE p.device_id = ? ORDER BY p.id DESC LIMIT 1`)
    .get(deviceId) as unknown as PurchaseRow | undefined
  return row ? toPurchase(row) : undefined
}


function toPurchase(row: PurchaseRow): Purchase {
  return {
    id: row.id,
    offerId: row.offer_id,
    offerTitle: row.title,
    priceLabel: formatRub(row.amount_rub),
    deviceId: row.device_id,
    createdAt: row.created_at,
  }
}
