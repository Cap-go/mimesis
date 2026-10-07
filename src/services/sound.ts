import { NativeAudio } from '@capgo/native-audio'
import { isNative } from './platform'

export type SoundName = 'horn' | 'tada'

const names: SoundName[] = ['horn', 'tada']
const webSounds = new Map<SoundName, HTMLAudioElement>()

export async function initSound(): Promise<void> {
  if (!isNative) {
    for (const name of names)
      webSounds.set(name, new Audio(`/assets/sounds/${name}.mp3`))
    return
  }
  await NativeAudio.configure({ focus: false })
  await Promise.all(names.map(name => NativeAudio.preload({
    assetId: name,
    assetPath: `public/assets/sounds/${name}.mp3`,
    audioChannelNum: 1,
    isUrl: false,
  }).catch(err => console.warn('preload', name, err))))
}

export async function playSound(name: SoundName): Promise<void> {
  try {
    if (isNative) {
      await NativeAudio.play({ assetId: name, time: 0 })
      return
    }
    const audio = webSounds.get(name)
    if (audio) {
      audio.currentTime = 0
      await audio.play()
    }
  }
  catch (err) {
    console.warn('playSound', name, err)
  }
}
