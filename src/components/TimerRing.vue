<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ remaining: number, total: number }>()

const RADIUS = 44
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const seconds = computed(() => Math.ceil(props.remaining / 1000))
const offset = computed(() => CIRCUMFERENCE * (1 - props.remaining / (props.total * 1000)))
const urgent = computed(() => seconds.value <= 10)
</script>

<template>
  <div class="relative size-24" role="timer" :aria-label="`${seconds}s`">
    <svg class="size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" :r="RADIUS" fill="var(--color-cream)" stroke="rgb(59 10 31 / 0.1)" stroke-width="8" />
      <circle
        cx="50" cy="50" :r="RADIUS" fill="none" stroke-width="8" stroke-linecap="round"
        :stroke="urgent ? 'var(--color-rose-500)' : 'var(--color-plum-900)'"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="offset"
      />
    </svg>
    <span
      class="absolute inset-0 flex items-center justify-center font-display text-3xl font-extrabold tabular-nums"
      :class="urgent ? 'text-rose-500 animate-pulse' : 'text-plum-900'"
    >{{ seconds }}</span>
  </div>
</template>
