<script setup lang="ts">
import type { Offer } from '#shared/types/paywall'

const props = defineProps<{
  offer: Offer
  selected: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()

function onSelect() {
  if (!props.disabled) emit('select', props.offer.id)
}
</script>

<template>
  <button
    type="button"
    role="radio"
    class="plan"
    :class="{ 'plan--selected': selected }"
    :aria-checked="selected"
    :disabled="disabled"
    :tabindex="selected ? 0 : -1"
    :data-offer-id="offer.id"
    @click="onSelect"
  >
    <span class="plan__radio" aria-hidden="true">
      <AppIcon v-if="selected" name="check" class="plan__check" />
    </span>

    <span class="plan__info">
      <span class="plan__title-row">
        <span class="plan__title">{{ offer.title }}</span>
        <span v-if="offer.badge" class="badge">{{ offer.badge }}</span>
      </span>
      <span class="plan__subtitle">{{ offer.subtitle }}</span>
    </span>

    <span class="plan__price">
      <span class="plan__amount">{{ offer.priceLabel }}</span>
      <span class="plan__period">{{ offer.periodLabel }}</span>
    </span>
  </button>
</template>
