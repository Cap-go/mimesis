// App Store creative assets (iOS 27): product page header (21:9), search results (3:2) and the
// universal 16:9 still. They autoplay muted and loop, so they carry no sound and no long copy.
import type { CSSProperties } from 'react'
import type { Lang } from './theme'
import { AbsoluteFill, Freeze, interpolate, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import { Icon, Reel, REEL_RATIO, Stage } from './parts'
import { color, COPY, font, FPS } from './theme'

// Gameplay from Mona Lisa to the last card, then a short crossfade back to the start.
const LOOP_START = 7.4
const LOOP_END = 15.3
const FADE = 10
export const LOOP_FRAMES = Math.round((LOOP_END - LOOP_START) * FPS)

function Screen({ lang, width, at, style }: { lang: Lang, width: number, at?: number, style?: CSSProperties }) {
  const frame = useCurrentFrame()
  const frame3d: CSSProperties = { borderRadius: width * 0.13, overflow: 'hidden', border: `${width * 0.022}px solid ${color.plum}`, boxShadow: `0 ${width * 0.08}px ${width * 0.16}px -${width * 0.04}px rgba(59,10,31,0.55)`, background: color.plum, ...style }
  if (at !== undefined) {
    return (
      <div style={frame3d}>
        <Freeze frame={0}><Reel lang={lang} from={at} width={width} /></Freeze>
      </div>
    )
  }
  // Seamless loop: the last FADE frames blend into the reel just before LOOP_START, so the
  // first frame of the next loop is exactly what the overlay ends on.
  const fade = interpolate(frame, [LOOP_FRAMES - FADE, LOOP_FRAMES], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div style={{ ...frame3d, position: 'relative', width, height: width * REEL_RATIO }}>
      <Reel lang={lang} from={LOOP_START} width={width} style={{ position: 'absolute', inset: 0 }} />
      <Sequence from={LOOP_FRAMES - FADE} layout="none">
        <div style={{ position: 'absolute', inset: 0, opacity: fade }}>
          <Reel lang={lang} from={LOOP_START - FADE / FPS} width={width} />
        </div>
      </Sequence>
    </div>
  )
}

// Three phones: the game in the middle, teams and the win on the sides.
function Phones({ lang, height, still }: { lang: Lang, height: number, still?: boolean }) {
  const frame = useCurrentFrame()
  const centre = height / REEL_RATIO
  const side = centre * 0.82
  // Gentle sway that returns to rest at the loop point.
  const sway = Math.sin((frame / LOOP_FRAMES) * Math.PI * 2) * 1.2
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
      <Screen lang={lang} width={side} at={2.7} style={{ transform: `translateX(${side * 0.32}px) translateY(${side * 0.12}px) rotate(${-9 + sway}deg)` }} />
      <div style={{ zIndex: 1 }}>
        <Screen lang={lang} width={centre} at={still ? 10.0 : undefined} />
      </div>
      <Screen lang={lang} width={side} at={17.6} style={{ transform: `translateX(${-side * 0.32}px) translateY(${side * 0.12}px) rotate(${9 - sway}deg)` }} />
    </div>
  )
}

export function Header({ lang }: { lang: Lang }) {
  const { height } = useVideoConfig()
  return (
    <Stage loop={LOOP_FRAMES}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Phones lang={lang} height={height * 0.86} />
      </AbsoluteFill>
    </Stage>
  )
}

export function Search({ lang }: { lang: Lang }) {
  const { width, height } = useVideoConfig()
  return (
    <Stage loop={LOOP_FRAMES}>
      <AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: `0 ${width * 0.07}px`, gap: width * 0.05 }}>
        <div style={{ flex: 1 }}>
          <Icon size={height * 0.16} />
          <div style={{ marginTop: height * 0.05, fontFamily: font.display, fontWeight: 800, fontSize: height * 0.115, lineHeight: 0.98, letterSpacing: -6, color: color.cream, textShadow: `0 ${height * 0.008}px 0 ${color.roseDark}`, whiteSpace: 'pre-line' }}>
            {COPY[lang].pitch}
          </div>
          <div style={{ marginTop: height * 0.035, fontFamily: font.sans, fontWeight: 800, fontSize: height * 0.045, color: color.plum }}>
            {COPY[lang].tagline}
          </div>
        </div>
        <Screen lang={lang} width={height * 0.84 / REEL_RATIO} />
      </AbsoluteFill>
    </Stage>
  )
}

export function Universal({ lang }: { lang: Lang }) {
  const { height } = useVideoConfig()
  return (
    <Stage>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Phones lang={lang} height={height * 0.84} still />
      </AbsoluteFill>
    </Stage>
  )
}
