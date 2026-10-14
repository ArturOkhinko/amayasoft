import type { PurchaseResponse } from '#shared/types/paywall'
import { findLatestPurchase } from '../utils/db'

const DEVICE_ID_RE = /^[A-Za-z0-9-]{8,64}$/

/** «Восстановить покупки»: ищем последнюю тестовую покупку этого устройства. */
export default defineEventHandler(async (event): Promise<PurchaseResponse> => {
  const body = await readBody<{ deviceId?: unknown }>(event).catch(() => null)
  const deviceId = typeof body?.deviceId === 'string' ? body.deviceId : ''
  if (!DEVICE_ID_RE.test(deviceId)) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Некорректный запрос' })
  }

  const purchase = findLatestPurchase(deviceId)
  if (!purchase) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', message: 'Покупок не найдено' })
  }
  return { purchase }
})
