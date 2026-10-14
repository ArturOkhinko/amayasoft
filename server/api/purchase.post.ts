import type { PurchaseRequest, PurchaseResponse } from '#shared/types/paywall'
import { createPurchase, findOffer } from '../utils/db'

/** Тестовая «оплата»: никакого платёжного SDK, только запись в БД. */
const FAKE_PROVIDER_DELAY_MS = 1200
const DEVICE_ID_RE = /^[A-Za-z0-9-]{8,64}$/

function isPurchaseRequest(body: unknown): body is PurchaseRequest {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  return (
    typeof b.offerId === 'string' &&
    b.offerId.length > 0 &&
    typeof b.deviceId === 'string' &&
    DEVICE_ID_RE.test(b.deviceId) &&
    (b.simulateFailure === undefined || typeof b.simulateFailure === 'boolean')
  )
}

export default defineEventHandler(async (event): Promise<PurchaseResponse> => {
  const body = await readValidatedBody(event, isPurchaseRequest).catch(() => null)
  if (!body) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Некорректный запрос' })
  }

  const offer = findOffer(body.offerId)
  if (!offer) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Тариф не найден' })
  }

  // Имитация ответа платёжного провайдера, чтобы было видно состояние загрузки
  await new Promise((r) => setTimeout(r, FAKE_PROVIDER_DELAY_MS))

  if (body.simulateFailure) {
    throw createError({ statusCode: 502, statusMessage: 'Bad Gateway', message: 'Тестовая ошибка оплаты' })
  }

  setResponseStatus(event, 201)
  return { purchase: createPurchase(offer, body.deviceId) }
})
