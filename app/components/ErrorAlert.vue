<script setup lang="ts">
defineProps<{
  title: string
  text: string
  actionLabel?: string
}>()

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="alert" role="alert">
    <AppIcon name="alert" class="alert__icon" />
    <div class="alert__body">
      <p class="alert__title">{{ title }}</p>
      <p class="alert__text">{{ text }}</p>
      <button v-if="actionLabel" type="button" class="alert__action" @click="$emit('action')">
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
