<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { computed } from 'vue'
import PageLoader from '~/components/PageLoader.vue'
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
        <PageLoader :show="true" />
      </template>
    </suspense>
    <div v-else>
      <PageLoader :show="true" />
    </div>
    <PageLoader :show="main.loading" />
  </IonApp>
</template>
