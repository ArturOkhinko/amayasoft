<script setup lang="ts">
import type { Purchase } from '#shared/types/paywall'

const props = defineProps<{ purchase: Purchase }>()
defineEmits<{ done: [] }>()

const titleRef = ref<HTMLElement | null>(null)

const rows = computed(() => [
  { key: 'Тариф', value: `${props.purchase.offerTitle} · ${props.purchase.priceLabel}` },
  { key: 'Дата', value: formatDateTime(props.purchase.createdAt) },
  { key: 'Номер покупки', value: formatOrderNumber(props.purchase.id) },
])

// Переводим фокус на заголовок, чтобы скринридер озвучил успех
onMounted(() => titleRef.value?.focus())
</script>

<template>
  <main class="screen">
    <div class="screen__top">
      <nav class="nav">
        <button type="button" class="icon-button" aria-label="Закрыть" @click="$emit('done')">
          <AppIcon name="close" />
        </button>
      </nav>

      <section class="success" aria-labelledby="success-title">
        <AppIcon name="success" class="success__icon" />
        <header class="header header--center">
          <h1 id="success-title" ref="titleRef" class="title" tabindex="-1">Premium активирован</h1>
          <p class="lead">Спасибо за покупку! Это тестовая операция, деньги не списаны.</p>
        </header>
      </section>

      <dl class="receipt">
        <div v-for="row in rows" :key="row.key" class="receipt__row">
          <dt class="receipt__key">{{ row.key }}</dt>
          <dd class="receipt__value">{{ row.value }}</dd>
        </div>
      </dl>
    </div>

    <div class="screen__bottom">
      <PrimaryButton label="Готово" @click="$emit('done')" />
    </div>
  </main>
</template>
