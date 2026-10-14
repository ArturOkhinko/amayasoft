<script setup lang="ts">
import type { OffersResponse, Purchase, PurchaseResponse, PurchaseStatus } from '#shared/types/paywall'

useHead({
  htmlAttrs: { lang: 'ru' },
  title: 'Premium — оформление подписки',
})

/* ---------- Тарифы: GET /api/offers (рендерятся уже на сервере) ---------- */
const { data, status: offersStatus, refresh: reloadOffers } = await useFetch<OffersResponse>('/api/offers', {
  key: 'offers',
  default: () => ({ offers: [] }),
})
const offers = computed(() => data.value?.offers ?? [])

const selectedId = ref<string | null>(null)
watch(
  offers,
  (list) => {
    if (!list.some((o) => o.id === selectedId.value)) {
      selectedId.value = (list.find((o) => o.isDefault) ?? list[0])?.id ?? null
    }
  },
  { immediate: true },
)

/* ---------- Покупка: POST /api/purchase ---------- */
const purchaseStatus = ref<PurchaseStatus>('idle')
const errorText = ref('')
const purchase = ref<Purchase | null>(null)

// ?fail=1 — тестовый сценарий ошибки оплаты
const simulateFailure = useRequestURL().searchParams.get('fail') === '1'
const getDeviceId = useDeviceId()

function selectOffer(id: string) {
  if (purchaseStatus.value === 'loading') return
  selectedId.value = id
  if (purchaseStatus.value === 'error') purchaseStatus.value = 'idle'
}

async function buy() {
  if (!selectedId.value || purchaseStatus.value === 'loading') return
  purchaseStatus.value = 'loading'
  restoreMessage.value = ''
  try {
    const res = await $fetch<PurchaseResponse>('/api/purchase', {
      method: 'POST',
      body: { offerId: selectedId.value, deviceId: getDeviceId(), simulateFailure },
    })
    purchase.value = res.purchase
    purchaseStatus.value = 'idle'
  } catch (err) {
    errorText.value = purchaseErrorText(err)
    purchaseStatus.value = 'error'
  }
}

/* ---------- Восстановление: POST /api/restore ---------- */
const restoring = ref(false)
const restoreMessage = ref('')

async function restore() {
  if (restoring.value) return
  restoring.value = true
  restoreMessage.value = ''
  try {
    const res = await $fetch<PurchaseResponse>('/api/restore', {
      method: 'POST',
      body: { deviceId: getDeviceId() },
    })
    purchase.value = res.purchase
    purchaseStatus.value = 'idle'
  } catch (err) {
    const status = (err as { statusCode?: number })?.statusCode
    restoreMessage.value =
      status === 404 ? 'На этом устройстве покупок не найдено' : 'Не удалось проверить покупки. Попробуйте позже.'
  } finally {
    restoring.value = false
  }
}

function close() {
  if (import.meta.client && window.history.length > 1) window.history.back()
}

function done() {
  purchase.value = null
  purchaseStatus.value = 'idle'
}
</script>

<template>
  <SuccessView v-if="purchase" :purchase="purchase" @done="done" />
  <PaywallView
    v-else
    :offers="offers"
    :offers-pending="offersStatus === 'pending' || offersStatus === 'idle'"
    :offers-failed="offersStatus === 'error'"
    :selected-id="selectedId"
    :status="purchaseStatus"
    :error-text="errorText"
    :restoring="restoring"
    :restore-message="restoreMessage"
    @select="selectOffer"
    @purchase="buy"
    @close="close"
    @restore="restore"
    @reload-offers="reloadOffers()"
  />
</template>
