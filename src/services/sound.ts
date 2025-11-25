import { NativeAudio } from '@capgo/native-audio'
import { isPlatform } from '@ionic/vue'

function audioGenrator(names: string[]): { [key: string]: HTMLAudioElement } {
  const suit: { [key: string]: HTMLAudioElement } = {}
  names.forEach((name) => {
    suit[name] = new Audio(`assets/sounds/${name}.mp3`)
  })
  return suit
}

const soundName = [
  'horn',
  'tada',
]
const sounds: { [key: string]: HTMLAudioElement } = audioGenrator([
  ...soundName,
])

export function setVolume(volume: number): void {
  if (isPlatform('capacitor')) {
    Object.keys(sounds).forEach((key) => {
      sounds[key].volume = volume / 100
      if (isPlatform('capacitor')) {
        NativeAudio.setVolume({
          assetId: key,
          volume,
        })
      }
    })
  }
}

export async function pauseSound(sound: string): Promise<void> {
  // console.log('pause', sound)
  if (isPlatform('capacitor')) {
    await NativeAudio.stop({
      assetId: sound,
    })
  }
  else {
    sounds[sound].pause()
  }
}

export async function stopSound(sound: string): Promise<void> {
  // console.log('stop', sound)
  await pauseSound(sound)
  sounds[sound].currentTime = 0
  sounds[sound].loop = false
}

export async function loopSound(sound: string): Promise<void> {
  // console.log('loop', sound)
  if (isPlatform('capacitor')) {
    await NativeAudio.loop({
      assetId: sound,
    })
  }
  else {
    sounds[sound].loop = true
    sounds[sound].play()
  }
}

export async function playSound(sound: string): Promise<void> {
  // console.log('play', sound)
  if (isPlatform('capacitor')) {
    try {
      await NativeAudio.play({
        assetId: sound,
        time: 0,
      })
    }
    catch {
      await sounds[sound].play()
    }
  }
  else {
    await sounds[sound].play()
  }
}

export function initSound(): void {
  if (isPlatform('capacitor')) {
    NativeAudio.configure({ focus: false })
    Object.keys(sounds).forEach((key) => {
      NativeAudio.preload({
        assetId: key,
        assetPath: `public/assets/sounds/${key}.mp3`,
        audioChannelNum: 1,
        isUrl: false,
      })
    })
  }
}
