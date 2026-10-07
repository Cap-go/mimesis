import { App as CapApp } from '@capacitor/app'
import { Device } from '@capacitor/device'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { initTransitions } from '@capgo/capacitor-transitions/vue'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initCrisp } from './services/crisp'
import { stageDemo } from './services/demo'
import { i18n, setLocale } from './services/i18n'
import { initNavigation } from './services/navigation'
import pinia, { whenHydrated } from './services/pinia'
import { isNative } from './services/platform'
import { initSound } from './services/sound'
import { useCatalogStore } from './store/catalog'
import { useGameStore } from './store/game'
import { useSettingsStore } from './store/settings'
import '@capgo/capacitor-transitions'
import './style.css'

async function init() {
  if (isNative)
    void CapacitorUpdater.notifyAppReady()
  initTransitions({ platform: 'auto' })

  const app = createApp(App).use(pinia()).use(i18n).use(router)
  const settings = useSettingsStore()
  useGameStore()
  // Restore saved teams and settings before the first frame.
  await whenHydrated()
  setLocale(settings.locale)
  void useCatalogStore().load(settings.locale)

  await router.isReady()
  // First launch explains the game; people who already played skip it.
  if (!settings.onboarded && settings.gamesPlayed > 0)
    settings.onboarded = true
  if (!settings.onboarded && !import.meta.env.VITE_DEMO)
    await router.replace('/welcome')
  app.mount('#app')
  await initNavigation(router)
  if (import.meta.env.VITE_DEMO)
    await stageDemo(router)

  if (isNative) {
    void StatusBar.setStyle({ style: Style.Light })
    void initSound()
    await SplashScreen.hide()
    const [{ identifier }, device, info] = await Promise.all([Device.getId(), Device.getInfo(), CapApp.getInfo()])
    void initCrisp({
      'user-uuid': identifier,
      'model': device.model,
      'platform': device.platform,
      'osVersion': device.osVersion,
      'nativeVersion': info.version,
      'webVersion': import.meta.env.VITE_APP_VERSION as string,
    })
  }
  else {
    void initSound()
  }
}

void init()
