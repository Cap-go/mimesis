import type { CapacitorConfig } from '@capacitor/cli'
import pkg from './package.json' with { type: 'json' }

const config: CapacitorConfig = {
  appId: 'ee.forgr.mimesis',
  appName: 'Mimesis',
  webDir: 'dist',
  backgroundColor: '#e67f3c',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#e67f3c',
      androidScaleType: 'CENTER_CROP',
    },
    CapacitorUpdater: {
      version: pkg.version,
      autoUpdate: true,
      autoSplashscreen: true,
      directUpdate: 'atInstall',
      defaultChannel: 'production',
    },
    SystemBars: {
      // Draw edge-to-edge and expose --safe-area-inset-* on every Android WebView version.
      insetsHandling: 'css',
      style: 'LIGHT',
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'never',
    // Only page content scrolls; the web view itself never bounces like a website.
    scrollEnabled: false,
  },
}

export default config
