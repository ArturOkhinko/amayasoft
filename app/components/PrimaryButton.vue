<script setup lang="ts">
defineProps<{
  label: string
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="button"
    :class="{ 'button--loading': loading }"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="$emit('click')"
  >
    <AppIcon v-if="loading" name="spinner" class="button__spinner" />
    <span>{{ loading ? (loadingLabel ?? 'Подождите…') : label }}</span>
  </button>
</template>
