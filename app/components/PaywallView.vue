<script setup lang="ts">
import type { Offer, PurchaseStatus } from '#shared/types/paywall'

const props = defineProps<{
  offers: Offer[]
  offersPending: boolean
  offersFailed: boolean
  selectedId: string | null
  status: PurchaseStatus
  errorText: string
  restoring: boolean
  restoreMessage: string
}>()

const emit = defineEmits<{
  select: [id: string]
  purchase: []
  close: []
  restore: []
  reloadOffers: []
}>()

const BENEFITS = ['Безлимитные проекты и папки', 'Синхронизация на всех устройствах', 'Без рекламы']

const busy = computed(() => props.status === 'loading' || props.restoring)
const selectedOffer = computed(() => props.offers.find((o) => o.id === props.selectedId) ?? null)
const ctaLabel = computed(() => {
  if (props.status === 'error') return 'Повторить оплату'
  return selectedOffer.value?.ctaLabel ?? 'Продолжить'
})

const plansRef = ref<HTMLElement | null>(null)

/** Стрелки переключают тариф, как в нативной radio-группе */
function onPlansKeydown(e: KeyboardEvent) {
  const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight'
  const backward = e.key === 'ArrowUp' || e.key === 'ArrowLeft'
  if ((!forward && !backward) || busy.value || props.offers.length === 0) return
  e.preventDefault()
  const index = props.offers.findIndex((o) => o.id === props.selectedId)
  const next = props.offers[(index + (forward ? 1 : -1) + props.offers.length) % props.offers.length]
  if (!next) return
  emit('select', next.id)
  nextTick(() => plansRef.value?.querySelector<HTMLElement>(`[data-offer-id="${next.id}"]`)?.focus())
}
</script>

<template>
  <main class="screen" :aria-busy="busy || undefined">
    <div class="screen__top">
      <nav class="nav">
        <button type="button" class="icon-button" aria-label="Закрыть" :disabled="busy" @click="emit('close')">
          <AppIcon name="close" />
        </button>
      </nav>

      <header class="header">
        <h1 class="title">Откройте Premium</h1>
        <p class="lead">Все функции без ограничений — работайте быстрее и без рекламы.</p>
      </header>

      <ul class="benefits">
        <li v-for="benefit in BENEFITS" :key="benefit" class="benefits__item">
          <AppIcon name="benefit" class="benefits__icon" />
          <span>{{ benefit }}</span>
        </li>
      </ul>

      <ErrorAlert
        v-if="offersFailed"
        title="Не удалось загрузить тарифы"
        text="Проверьте подключение к интернету."
        action-label="Повторить"
        @action="emit('reloadOffers')"
      />

      <div v-else-if="offersPending && offers.length === 0" class="plans" aria-label="Загружаем тарифы">
        <div class="plan plan--skeleton" />
        <div class="plan plan--skeleton" />
      </div>

      <div
        v-else
        ref="plansRef"
        class="plans"
        :class="{ 'plans--disabled': busy }"
        role="radiogroup"
        aria-label="Тариф"
        @keydown="onPlansKeydown"
      >
        <PlanCard
          v-for="offer in offers"
          :key="offer.id"
          :offer="offer"
          :selected="offer.id === selectedId"
          :disabled="busy"
          @select="emit('select', $event)"
        />
      </div>
    </div>

    <div class="screen__bottom">
      <ErrorAlert v-if="status === 'error'" title="Не удалось оформить покупку" :text="errorText" />

      <PrimaryButton
        :label="ctaLabel"
        :loading="status === 'loading'"
        loading-label="Оформляем покупку…"
        :disabled="!selectedOffer || restoring"
        @click="emit('purchase')"
      />

      <div class="meta">
        <p class="fine-print">Автопродление. Отменить можно в любой момент в настройках.</p>
        <button type="button" class="link" :disabled="busy" @click="emit('restore')">
          {{ restoring ? 'Ищем покупки…' : 'Восстановить покупки' }}
        </button>
        <p v-if="restoreMessage" class="toast" role="status">{{ restoreMessage }}</p>
      </div>
    </div>
  </main>
</template>
