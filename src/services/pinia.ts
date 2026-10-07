import type { Pinia, StateTree } from 'pinia'
import { createPinia } from 'pinia'
import { watch } from 'vue'
import { getStorage, setStorage } from './storage'

const PERSISTED = new Set(['settings', 'game'])
const hydrating: Promise<void>[] = []

// Resolves once every persisted store created so far has loaded its saved state.
export function whenHydrated(): Promise<unknown> {
  return Promise.all(hydrating)
}

export default (): Pinia => {
  const pinia = createPinia()
  pinia.use(({ store }) => {
    if (!PERSISTED.has(store.$id))
      return
    const key = `p_state_${store.$id}`
    hydrating.push(getStorage<StateTree>(key).then((saved) => {
      if (saved)
        store.$patch(saved)
      watch(() => store.$state, state => void setStorage(key, state), { deep: true })
    }))
  })
  return pinia
}
