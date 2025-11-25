import type { CapacitorConfig } from '@capacitor/cli'
import pkg from './package.json'

const config: CapacitorConfig = {
  appId: 'ee.forgr.mimesis',
  appName: 'Mimesis',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: [
        'badge',
        'sound',
        'alert',
      ],
    },
    SplashScreen: {
      launchAutoHide: false,
      androidScaleType: 'CENTER_CROP',
    },
    CapacitorUpdater: {
      autoSplashscreen: true,
      directUpdate: 'atInstall',
      version: pkg.version,
    },
  },
  android: {
    webContentsDebuggingEnabled: true,
  },
}

export default config
