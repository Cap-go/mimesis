// Captures raw store screenshots for every listing locale from a demo build running on
// the iOS simulators and the Android emulator. Install a build made with VITE_DEMO=teams first,
// then run:
//   bun scripts/capture-screenshots.ts <raw-dir> iphone=<sim udid> ipad=<sim udid> android=<adb serial>
// Android stages each scene through the mimesis://demo?scene=<scene>&lang=<locale> deep link; iOS
// simulators prompt before opening links, so they relaunch with a "demo" preference instead.
// Then frame the captures with: bun scripts/compose-screenshots.ts <raw-dir>
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { $ } from 'bun'

const [rawArg, ...deviceArgs] = process.argv.slice(2)
const rawDir = resolve(rawArg ?? 'store/raw')
const devices = Object.fromEntries(deviceArgs.map(arg => arg.split('=') as [string, string]))
const displays: Record<string, string> = { 'iphone': 'internal', 'ipad': 'internal', 'duo-outer': 'primary', 'duo-inner': 'LCD-1' }
if (!Object.keys(devices).length)
  throw new Error('Provide at least one device: iphone=<udid>, ipad=<udid>, duo-outer=<udid>, duo-inner=<udid> or android=<serial>')
for (const [kind, id] of Object.entries(devices)) {
  if (!id || (kind !== 'android' && !Object.hasOwn(displays, kind)))
    throw new Error(`Invalid capture device: ${kind}=${id}`)
}
if (devices['duo-outer'] && devices['duo-outer'] === devices['duo-inner'])
  throw new Error('Capture one Duo panel at a time: fold closed for duo-outer, unfold for duo-inner')
const only = process.env.LOCALES?.split(',')
const locales = await Bun.file(resolve(import.meta.dir, '../store/locales.json')).json() as Record<string, { app: string }>
const scenes = ['playing', 'duo', 'teams', 'themes', 'handoff', 'winner', 'rules']
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

for (const [kind, id] of Object.entries(devices)) {
  if (kind === 'android') {
    await $`adb -s ${id} shell settings put global sysui_demo_allowed 1`.quiet()
    for (const extra of [['command', 'enter'], ['command', 'clock', '-e', 'hhmm', '0941'], ['command', 'battery', '-e', 'level', '100', '-e', 'plugged', 'false'], ['command', 'network', '-e', 'wifi', 'show', '-e', 'level', '4'], ['command', 'notifications', '-e', 'visible', 'false']])
      await $`adb -s ${id} shell am broadcast -a com.android.systemui.demo -e ${extra}`.quiet()
  }
  else {
    await $`xcrun simctl status_bar ${id} override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`.quiet()
  }
}

async function show(scene: string, app: string) {
  const url = `mimesis://demo?scene=${scene}&lang=${app}`
  await Promise.all(Object.entries(devices).map(([kind, id]) => kind === 'android'
    ? $`adb -s ${id} shell am start -a android.intent.action.VIEW -d ${`'${url}'`}`.quiet() // quoted: the device shell would eat the &
    : showIos(id, scene, app)))
}

async function showIos(id: string, scene: string, app: string) {
  await $`xcrun simctl terminate ${id} ee.forgr.mimesis`.quiet().nothrow()
  await $`xcrun simctl spawn ${id} defaults write ee.forgr.mimesis CapacitorStorage.demo ${`${scene} ${app}`}`.quiet()
  const container = (await $`xcrun simctl get_app_container ${id} ee.forgr.mimesis data`.quiet().text()).trim()
  const preferences = `${container}/Library/Preferences/ee.forgr.mimesis.plist`
  const startedAt = Date.now()
  await $`xcrun simctl launch ${id} ee.forgr.mimesis`.quiet()
  const deadline = Date.now() + 60_000
  while (Date.now() < deadline) {
    const result = await $`plutil -convert json -o - ${preferences}`.quiet().nothrow()
    if (result.exitCode === 0) {
      const value = JSON.parse(result.stdout.toString())['CapacitorStorage.demoReady']
      if (typeof value === 'string' && value.startsWith('{')) {
        const ready = JSON.parse(value) as { scene: string, at: number }
        if (ready.scene === `${scene} ${app}` && ready.at >= startedAt)
          return
      }
    }
    await wait(500)
  }
  throw new Error(`Demo did not become ready on ${id}: ${scene} ${app}. Install a current VITE_DEMO build.`)
}

// Warm up: the first staged game right after launch can render blank on Android.
if (devices.android) {
  await show('handoff', 'fr')
  await wait(6000)
}

for (const [listing, { app }] of Object.entries(locales)) {
  if (only && !only.includes(listing))
    continue
  for (const scene of scenes) {
    await show(scene, app)
    // Let the page transition, the catalog fetch and the card images settle.
    await wait(scene === 'playing' ? 5000 : 4000)
    for (const [kind, id] of Object.entries(devices)) {
      const dir = `${rawDir}/${listing}/${kind}`
      await mkdir(dir, { recursive: true })
      if (kind === 'android')
        await Bun.write(`${dir}/${scene}.png`, await $`adb -s ${id} exec-out screencap -p`.arrayBuffer())
      else
        await $`xcrun simctl io ${id} screenshot --display=${displays[kind]} ${dir}/${scene}.png`.quiet()
    }
    console.log(listing, scene)
  }
}
