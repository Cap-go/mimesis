import { v4 as uuidv4 } from 'uuid'
import { getStorage, setStorage } from './storage'

const KEY = 'install_id'
let cached: Promise<string> | null = null

// Random id created on first launch and kept until the app is uninstalled. Used instead of the
// hardware/vendor device id so nothing ties games or support chats to the physical device.
export function getInstallId(): Promise<string> {
  cached ??= (async () => {
    const saved = await getStorage<string>(KEY)
    if (saved)
      return saved
    const id = uuidv4()
    await setStorage(KEY, id)
    return id
  })()
  return cached
}
