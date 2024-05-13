import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { createApp } from 'vue'
import { IonicVue, isPlatform, loadingController } from '@ionic/vue'
import { createI18n } from 'vue-i18n'
import { App as capApp } from '@capacitor/app'
import { Device } from '@capacitor/device'
import App from './App.vue'
import router from './router'
// import VueFeather from 'vue-feather';
import { useMainStore } from './store/main'
import {
  initCrisp,
  setDeviceInfo,
  setUserId,
  setVersion,
} from './services/crips'
import pinia from './services/pinia'
import { initCapacitor } from './services/capacitor'
import { initPlausible } from './services/plausible'

import 'virtual:windi.css'
import 'virtual:windi-devtools'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './theme/variables.css'
// import { initIap } from './services/iap'

initPlausible()

const app = createApp(App).use(IonicVue).use(pinia())

// app.component(VueFeather.name || 'VueFeather', VueFeather);

const messages = Object.fromEntries(
  Object.entries(

    import.meta.glob<{ default: any }>('../locales/*.y(a)?ml', {
      eager: true,
    }),
  ).map(([key, value]) => {
    const yaml = key.endsWith('.yaml')
    return [key.slice(11, yaml ? -5 : -4), value.default]
  }),
)

const initI18n = async () => {
  try {
    const i18n = createI18n({
      legacy: false,
      globalInjection: false,
      locale: 'fr',
      fallbackLocale: 'fr',
      messages,
    })
    app.use(i18n)
  }
  catch (err) {
    console.error('initI18n', err)
  }
}

const init = async (isRecall = false) => {
  console.log('init')
  CapacitorUpdater.notifyAppReady()
  // capApp.addListener('appStateChange', async (state: any) => {
  //   let data: BundleInfo | null = null
  //   console.log('appStateChange', state)
  //   if (state.isActive) {
  //     console.log('getLatest')
  //     // Do the download during user active app time to prevent failed download
  //     const latest = await CapacitorUpdater.getLatest()
  //     console.log('latest', latest)
  //     if (latest.url) {
  //       data = await CapacitorUpdater.download({
  //         url: latest.url,
  //         version: latest.version,
  //       })
  //       console.log('download', data)
  //     }
  //   }
  //   if (!state.isActive && data) {
  //     console.log('set')
  //     // Do the switch when user leave app or when you want
  //     SplashScreen.show()
  //     try {
  //       await CapacitorUpdater.set({ id: data.id })
  //     }
  //     catch (err) {
  //       console.log(err)
  //       SplashScreen.hide() // in case the set fail, otherwise the new app will have to hide it
  //     }
  //   }
  // })
  // CapacitorUpdater.addListener('updateFailed', (res) => {
  //   console.log('updateFailed', res)
  // })
  const main = useMainStore()
  try {
    // SplashScreen.hide() // in case the set fail, otherwise the new app will have to hide it
    console.log('initCrisp')
    initCrisp()
    console.log('initI18n')
    await initI18n()
    // if (isPlatform('ios'))
    //   initIap('appl_bWYDPHWhWAGWQFUIQGIoiXzrTlW')

    // else if (isPlatform('android'))
    //   initIap('goog_TqZUIbsisEecUcyOkqTPaHPKEVH')

    console.log('main.initialize')
    const loading = await loadingController.create({
      message: 'chargement...',
    })
    await loading.present()
    await main.initialize()
    await loading.dismiss()
    console.log('initCapacitor')
    initCapacitor()
    // save currentPath
    router.afterEach((to) => {
      const main = useMainStore()
      main.currentPath = to.fullPath
    })
    console.log('use.router')
    app.use(router)
    console.log('router.isReady')
    await router.isReady()
    console.log('mount')
    app.mount('#app')
    if (isPlatform('capacitor')) {
      const info = await Device.getId()
      const infoApp = await capApp.getInfo()
      const device = await Device.getInfo()
      // console.log('info', info)
      setUserId(info.uuid)
      setDeviceInfo(
        device.model,
        device.platform,
        device.operatingSystem,
        device.osVersion,
        infoApp.version,
        device.manufacturer,
      )
    }
    setVersion(import.meta.env.VITE_APP_VERSION as string)
  }
  catch (err) {
    console.error('init', err)
    if (!isRecall) {
      console.error('isRecall')
      await main.initialize(true)
      await init(true)
    }
  }
}
init()
