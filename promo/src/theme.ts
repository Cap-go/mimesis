import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/nunito'

export const FPS = 30

export const color = {
  rose: '#b5244f',
  roseDark: '#7e1636',
  pizazz: '#e67f3c',
  pizazzLight: '#fbb079',
  plum: '#3b0a1f',
  cream: '#fffaf5',
}

export const font = {
  display: '\'Bricolage Grotesque Variable\', sans-serif',
  sans: '\'Nunito Variable\', sans-serif',
}

export type Lang = 'en' | 'fr'

// Seconds in public/reel-<lang>.mp4, the scripted game recorded on the iOS simulator
// (see src/services/demo.ts "reel" in the app).
export const REEL = {
  start: 0.5,
  end: 19.3,
  // Moments where the reel taps a button, with the tap position as a fraction of the frame.
  taps: [
    { at: 1.2, x: 0.3, y: 0.41 }, // Add a player
    { at: 2.8, x: 0.5, y: 0.865 }, // Choose a theme
    { at: 4.6, x: 0.7, y: 0.3 }, // Art
    { at: 6.5, x: 0.5, y: 0.92 }, // Let's go!
    { at: 8.9, x: 0.73, y: 0.905 }, // Got it!
    { at: 10.5, x: 0.73, y: 0.905 },
    { at: 12.1, x: 0.27, y: 0.905 }, // Skip
    { at: 13.9, x: 0.73, y: 0.905 },
    { at: 15.4, x: 0.73, y: 0.905 },
  ],
  win: 15.5,
}

// What each part of the reel explains, in reel seconds.
export const STEPS: Record<Lang, { from: number, title: string, hint: string }[]> = {
  en: [
    { from: 0.5, title: 'Make your teams', hint: 'Add your friends in seconds' },
    { from: 3.0, title: 'Pick a theme', hint: 'Movies, idioms, rebus, art…' },
    { from: 4.9, title: 'Pass the phone', hint: 'Only the mime sees the card' },
    { from: 6.7, title: 'Mime it. No words!', hint: 'Your team shouts the answer' },
    { from: 10.3, title: 'Got it? Score!', hint: 'Stuck? Skip, no penalty' },
    { from: 15.4, title: 'First to 10 wins', hint: 'Then play again!' },
  ],
  fr: [
    { from: 0.5, title: 'Crée tes équipes', hint: 'Ajoute tes amis en quelques secondes' },
    { from: 3.0, title: 'Choisis un thème', hint: 'Films, expressions, rébus, art…' },
    { from: 4.9, title: 'Passe le téléphone', hint: 'Seul le mime voit la carte' },
    { from: 6.7, title: 'Mime, sans parler !', hint: 'Ton équipe crie la réponse' },
    { from: 10.3, title: 'Trouvé ? Un\u00A0point !', hint: 'Bloqué ? Passe, sans pénalité' },
    { from: 15.4, title: 'Premier à 10, gagné !', hint: 'Et on rejoue !' },
  ],
}

export const COPY: Record<Lang, { tagline: string, pitch: string, outro: string, site: string, free: string }> = {
  en: {
    tagline: 'The charades game',
    pitch: 'One phone. Zero words.\nEndless laughs.',
    outro: 'One phone. Zero words. Endless laughs.',
    site: 'mimesis.fun',
    free: 'Free on iPhone & Android',
  },
  fr: {
    tagline: 'Le jeu de mime',
    pitch: 'Un téléphone. Zéro mot.\nDes fous rires.',
    outro: 'Un téléphone. Zéro mot. Des fous rires.',
    site: 'mimesis.fun',
    free: 'Gratuit sur iPhone et Android',
  },
}
