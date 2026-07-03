// Gradient palettes: dye colors are sampled along `stops`, background is per-palette.
// mode 'dark'  → additive light on a dark background (bloom/sunrays active)
// mode 'paper' → subtractive watercolor pigment on light paper (Beer–Lambert)

export interface Palette {
  name: string
  mode: 'dark' | 'paper'
  /** 2–6 hex stops — in paper mode these are the actual ink colors */
  stops: string[]
  /** window/projector background (paper color in paper mode) */
  bg: string
}

export const PALETTES: Record<string, Palette> = {
  joy: {
    name: 'Joy',
    mode: 'paper',
    // fresh & happy: sky → mint → sunny yellow → coral → pink → lavender
    stops: ['#29a8e8', '#17c9a4', '#ffc722', '#ff8a3d', '#ff5f9e', '#8f6ae8'],
    bg: '#faf7ef'
  },
  watercolor: {
    name: 'Watercolor',
    mode: 'paper',
    // full wet-palette sweep: indigo → blue → teal → moss → ochre → sienna → crimson → plum
    stops: ['#26356e', '#3b5ea8', '#187d84', '#4f7d3c', '#c08a2e', '#a85a32', '#a13333', '#8e3d6b'],
    bg: '#f2efe6'
  },
  sumiInk: {
    name: 'Sumi Ink',
    mode: 'paper',
    stops: ['#1a2233', '#2f4858', '#5c6b73'],
    bg: '#f5f2ea'
  },
  tealInk: {
    name: 'Teal Ink',
    mode: 'dark',
    stops: ['#04343a', '#0aa7a0', '#7ff5e1'],
    bg: '#0a0f0e'
  },
  ember: {
    name: 'Ember',
    mode: 'dark',
    stops: ['#3d0c02', '#c2410c', '#fbbf24'],
    bg: '#0f0806'
  },
  ultraviolet: {
    name: 'Ultraviolet',
    mode: 'dark',
    stops: ['#1e1b4b', '#7c3aed', '#e879f9'],
    bg: '#0b0714'
  },
  monoWhite: {
    name: 'Mono White',
    mode: 'dark',
    stops: ['#232323', '#9a9a9a', '#ffffff'],
    bg: '#050505'
  },
  bioluminescent: {
    name: 'Bioluminescent',
    mode: 'dark',
    stops: ['#062a78', '#00c2d1', '#eafffb'],
    bg: '#03060f'
  },
  vietnamLacquer: {
    name: 'Vietnam Lacquer',
    mode: 'dark',
    stops: ['#7f1d1d', '#dc2626', '#f59e0b', '#fde68a'],
    bg: '#140705'
  }
}

export const DEFAULT_PALETTE = 'joy'
