<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { computed } from 'vue'
import { useMainStore } from '~/store/main'

const main = useMainStore()
const isInit = computed(() => main.initialized)
</script>

<template>
  <IonApp>
    <suspense v-if="isInit">
      <template #default>
        <IonRouterOutlet />
      </template>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </suspense>
    <div v-else>
      Loading...
    </div>
  </IonApp>
</template>
