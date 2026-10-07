<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppPage from '~/components/AppPage.vue'
import { useSettingsStore } from '~/store/settings'

const { t } = useI18n()
const settings = useSettingsStore()

const rules = computed(() => [
  { title: t('ruleGoalTitle'), body: t('ruleGoal', { score: settings.targetScore }) },
  { title: t('ruleRoundTitle'), body: t('ruleRound', { seconds: settings.roundSeconds }) },
  { title: t('ruleMimeTitle'), body: t('ruleMime') },
  { title: t('ruleSilenceTitle'), body: t('ruleSilence') },
  { title: t('rulePassTitle'), body: t('rulePass') },
])
</script>

<template>
  <AppPage :title="t('tabRules')" :subtitle="t('rulesSubtitle')">
    <ol class="flex flex-col gap-4">
      <li v-for="(rule, index) in rules" :key="rule.title" class="card flex gap-4 p-5">
        <span class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 font-display text-xl font-extrabold text-white" aria-hidden="true">
          {{ index + 1 }}
        </span>
        <div>
          <h2 class="text-xl font-extrabold text-plum-900">
            {{ rule.title }}
          </h2>
          <p class="mt-1 text-base font-semibold leading-relaxed text-plum-700">
            {{ rule.body }}
          </p>
        </div>
      </li>
    </ol>
  </AppPage>
</template>
