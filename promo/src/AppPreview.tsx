// App Store app preview (886×1920 portrait, ~19 s): the real app, full screen, captioned step by step.
// Apple only accepts screen captures of the app: no device frame, no backdrop around the app and no
// branded title cards, so the reel fills the whole video and the captions are plain overlays.
import type { Lang } from './theme'
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from 'remotion'
import { Music, Reel, REEL_RATIO, usePop } from './parts'
import { color, font, FPS, REEL, STEPS } from './theme'

export const APP_PREVIEW_FRAMES = Math.round((REEL.end - REEL.start) * FPS)

const reelFrame = (seconds: number) => Math.round((seconds - REEL.start) * FPS)

// Vertical center of each step's caption, as a fraction of the height, over a quiet part of the screen.
const CAPTION_Y = [0.8, 0.9, 0.8, 0.59, 0.59, 0.6]

function Caption({ title, hint, y }: { title: string, hint: string, y: number }) {
  const pop = usePop(0, 11)
  const sub = usePop(5, 14)
  return (
    <AbsoluteFill style={{ alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: `${y * 100}%`, transform: `translateY(-50%) scale(${0.7 + pop * 0.3})`, opacity: pop, minWidth: '72%', maxWidth: '90%', padding: '22px 40px 26px', borderRadius: 40, background: 'rgba(59, 10, 31, 0.86)', boxShadow: '0 20px 50px -14px rgba(59,10,31,0.7)', textAlign: 'center' }}>
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 68, lineHeight: 1.05, color: color.cream, letterSpacing: -1.5 }}>
          {title}
        </div>
        <div style={{ marginTop: 10, fontFamily: font.sans, fontWeight: 800, fontSize: 36, color: color.pizazzLight, opacity: sub, transform: `translateY(${(1 - sub) * 12}px)` }}>
          {hint}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function AppPreview({ lang }: { lang: Lang }) {
  const { width, height } = useVideoConfig()
  const steps = STEPS[lang]
  return (
    <AbsoluteFill style={{ background: color.pizazz, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Music />
      <Reel lang={lang} width={Math.max(width, height / REEL_RATIO)} />
      {REEL.taps.map(tap => (
        <Sequence key={tap.at} from={reelFrame(tap.at)} durationInFrames={10}>
          <Audio src={staticFile('pop.wav')} volume={0.5} />
        </Sequence>
      ))}
      <Sequence from={reelFrame(REEL.win)}>
        <Audio src={staticFile('tada.mp3')} volume={0.9} />
      </Sequence>
      {steps.map((step, i) => {
        const from = reelFrame(step.from)
        const to = i + 1 < steps.length ? reelFrame(steps[i + 1].from) : APP_PREVIEW_FRAMES
        return (
          <Sequence key={step.title} from={from} durationInFrames={to - from}>
            <Caption title={step.title} hint={step.hint} y={CAPTION_Y[i]} />
            <Audio src={staticFile('whoosh.wav')} volume={0.35} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
