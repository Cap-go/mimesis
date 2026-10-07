<script setup lang="ts">
defineProps<{ open: boolean, dismissible?: boolean }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="duration-200 ease-in"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-plum-900/55 backdrop-blur-sm" aria-hidden="true" @click="dismissible && emit('close')" />
    </Transition>
    <Transition
      enter-active-class="duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1.2)]"
      enter-from-class="translate-y-full sm:translate-y-8 sm:opacity-0"
      leave-active-class="duration-200 ease-in"
      leave-to-class="translate-y-full sm:translate-y-8 sm:opacity-0"
    >
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-[2rem] bg-cream px-6 pt-3 shadow-2xl sm:bottom-6 sm:rounded-[2rem]"
        :style="{ paddingBottom: 'max(1.5rem, var(--inset-bottom))' }"
      >
        <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-plum-900/15" aria-hidden="true" />
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
