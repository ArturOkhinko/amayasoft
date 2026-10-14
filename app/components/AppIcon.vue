<script setup lang="ts">
/** Иконки из макета (SVG экспортированы из Figma 1:1). */
defineProps<{ name: 'close' | 'benefit' | 'check' | 'alert' | 'spinner' | 'success' }>()
</script>

<template>
  <svg v-if="name === 'close'" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>

  <svg v-else-if="name === 'benefit'" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="10" fill="#E0E7FF" />
    <path d="M6 10.2 8.7 12.8 14 7.5" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>

  <svg v-else-if="name === 'check'" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.2 5 8.5 9.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>

  <svg v-else-if="name === 'alert'" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="9" fill="#DC2626" />
    <path d="M10 5.5v5.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" />
    <circle cx="10" cy="14.2" r="1.2" fill="#FFFFFF" />
  </svg>

  <svg v-else-if="name === 'spinner'" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="10" r="8" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2.5" />
    <path d="M10 2a8 8 0 0 1 8 8" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
  </svg>

  <svg v-else-if="name === 'success'" width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
    <circle cx="36" cy="36" r="36" fill="#D1FAE5" />
    <path d="M24 36.5 32 44.5 48 28" stroke="#059669" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
