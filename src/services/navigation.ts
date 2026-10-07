import type { NativeNavigationIcon, NativeNavigationTab } from '@capgo/capacitor-native-navigation'
import type { RouteLocationNormalized, Router } from 'vue-router'
import { App } from '@capacitor/app'
import { NativeNavigation } from '@capgo/capacitor-native-navigation'
import { setDirection, setNavigation } from '@capgo/capacitor-transitions/vue'
import { i18n } from './i18n'
import { isNative, platform } from './platform'

export type TabId = 'teams' | 'rules' | 'settings'

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
  tab('settings', 'gearshape', '<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>'),
]

const backIcon: NativeNavigationIcon = {
  svg: svg('<path d="m15 18-6-6 6-6"/>'),
  ios: { sfSymbol: 'chevron.backward' },
}

const colors = {
  tint: '#B5244F',
  inactiveTint: '#8A4A63',
  foreground: '#3B0A1F',
  indicator: '#FBDCE6',
}

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

async function syncNativeChrome(route: RouteLocationNormalized): Promise<void> {
  const t = i18n.global.t
  const { chrome, tab, title } = route.meta
  await NativeNavigation.setNavbar({
    // Tab pages draw their own brand title; the native bar is for pushed pages.
    hidden: chrome !== 'push',
    title: t(title),
    transparent: true,
    // iOS: a chevron item renders as a glass back button. Android: the Toolbar's own up arrow.
    backButton: { visible: chrome === 'push' && platform === 'android', title: t('back') },
    leftItems: chrome === 'push' && platform === 'ios' ? [{ id: 'back', title: t('back'), icon: backIcon }] : [],
    colors,
    animated: true,
  })
  await NativeNavigation.setTabbar({
    hidden: chrome !== 'tab',
    selectedId: tab ?? 'teams',
    labelVisibilityMode: 'labeled',
    colors: { ...colors, background: '#FFFAF5' },
    indicatorColor: colors.indicator,
    tabs: tabs.map<NativeNavigationTab>(item => ({
      id: item.id,
      title: t(item.title),
      icon: item.icon,
      selectedIcon: item.selectedIcon,
    })),
    animated: true,
  })
}

export async function initNavigation(appRouter: Router): Promise<void> {
  router = appRouter
  if (!isNative)
    return
  await NativeNavigation.configure({
    contentInsetMode: 'css',
    animationDuration: 320,
    colors,
  })
  router.afterEach(to => syncNativeChrome(to))
  await syncNativeChrome(router.currentRoute.value)
  await NativeNavigation.addListener('tabSelect', ({ id }) => {
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
