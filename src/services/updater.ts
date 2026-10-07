import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { isNative } from './platform'

export interface BuildInfo {
  native: string
  bundle: string
}

export async function getBuildInfo(): Promise<BuildInfo> {
  const web = import.meta.env.VITE_APP_VERSION as string
  if (!isNative)
    return { native: web, bundle: web }
  const { bundle, native } = await CapacitorUpdater.current()
  return { native, bundle: bundle.version === 'builtin' ? native : bundle.version }
}
