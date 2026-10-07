<script setup lang="ts">
import { setupRouterOutlet } from '@capgo/capacitor-transitions/vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import WebTabBar from '~/components/WebTabBar.vue'
import { isNative } from '~/services/platform'

const route = useRoute()
const outletRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (outletRef.value)
    setupRouterOutlet(outletRef.value, { platform: 'auto', swipeGesture: 'auto', maxCached: 4 })
})
</script>

<template>
  <cap-router-outlet ref="outletRef">
    <router-view />
  </cap-router-outlet>
  <Transition
    enter-active-class="duration-200" enter-from-class="translate-y-full"
    leave-active-class="duration-150" leave-to-class="translate-y-full"
  >
    <WebTabBar v-if="!isNative && route.meta.chrome === 'tab'" />
  </Transition>
</template>
