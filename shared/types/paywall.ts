/** Тариф, который отдаёт GET /api/offers. Все подписи готовы к показу. */
export interface Offer {
  id: string
  title: string
  /** Строка под названием: «249 ₽ в месяц», «Списание каждый месяц» */
  subtitle: string
  priceRub: number
  /** «2 990 ₽» */
  priceLabel: string
  /** «в год» / «в месяц» */
  periodLabel: string
  /** «−50%» или null */
  badge: string | null
  /** Текст CTA, когда тариф выбран: «Продолжить — 2 990 ₽ в год» */
  ctaLabel: string
  /** Тариф, выбранный по умолчанию */
  isDefault: boolean
}

export interface OffersResponse {
  offers: Offer[]
}

export interface PurchaseRequest {
  offerId: string
  /** Условный идентификатор устройства (UUID из localStorage) */
  deviceId: string
  /** Тестовый флаг: сервер вернёт ошибку, ничего не сохранив */
  simulateFailure?: boolean
}

export interface Purchase {
  id: number
  offerId: string
  offerTitle: string
  priceLabel: string
  deviceId: string
  /** ISO 8601, UTC */
  createdAt: string
}

export interface PurchaseResponse {
  purchase: Purchase
}

/** Состояние кнопки покупки на экране пейволла */
export type PurchaseStatus = 'idle' | 'loading' | 'error'
