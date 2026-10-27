import type { NativeNavigationIcon, NativeNavigationTab } from '@capgo/capacitor-native-navigation'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { App } from '@capacitor/app'
import { NativeNavigation } from '@capgo/capacitor-native-navigation'
import { setDirection, setNavigation } from '@capgo/capacitor-transitions/vue'
import { watch } from 'vue'
import { useGameStore } from '~/store/game'
import { tap } from './haptics'
import { i18n, messagesVersion } from './i18n'
import { isNative, platform } from './platform'

export type TabId = 'teams' | 'rules' | 'settings'

export const usesNativePlayAction = isNative && platform === 'ios'
const playActionId = 'choose-theme'

declare module 'vue-router' {
  interface RouteMeta {
    chrome: 'tab' | 'push' | 'immersive'
    tab?: TabId
    title: string
  }
}

function svg(path: string): string {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`
}

export interface TabItem {
  id: TabId
  title: string
  path: string
  svg: string
  icon: NativeNavigationIcon
  selectedIcon: NativeNavigationIcon
}

function tab(id: TabId, sfSymbol: string, path: string): TabItem {
  const markup = svg(path)
  return {
    id,
    title: `tab${id[0].toUpperCase()}${id.slice(1)}`,
    path: `/${id}`,
    svg: markup,
    icon: { svg: markup, ios: { sfSymbol } },
    selectedIcon: { svg: markup, ios: { sfSymbol: `${sfSymbol}.fill` } },
  }
}

export const tabs: TabItem[] = [
  tab('teams', 'person.3', '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  tab('rules', 'book', '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>'),
  tab('settings', 'gearshape', '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
]

const backIcon: NativeNavigationIcon = {
  svg: svg('<path d="m15 18-6-6 6-6"/>'),
  ios: { sfSymbol: 'chevron.backward' },
}

const playIcon: NativeNavigationIcon = {
  svg: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  ios: { sfSymbol: 'arrow.right' },
}

const colors = {
  tint: '#B5244F',
  inactiveTint: '#8A4A63',
  foreground: '#3B0A1F',
  indicator: '#FBDCE6',
}

// Android draws no native glass: the plugin's liquidGlass renders the WebView in software to blur
// it, which flashes the page (8.8.2 and older) or swallows the next fling (8.8.3). The blur comes
// from CSS instead: .scroll-edge under the navbar, .tabbar-blur under the tab bar (App.vue).
const androidNoGlass = { effect: 'none' as const }

let router: Router

// Push a page on the stack with a forward slide.
export function push(path: string): void {
  setDirection('forward')
  void router.push(path)
}

// Reset the stack, e.g. switching tabs or leaving the game.
export function resetTo(path: string, direction: 'forward' | 'back' | 'root' | 'none' = 'root'): void {
  setNavigation('root', direction)
  void router.replace(path)
}

export function back(fallback = '/teams'): void {
  setDirection('back')
  if (window.history.state?.back)
    router.back()
  else
    void router.replace(fallback)
}

// Large titles collapse to an inline title once the page scrolls, like system apps.
let titleCollapsed = false

function navbarOptions(route: RouteLocationNormalized) {
  const t = i18n.global.t
  const { chrome, title } = route.meta
  return {
    // Tab and pushed pages use the native header; the game and onboarding stay full screen.
    hidden: chrome === 'immersive',
    title: t(title),
    large: chrome === 'tab' && !titleCollapsed,
    transparent: true,
    // iOS: a chevron item renders as a glass back button. Android: the Toolbar's own up arrow.
    backButton: { visible: chrome === 'push' && platform === 'android', title: t('back') },
    leftItems: chrome === 'push' && platform === 'ios' ? [{ id: 'back', title: t('back'), icon: backIcon }] : [],
    // Android: a see-through bar like iOS; the page's .scroll-edge blur sits under the title.
    colors: platform === 'android' ? { ...colors, background: '#00000000' } : colors,
    glass: platform === 'android' ? androidNoGlass : undefined,
    // The page transition already animates; animating the bar swap (back button ↔ large title) can
    // leave the previous page's bar on screen on some iOS versions.
    animated: false,
  }
}

// Re-sending an identical header makes UIKit drop the large title, so only send changes.
let lastNavbar = ''

async function setNavbar(route: RouteLocationNormalized): Promise<void> {
  const options = navbarOptions(route)
  const key = JSON.stringify(options)
  if (key === lastNavbar)
    return
  lastNavbar = key
  await NativeNavigation.setNavbar(options)
}

function compactWidth(): boolean {
  return window.innerWidth < 600
}

// Animate the tab bar only when it appears or disappears: plugin 8.8.3 and older replay the
// Android slide-in on every animated update, so the bar blinked on each tab tap.
let tabbarHidden: boolean | undefined

async function syncNativeChrome(route: RouteLocationNormalized): Promise<void> {
  const t = i18n.global.t
  const { chrome, tab } = route.meta
  const hidden = chrome !== 'tab'
  const animated = tabbarHidden !== undefined && hidden !== tabbarHidden
  tabbarHidden = hidden
  const nativeTabs: NativeNavigationTab[] = tabs.map(item => ({
    id: item.id,
    title: t(item.title),
    icon: item.icon,
    selectedIcon: item.selectedIcon,
  }))
  if (usesNativePlayAction && route.path === '/teams') {
    nativeTabs.push({
      id: playActionId,
      title: t('chooseTheme'),
      icon: playIcon,
      selectedIcon: playIcon,
      role: compactWidth() ? 'prominent' : 'normal',
      enabled: useGameStore().canStart,
    })
  }
  await setNavbar(route)
  await NativeNavigation.setTabbar({
    hidden,
    selectedId: tab ?? 'teams',
    labelVisibilityMode: 'labeled',
    // Android parses #AARRGGBB: a 70% cream surface over the CSS blur.
    colors: { ...colors, background: platform === 'android' ? '#B3FFFAF5' : '#FFFAF5' },
    indicatorColor: colors.indicator,
    glass: platform === 'android' ? androidNoGlass : undefined,
    style: { placement: 'auto' },
    // The system tab bar keeps a prominent tab inside the capsule. On phones, the plugin's own
    // capsule (used while it minimizes on scroll) detaches it as a round button beside the tabs, so
    // "Choose a theme" stands apart. Wide screens (unfolded iPhone Duo) keep the system rail.
    minimizeBehavior: usesNativePlayAction && compactWidth() ? 'onScrollDown' : 'never',
    tabs: nativeTabs,
    animated,
  })
}

// Called by pages as they scroll: swaps the large title for the inline one past the top.
export function setTitleCollapsed(collapsed: boolean): void {
  if (!isNative || !router || collapsed === titleCollapsed)
    return
  titleCollapsed = collapsed
  void setNavbar(router.currentRoute.value)
}

export async function initNavigation(appRouter: Router): Promise<void> {
  router = appRouter
  if (!isNative)
    return
  watch(messagesVersion, refreshChrome)
  if (usesNativePlayAction) {
    watch(() => useGameStore().canStart, refreshChrome)
    // Folding or unfolding the iPhone Duo switches between the phone capsule and the rail.
    let compact = compactWidth()
    window.addEventListener('resize', () => {
      if (compact !== compactWidth()) {
        compact = compactWidth()
        refreshChrome()
      }
    })
  }
  await NativeNavigation.configure({
    contentInsetMode: 'css',
    animationDuration: 320,
    colors,
  })
  router.afterEach((to) => {
    titleCollapsed = false
    return syncNativeChrome(to)
  })
  await syncNativeChrome(router.currentRoute.value)
  await NativeNavigation.addListener('tabSelect', ({ id }) => {
    if (id === playActionId) {
      if (router.currentRoute.value.path === '/teams' && useGameStore().canStart) {
        tap()
        push('/themes')
      }
      return
    }
    const target = tabs.find(item => item.id === id)
    if (target && router.currentRoute.value.path !== target.path)
      resetTo(target.path, 'none')
  })
  await NativeNavigation.addListener('navbarBack', () => back())
  await NativeNavigation.addListener('navbarItemTap', ({ id }) => {
    if (id === 'back')
      back()
  })
  await App.addListener('backButton', ({ canGoBack }) => {
    const { chrome } = router.currentRoute.value.meta
    if (chrome === 'immersive')
      return window.dispatchEvent(new CustomEvent('mimesis:hardware-back'))
    if (chrome === 'push' && canGoBack)
      return back()
    if (router.currentRoute.value.path !== '/teams')
      return resetTo('/teams', 'none')
    void App.minimizeApp()
  })
}

export function refreshChrome(): void {
  if (isNative && router)
    void syncNativeChrome(router.currentRoute.value)
}
