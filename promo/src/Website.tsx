// Website promo (1920×1080, ~24 s): headline steps on the left, the real app in a phone on the right.
import type { Lang } from './theme'
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'
import { Icon, Reel, REEL_RATIO, Stage, usePop } from './parts'
import { color, COPY, font, FPS, REEL, STEPS } from './theme'

const INTRO = 45
const REEL_FRAMES = Math.round((REEL.end - REEL.start) * FPS)
const OUTRO = 120
export const WEBSITE_FRAMES = INTRO + REEL_FRAMES + OUTRO

const SCREEN_WIDTH = 410
const BEZEL = 16
const reelFrame = (seconds: number) => INTRO + Math.round((seconds - REEL.start) * FPS)

function Phone({ lang }: { lang: Lang }) {
  return (
    <div style={{ padding: BEZEL, borderRadius: 78, background: '#1a0510', boxShadow: '0 50px 90px -25px rgba(59,10,31,0.7), inset 0 0 0 3px #4a1a2e' }}>
      <div style={{ borderRadius: 64, overflow: 'hidden', width: SCREEN_WIDTH, height: SCREEN_WIDTH * REEL_RATIO }}>
        <Reel lang={lang} width={SCREEN_WIDTH} />
      </div>
    </div>
  )
}

function Step({ index, total, title, hint }: { index: number, total: number, title: string, hint: string }) {
  const pop = usePop(0, 12)
  const sub = usePop(6, 14)
  return (
    <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 150, paddingRight: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: pop }}>
        <div style={{ width: 86, height: 86, borderRadius: 43, background: color.rose, boxShadow: `0 6px 0 ${color.roseDark}`, color: color.cream, fontFamily: font.display, fontWeight: 800, fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pop})` }}>
          {index + 1}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Array.from({ length: total }, (_, i) => (
            <div key={i} style={{ width: i === index ? 46 : 16, height: 16, borderRadius: 8, background: i <= index ? color.cream : 'rgba(255,250,245,0.35)' }} />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 36, fontFamily: font.display, fontWeight: 800, fontSize: 124, lineHeight: 0.98, letterSpacing: -4, color: color.cream, textShadow: `0 8px 0 ${color.roseDark}`, transformOrigin: 'left center', transform: `translateX(${(1 - pop) * -80}px) rotate(${(1 - pop) * -4}deg)`, opacity: pop }}>
        {title}
      </div>
      <div style={{ marginTop: 30, fontFamily: font.sans, fontWeight: 800, fontSize: 48, color: color.plum, opacity: sub, transform: `translateY(${(1 - sub) * 24}px)` }}>
        {hint}
      </div>
    </AbsoluteFill>
  )
}

function Hero({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame()
  const icon = usePop(0, 10)
  const title = usePop(8)
  const out = interpolate(frame, [INTRO - 12, INTRO + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: 1 - out, transform: `scale(${1 - out * 0.15})` }}>
      <Icon size={260} style={{ transform: `scale(${icon}) rotate(${(1 - icon) * -30}deg)` }} />
      <div style={{ marginTop: 34, fontFamily: font.display, fontWeight: 800, fontSize: 170, letterSpacing: -5, color: color.cream, textShadow: `0 10px 0 ${color.roseDark}`, lineHeight: 1, opacity: title, transform: `translateY(${(1 - title) * 40}px)` }}>Mimesis</div>
      <div style={{ marginTop: 18, fontFamily: font.sans, fontWeight: 800, fontSize: 54, color: color.plum, opacity: title }}>{COPY[lang].tagline}</div>
    </AbsoluteFill>
  )
}

function Outro({ lang }: { lang: Lang }) {
  const icon = usePop(4, 9)
  const text = usePop(12)
  const badges = usePop(22)
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <Icon size={200} style={{ transform: `scale(${icon}) rotate(${(1 - icon) * 25}deg)` }} />
        <div style={{ fontFamily: font.display, fontWeight: 800, fontSize: 180, letterSpacing: -5, color: color.cream, textShadow: `0 10px 0 ${color.roseDark}`, opacity: icon }}>Mimesis</div>
      </div>
      <div style={{ marginTop: 30, fontFamily: font.display, fontWeight: 700, fontSize: 70, color: color.plum, opacity: text, transform: `translateY(${(1 - text) * 30}px)` }}>
        {COPY[lang].outro}
      </div>
      <div style={{ marginTop: 50, display: 'flex', alignItems: 'center', gap: 30, opacity: badges, transform: `translateY(${(1 - badges) * 30}px)` }}>
        <Img src={staticFile('app-store.svg')} style={{ height: 96 }} />
        <Img src={staticFile('google-play.png')} style={{ height: 96 }} />
      </div>
      <div style={{ marginTop: 34, fontFamily: font.sans, fontWeight: 800, fontSize: 44, color: color.cream, opacity: badges }}>
        {COPY[lang].free}
        {' '}
        ·
        {COPY[lang].site}
      </div>
    </AbsoluteFill>
  )
}

export function Website({ lang }: { lang: Lang }) {
  const frame = useCurrentFrame()
  const steps = STEPS[lang]
  const enter = interpolate(frame, [INTRO - 15, INTRO + 10], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: t => 1 - (1 - t) ** 3 })
  const leave = interpolate(frame, [INTRO + REEL_FRAMES - 8, INTRO + REEL_FRAMES + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const sway = Math.sin(frame / 50) * 1.5
  return (
    <Stage>
      <Sequence durationInFrames={INTRO + 8}>
        <Hero lang={lang} />
      </Sequence>
      {steps.map((step, i) => {
        const from = reelFrame(step.from)
        const to = i + 1 < steps.length ? reelFrame(steps[i + 1].from) : INTRO + REEL_FRAMES
        return (
          <Sequence key={step.title} from={from} durationInFrames={to - from}>
            <Step index={i} total={steps.length} title={step.title} hint={step.hint} />
            <Audio src={staticFile('whoosh.wav')} volume={0.35} />
          </Sequence>
        )
      })}
      <Sequence from={INTRO} durationInFrames={REEL_FRAMES + 14}>
        <AbsoluteFill style={{ alignItems: 'flex-end', justifyContent: 'center', paddingRight: 230 }}>
          <div style={{ transform: `translateX(${enter * 1100}px) translateY(${leave * 1300}px) rotate(${3 + sway + enter * 20 + leave * 12}deg)` }}>
            <Phone lang={lang} />
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
