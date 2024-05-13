import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar } from '@capacitor/status-bar'
import { isPlatform } from '@ionic/vue'
import { App } from '@capacitor/app'
import { Device } from '@capacitor/device'
import { initSound } from './sound'
import { useMainStore } from '~/store/main'

export const initCapacitor = (): void => {
  if (isPlatform('capacitor')) {
    const main = useMainStore()
    App.addListener('appStateChange', (state) => {
      main.isActive = state.isActive
      // console.log('appStateChange', state)
    })
    initSound()
    StatusBar.hide()
    SplashScreen.hide()
  }
}

export const GetDeviceId = async (): Promise<string> => {
  const info = await Device.getId()
  return info.uuid
}
