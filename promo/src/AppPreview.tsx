// App Store app preview (886×1920 portrait, ~22 s): the real app, captioned step by step.
import type { Lang } from './theme'
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'
import { Icon, Reel, Stage, usePop } from './parts'
import { color, COPY, font, FPS, REEL, STEPS } from './theme'

const INTRO = 30
const REEL_FRAMES = Math.round((REEL.end - REEL.start) * FPS)
const OUTRO = 75
export const APP_PREVIEW_FRAMES = INTRO + REEL_FRAMES + OUTRO

const PHONE_WIDTH = 700
const reelFrame = (seconds: number) => INTRO + Math.round((seconds - REEL.start) * FPS)

function Caption({ title, hint }: { title: string, hint: string }) {
  const pop = usePop(0, 11)
  const sub = usePop(5, 14)
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 110, textAlign: 'center' }}>
      <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 92, lineHeight: 1, color: color.cream, letterSpacing: -2, textShadow: `0 6px 0 ${color.roseDark}`, transform: `scale(${0.6 + pop * 0.4}) rotate(${(1 - pop) * -6}deg)`, opacity: pop }}>
        {title}
      </div>
      <div style={{ marginTop: 26, fontFamily: font.sans, fontWeight: 800, fontSize: 40, color: color.plum, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
        {hint}
      </div>
    </AbsoluteFill>
  )
}

function Intro({ lang }: { lang: Lang }) {
  const icon = usePop(0, 10)
  const title = usePop(6)
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <Icon size={150} style={{ transform: `scale(${icon}) rotate(${(1 - icon) * -30}deg)` }} />
        <div style={{ opacity: title, transform: `translateX(${(1 - title) * -40}px)` }}>
          <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 96, color: color.cream, letterSpacing: -2, textShadow: `0 6px 0 ${color.roseDark}`, lineHeight: 1 }}>Mimesis</div>
          <div style={{ fontFamily: font.sans, fontWeight: 800, fontSize: 40, color: color.plum, marginTop: 8 }}>{COPY[lang].tagline}</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function Outro({ lang }: { lang: Lang }) {
  const icon = usePop(4, 9)
  const text = usePop(12)
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <Icon size={300} style={{ transform: `scale(${icon}) rotate(${(1 - icon) * 25}deg)` }} />
      <div style={{ marginTop: 50, fontFamily: font.display, fontWeight: 800, fontSize: 150, color: color.cream, letterSpacing: -4, textShadow: `0 8px 0 ${color.roseDark}`, transform: `scale(${0.7 + icon * 0.3})`, opacity: icon }}>Mimesis</div>
      <div style={{ marginTop: 30, padding: '0 70px', whiteSpace: 'pre-line', fontFamily: font.display, fontWeight: 700, fontSize: 64, lineHeight: 1.15, color: color.plum, opacity: text, transform: `translateY(${(1 - text) * 30}px)` }}>
        {COPY[lang].pitch}
      </div>
    </AbsoluteFill>
  )
}

export function AppPreview({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame()
  const steps = STEPS[lang]
  const rise = interpolate(frame, [10, INTRO + 6], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: t => 1 - (1 - t) ** 3 })
  const leave = interpolate(frame, [INTRO + REEL_FRAMES - 6, INTRO + REEL_FRAMES + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <Stage>
      <Sequence durationInFrames={INTRO + 8}>
        <Intro lang={lang} />
      </Sequence>
      {steps.map((step, i) => {
        const from = reelFrame(step.from)
        const to = i + 1 < steps.length ? reelFrame(steps[i + 1].from) : INTRO + REEL_FRAMES
        return (
          <Sequence key={step.title} from={from} durationInFrames={to - from}>
            <Caption title={step.title} hint={step.hint} />
            <Audio src={staticFile('whoosh.wav')} volume={0.35} />
          </Sequence>
        )
      })}
      <Sequence from={INTRO} durationInFrames={REEL_FRAMES + 12}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 50 }}>
          <div style={{ transform: `translateY(${rise * 1200 + leave * 1400}px) rotate(${leave * 8}deg)`, borderRadius: 64, overflow: 'hidden', border: `8px solid ${color.cream}`, boxShadow: '0 40px 80px -20px rgba(59,10,31,0.6)' }}>
            <Reel lang={lang} width={PHONE_WIDTH} />
          </div>
        </AbsoluteFill>
        {REEL.taps.map(tap => (
          <Sequence key={tap.at} from={Math.round((tap.at - REEL.start) * FPS)} durationInFrames={10}>
            <Audio src={staticFile('pop.wav')} volume={0.5} />
          </Sequence>
        ))}
        <Sequence from={Math.round((REEL.win - REEL.start) * FPS)}>
          <Audio src={staticFile('tada.mp3')} volume={0.9} />
        </Sequence>
      </Sequence>
      <Sequence from={INTRO + REEL_FRAMES}>
        <Outro lang={lang} />
      </Sequence>
    </Stage>
  )
}
