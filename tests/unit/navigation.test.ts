import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { initNavigation } from '../../src/services/navigation'
import { useGameStore } from '../../src/store/game'

const native = vi.hoisted(() => ({
  configure: vi.fn(async () => {}),
  setNavbar: vi.fn(async () => {}),
  setTabbar: vi.fn(async () => {}),
  listeners: new Map<string, (event: { id: string }) => void>(),
}))

vi.mock('@capgo/capacitor-native-navigation', () => ({
  NativeNavigation: {
    ...native,
    addListener: vi.fn(async (name: string, listener: (event: { id: string }) => void) => {
      native.listeners.set(name, listener)
      return { remove: vi.fn() }
    }),
  },
}))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(async () => ({ remove: vi.fn() })) } }))
vi.mock('@capgo/capacitor-transitions/vue', () => ({ setDirection: vi.fn(), setNavigation: vi.fn() }))
vi.mock('../../src/services/platform', () => ({ isNative: true, platform: 'ios' }))
vi.mock('../../src/services/haptics', () => ({ tap: vi.fn() }))

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/teams', component: {}, meta: { chrome: 'tab', tab: 'teams', title: 'tabTeams' } },
      { path: '/rules', component: {}, meta: { chrome: 'tab', tab: 'rules', title: 'tabRules' } },
      { path: '/themes', component: {}, meta: { chrome: 'push', title: 'themes' } },
    ],
  })
}

describe('native primary action', () => {
  let scope = effectScope()
  let router = makeRouter()

  beforeEach(async () => {
    vi.clearAllMocks()
    native.listeners.clear()
    setActivePinia(createPinia())
    window.innerWidth = 390
    scope = effectScope()
    router = makeRouter()
    await router.push('/teams')
    await scope.run(() => initNavigation(router))
  })

  afterEach(() => scope.stop())

  it('places the primary action in the adaptive native bar', () => {
    expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({
      selectedId: 'teams',
      style: { placement: 'auto' },
      tabs: expect.arrayContaining([
        expect.objectContaining({ id: 'choose-theme', role: 'prominent', enabled: true }),
      ]),
    }))
  })

  it('detaches the action beside the tabs on phones and keeps the system rail on wide screens', async () => {
    expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({ minimizeBehavior: 'onScrollDown' }))
    window.innerWidth = 900
    window.dispatchEvent(new Event('resize'))
    await vi.waitFor(() => expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({
      minimizeBehavior: 'never',
      tabs: expect.arrayContaining([expect.objectContaining({ id: 'choose-theme', role: 'normal' })]),
    })))
  })

  it('opens themes when the native action is tapped', async () => {
    native.listeners.get('tabSelect')?.({ id: 'choose-theme' })
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/themes'))
    expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({ hidden: true }))
  })

  it('disables the action for incomplete duo players and restores it after editing', async () => {
    const game = useGameStore()
    game.duo = true
    game.renameSolo(game.duoTeams[0], '')
    await nextTick()
    await vi.waitFor(() => expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({
      tabs: expect.arrayContaining([expect.objectContaining({ id: 'choose-theme', enabled: false })]),
    })))
    native.listeners.get('tabSelect')?.({ id: 'choose-theme' })
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/teams')
    game.renameSolo(game.duoTeams[0], 'Emma')
    await nextTick()
    await vi.waitFor(() => expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({
      tabs: expect.arrayContaining([expect.objectContaining({ id: 'choose-theme', enabled: true })]),
    })))
  })

  it('removes the action on other tabs and ignores stale action events', async () => {
    await router.push('/rules')
    await nextTick()
    expect(native.setTabbar).toHaveBeenLastCalledWith(expect.objectContaining({
      tabs: expect.not.arrayContaining([expect.objectContaining({ id: 'choose-theme' })]),
    }))
    native.listeners.get('tabSelect')?.({ id: 'choose-theme' })
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/rules')
  })
})
