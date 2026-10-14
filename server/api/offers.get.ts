import type { OffersResponse } from '#shared/types/paywall'
import { listOffers } from '../utils/db'

export default defineEventHandler((): OffersResponse => {
  return { offers: listOffers() }
})
