import type { CSSProperties, ReactNode } from 'react'
import type { Lang } from './theme'
import { AbsoluteFill, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { color, font, FPS, REEL } from './theme'

// Height / width of the simulator recording (1320×2868).
export const REEL_RATIO = 2868 / 1320

// Warm stage gradient with slowly drifting cards, like the app background.
// `loop` makes the drift repeat every `loop` frames, for assets that play on a loop.
export function Stage({ children, loop }: { children?: ReactNode, loop?: number }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const cards = [
    { x: 0.08, y: 0.12, r: -14, s: 1, d: 0 },
    { x: 0.86, y: 0.2, r: 12, s: 0.8, d: 40 },
    { x: 0.14, y: 0.78, r: 9, s: 0.9, d: 80 },
    { x: 0.9, y: 0.84, r: -10, s: 1.1, d: 120 },
    { x: 0.5, y: 0.04, r: 4, s: 0.6, d: 160 },
  ]
  const unit = Math.min(width, height) * 0.16
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 30% 10%, ${color.pizazzLight} 0%, ${color.pizazz} 55%, #d4642c 100%)`, overflow: 'hidden' }}>
      {cards.map((card, i) => {
        const phase = loop ? (frame / loop) * Math.PI * 2 : frame / 45
        const drift = Math.sin(phase + card.d / 45) * 14
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: card.x * width - unit / 2,
              top: card.y * height - unit * 0.7 + drift,
              width: unit * card.s,
              height: unit * 1.4 * card.s,
              borderRadius: unit * 0.16,
              background: 'rgba(255, 250, 245, 0.16)',
              border: '3px solid rgba(255, 250, 245, 0.28)',
              transform: `rotate(${card.r + Math.sin(phase * (loop ? 1 : 0.75) + card.d / 60) * 4}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: font.display,
              fontWeight: 800,
              fontSize: unit * 0.6 * card.s,
              color: 'rgba(255, 250, 245, 0.35)',
            }}
          >
            ?
          </div>
        )
      })}
      {children}
    </AbsoluteFill>
  )
}

function Ripple({ age, x, y, size }: { age: number, x: number, y: number, size: number }) {
  const grow = interpolate(age, [0, 12], [0.4, 1.4], { extrapolateRight: 'clamp' })
  const fade = interpolate(age, [0, 3, 14], [0, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.4)',
        border: `${size * 0.05}px solid rgba(255, 255, 255, 0.95)`,
        boxShadow: '0 0 30px rgba(255,255,255,0.6)',
        transform: `scale(${grow})`,
        opacity: fade,
      }}
    />
  )
}

// The recorded game, played from `from` (reel seconds) with ripples where buttons are tapped.
export function Reel({ lang, from = REEL.start, width, style }: { lang: Lang, from?: number, width: number, style?: CSSProperties }) {
  const frame = useCurrentFrame()
  return (
    <div style={{ position: 'relative', overflow: 'hidden', width, height: width * REEL_RATIO, ...style }}>
      <OffthreadVideo src={staticFile(`reel-${lang}.mp4`)} startFrom={Math.round(from * FPS)} muted style={{ width: '100%', height: '100%', display: 'block' }} />
      {REEL.taps.map((tap) => {
        const age = frame - Math.round((tap.at - from) * FPS)
        return age >= 0 && age < 16 ? <Ripple key={tap.at} age={age} x={tap.x} y={tap.y} size={width * 0.16} /> : null
      })}
    </div>
  )
}

export function Icon({ size, style }: { size: number, style?: CSSProperties }) {
  return <Img src={staticFile('icon.png')} style={{ width: size, height: size, borderRadius: size * 0.225, boxShadow: '0 20px 50px -10px rgba(59,10,31,0.45)', ...style }} />
}

// Springs in from `delay` frames, for titles and badges.
export function usePop(delay = 0, damping = 12) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } })
}
