import { createRouter, createWebHistory } from 'vue-router'
import GamePage from '~/views/GamePage.vue'
import RulesPage from '~/views/RulesPage.vue'
import SettingsPage from '~/views/SettingsPage.vue'
import TeamsPage from '~/views/TeamsPage.vue'
import ThemesPage from '~/views/ThemesPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/teams' },
    { path: '/home', redirect: '/teams' },
    { path: '/teams', component: TeamsPage, meta: { chrome: 'tab', tab: 'teams', title: 'tabTeams' } },
    { path: '/rules', component: RulesPage, meta: { chrome: 'tab', tab: 'rules', title: 'tabRules' } },
    { path: '/settings', component: SettingsPage, meta: { chrome: 'tab', tab: 'settings', title: 'tabSettings' } },
    { path: '/themes', component: ThemesPage, meta: { chrome: 'push', title: 'themes' } },
    { path: '/game', component: GamePage, meta: { chrome: 'immersive', title: 'play' } },
    { path: '/:pathMatch(.*)*', redirect: '/teams' },
  ],
})

export default router
