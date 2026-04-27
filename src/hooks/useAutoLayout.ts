import type { StoryFrame, TextElement } from '../types'

export type StoryStyle = 'poster' | 'deco'

// ─── TEXT PARSING ────────────────────────────────────────────────

interface Segment {
  content: string
  role: 'headline' | 'sub' | 'body' | 'cta' | 'list'
}

function parseSegments(raw: string): Segment[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map((line): Segment => {
      const words = line.split(/\s+/).length
      const isList = /^[→✓\-•✔]/.test(line) || line.startsWith('- ')
      const isCTA  = /link|bio|acesse|clique|saiba|compre|garanta|→$/i.test(line)
      if (isList)              return { content: line, role: 'list' }
      if (isCTA)               return { content: line, role: 'cta' }
      if (words <= 4)          return { content: line, role: 'headline' }
      if (words <= 10)         return { content: line, role: 'sub' }
      return                          { content: line, role: 'body' }
    })
}

function groupIntoSlides(segs: Segment[]): Segment[][] {
  const slides: Segment[][] = []
  let current: Segment[] = []
  let weight = 0

  for (const s of segs) {
    const w = s.role === 'body' ? 3 : s.role === 'list' ? 1.5 : 2
    if (weight + w > 5 && current.length > 0) {
      slides.push(current)
      current = []
      weight = 0
    }
    current.push(s)
    weight += w
  }
  if (current.length > 0) slides.push(current)
  return slides.length ? slides : [[{ content: 'Seu texto aqui', role: 'headline' }]]
}

// ─── HELPERS ─────────────────────────────────────────────────────

const id = () => crypto.randomUUID()

function frame(
  bg: string,
  elements: TextElement[],
  imageUrl?: string,
  overlay = 'rgba(0,0,0,0.42)'
): StoryFrame {
  return {
    id: id(),
    backgroundColor: bg,
    imageUrl,
    overlayColor: imageUrl ? overlay : undefined,
    textElements: elements,
    stickers: [],
    createdAt: new Date().toISOString(),
  }
}

// ─── POSTER PATTERNS ─────────────────────────────────────────────
// Inspired by: dark overlay + strong typography + colored boxes

const POSTER_BGS = [
  'linear-gradient(160deg,#1a0a0a 0%,#3b0f0f 100%)',
  'linear-gradient(160deg,#0a0a1a 0%,#0f0f3b 100%)',
  'linear-gradient(160deg,#0a1a0a 0%,#0f3b1a 100%)',
  'linear-gradient(160deg,#1a1a0a 0%,#3b3b0f 100%)',
  'linear-gradient(160deg,#0d0d0d 0%,#1a1a1a 100%)',
]

const POSTER_BOX_COLORS = [
  'rgba(90,26,26,0.92)',
  'rgba(26,26,90,0.92)',
  'rgba(58,58,20,0.88)',
  'rgba(20,58,30,0.88)',
  'rgba(15,15,15,0.90)',
]

/** Pattern: small label in box + HUGE word + underline (image 1, 4) */
function posterImpact(segs: Segment[], idx: number, img?: string): StoryFrame {
  const boxColor = POSTER_BOX_COLORS[idx % POSTER_BOX_COLORS.length]
  const bg = POSTER_BGS[idx % POSTER_BGS.length]
  const headline = segs.find(s => s.role === 'headline') ?? segs[0]
  const sub      = segs.find(s => s.role === 'sub' || s.role === 'body')
  const cta      = segs.find(s => s.role === 'cta')

  const els: TextElement[] = []

  if (sub) {
    els.push({
      id: id(), content: sub.content,
      x: 50, y: 26,
      fontSize: 28, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'center', backgroundBox: boxColor,
      maxWidth: 80,
    })
  }

  els.push({
    id: id(), content: headline.content,
    x: 50, y: sub ? 52 : 46,
    fontSize: headline.content.length > 10 ? 68 : 88,
    fontFamily: 'Paytone One', color: '#ffffff',
    rotation: 0, bold: false, italic: false,
    align: 'center', uppercase: true,
    decorLine: true, decorLineColor: '#ffffff',
    maxWidth: 88,
  })

  if (cta) {
    els.push({
      id: id(), content: cta.content,
      x: 50, y: 80,
      fontSize: 22, fontFamily: 'Inter', color: 'rgba(255,255,255,0.8)',
      rotation: 0, bold: false, italic: false,
      align: 'center',
    })
  }

  return frame(bg, els, img, 'rgba(0,0,0,0.50)')
}

/** Pattern: bottom zone — big word + line + subtitle (image 4) */
function posterBottom(segs: Segment[], idx: number, img?: string): StoryFrame {
  const bg = POSTER_BGS[idx % POSTER_BGS.length]
  const headline = segs.find(s => s.role === 'headline') ?? segs[0]
  const rest = segs.filter(s => s !== headline)

  const els: TextElement[] = []

  els.push({
    id: id(), content: headline.content,
    x: 10, y: 68,
    fontSize: headline.content.length > 12 ? 56 : 72,
    fontFamily: 'Paytone One', color: '#ffffff',
    rotation: 0, bold: false, italic: false,
    align: 'left', uppercase: true,
    decorLine: true, decorLineColor: 'rgba(255,255,255,0.6)',
    maxWidth: 86,
  })

  rest.forEach((s, i) => {
    els.push({
      id: id(), content: s.content,
      x: 10, y: 80 + i * 8,
      fontSize: 22, fontFamily: 'Inter', color: 'rgba(255,255,255,0.85)',
      rotation: 0, bold: false, italic: false,
      align: 'left', maxWidth: 82,
    })
  })

  return frame(bg, els, img, 'rgba(0,0,0,0.45)')
}

/** Pattern: list items left-aligned with box + arrows (image 5, 8) */
function posterList(segs: Segment[], idx: number, img?: string): StoryFrame {
  const boxColor = POSTER_BOX_COLORS[idx % POSTER_BOX_COLORS.length]
  const bg = POSTER_BGS[idx % POSTER_BGS.length]
  const headline = segs.find(s => s.role === 'headline' || s.role === 'sub')
  const items = segs.filter(s => s.role === 'list' || (s !== headline && s.role !== 'cta'))
  const cta = segs.find(s => s.role === 'cta')

  const els: TextElement[] = []

  if (headline) {
    els.push({
      id: id(), content: headline.content,
      x: 10, y: 22,
      fontSize: 34, fontFamily: 'Paytone One', color: '#ffffff',
      rotation: 0, bold: true, italic: false,
      align: 'left', backgroundBox: boxColor,
      maxWidth: 82, borderLeft: true, borderLeftColor: '#ffffff',
    })
  }

  items.slice(0, 5).forEach((s, i) => {
    const text = s.content.startsWith('→') || s.content.startsWith('-')
      ? s.content
      : `→ ${s.content}`
    els.push({
      id: id(), content: text,
      x: 10, y: (headline ? 42 : 30) + i * 11,
      fontSize: 22, fontFamily: 'Inter', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'left', maxWidth: 82, lineHeight: 1.3,
    })
  })

  if (cta) {
    els.push({
      id: id(), content: cta.content,
      x: 10, y: 86,
      fontSize: 19, fontFamily: 'Inter', color: 'rgba(255,255,255,0.7)',
      rotation: 0, bold: false, italic: false,
      align: 'left',
    })
  }

  return frame(bg, els, img, 'rgba(0,0,0,0.52)')
}

// ─── DECO PATTERNS ───────────────────────────────────────────────
// Inspired by: cream/warm tones, elegant serif, left-border, quote boxes

const DECO_BGS = [
  'linear-gradient(160deg,#f5f0e8 0%,#e8dcc8 100%)',
  'linear-gradient(160deg,#1a1a1a 0%,#2d2d2d 100%)',
  'linear-gradient(160deg,#f0ebe3 0%,#d4c5b0 100%)',
  'linear-gradient(160deg,#0d0d0d 0%,#1a1209 100%)',
  'linear-gradient(160deg,#ede8e0 0%,#c9b99a 100%)',
]

const DECO_DARK = [false, true, false, true, false]

/** Pattern: left-border + italic title + bold sub + body (image 6, 8) */
function decoLeftBlock(segs: Segment[], idx: number, img?: string): StoryFrame {
  const dark = DECO_DARK[idx % DECO_DARK.length] || !!img
  const bg = DECO_BGS[idx % DECO_BGS.length]
  const baseColor = dark ? '#f5f0e8' : '#1a1209'
  const accentColor = dark ? '#d4af37' : '#7a5c2e'

  const headline = segs.find(s => s.role === 'headline')
  const sub = segs.find(s => s.role === 'sub')
  const body = segs.filter(s => s.role === 'body' || s.role === 'list')
  const cta = segs.find(s => s.role === 'cta')

  const els: TextElement[] = []

  if (headline) {
    els.push({
      id: id(), content: headline.content,
      x: 10, y: sub ? 22 : 30,
      fontSize: 44, fontFamily: 'Poiret One', color: baseColor,
      rotation: 0, bold: false, italic: true,
      align: 'left', borderLeft: true, borderLeftColor: accentColor,
      maxWidth: 80,
    })
  }

  if (sub) {
    els.push({
      id: id(), content: sub.content,
      x: 10, y: headline ? 38 : 28,
      fontSize: 26, fontFamily: 'Poppins', color: baseColor,
      rotation: 0, bold: true, italic: false,
      align: 'left', maxWidth: 80,
    })
  }

  body.slice(0, 4).forEach((s, i) => {
    const text = s.role === 'list'
      ? (s.content.startsWith('→') ? s.content : `→ ${s.content}`)
      : s.content
    els.push({
      id: id(), content: text,
      x: 10, y: (headline || sub ? 52 : 40) + i * 10,
      fontSize: 20, fontFamily: 'Inter', color: baseColor,
      rotation: 0, bold: false, italic: false,
      align: 'left', maxWidth: 80, opacity: 0.85,
    })
  })

  if (cta) {
    els.push({
      id: id(), content: cta.content,
      x: 10, y: 86,
      fontSize: 16, fontFamily: 'Poiret One', color: accentColor,
      rotation: 0, bold: false, italic: false,
      align: 'left', letterSpacing: 1,
    })
  }

  return frame(bg, els, img, 'rgba(0,0,0,0.30)')
}

/** Pattern: center quote — large italic + underline + body (image 6, 7) */
function decoCenterQuote(segs: Segment[], idx: number, img?: string): StoryFrame {
  const dark = DECO_DARK[idx % DECO_DARK.length] || !!img
  const bg = DECO_BGS[idx % DECO_BGS.length]
  const baseColor = dark ? '#f5f0e8' : '#1a1209'
  const accentColor = dark ? '#d4af37' : '#7a5c2e'
  const boxColor = dark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)'

  const headline = segs.find(s => s.role === 'headline')
  const sub = segs.find(s => s.role === 'sub')
  const body = segs.filter(s => s.role === 'body')
  const cta = segs.find(s => s.role === 'cta')

  const els: TextElement[] = []

  const mainSeg = headline ?? sub ?? segs[0]
  els.push({
    id: id(), content: mainSeg.content,
    x: 50, y: body.length ? 35 : 42,
    fontSize: mainSeg.content.length > 16 ? 40 : 52,
    fontFamily: 'Poiret One', color: baseColor,
    rotation: 0, bold: false, italic: true,
    align: 'center',
    decorLine: true, decorLineColor: accentColor,
    maxWidth: 82, lineHeight: 1.25,
    backgroundBox: img ? boxColor : undefined,
  })

  if (sub && sub !== mainSeg) {
    els.push({
      id: id(), content: sub.content,
      x: 50, y: 56,
      fontSize: 24, fontFamily: 'Poppins', color: baseColor,
      rotation: 0, bold: true, italic: false,
      align: 'center', maxWidth: 78, opacity: 0.9,
    })
  }

  body.forEach((s, i) => {
    els.push({
      id: id(), content: s.content,
      x: 50, y: 64 + i * 10,
      fontSize: 19, fontFamily: 'Inter', color: baseColor,
      rotation: 0, bold: false, italic: true,
      align: 'center', maxWidth: 76, opacity: 0.78,
    })
  })

  if (cta) {
    els.push({
      id: id(), content: cta.content,
      x: 50, y: 86,
      fontSize: 16, fontFamily: 'Poiret One', color: accentColor,
      rotation: 0, bold: false, italic: false,
      align: 'center', letterSpacing: 2,
    })
  }

  return frame(bg, els, img, 'rgba(0,0,0,0.35)')
}

/** Pattern: minimal — single large word center + ornament (luxury deco) */
function decoMinimal(segs: Segment[], idx: number, img?: string): StoryFrame {
  const dark = DECO_DARK[idx % DECO_DARK.length] || !!img
  const bg = DECO_BGS[idx % DECO_BGS.length]
  const baseColor = dark ? '#f5f0e8' : '#1a1209'
  const accentColor = dark ? '#d4af37' : '#7a5c2e'

  const main = segs[0]
  const sub = segs[1]

  const els: TextElement[] = [
    {
      id: id(), content: '✦',
      x: 50, y: 32,
      fontSize: 18, fontFamily: 'Poiret One', color: accentColor,
      rotation: 0, bold: false, italic: false,
      align: 'center', letterSpacing: 8,
    },
    {
      id: id(), content: main.content,
      x: 50, y: 48,
      fontSize: main.content.length > 14 ? 48 : 62,
      fontFamily: 'Poiret One', color: baseColor,
      rotation: 0, bold: false, italic: false,
      align: 'center',
      decorLine: true, decorLineColor: accentColor,
      letterSpacing: 4, maxWidth: 84,
    },
  ]

  if (sub) {
    els.push({
      id: id(), content: sub.content,
      x: 50, y: 66,
      fontSize: 20, fontFamily: 'Poiret One', color: baseColor,
      rotation: 0, bold: false, italic: true,
      align: 'center', opacity: 0.75, maxWidth: 72,
    })
  }

  els.push({
    id: id(), content: '✦',
    x: 50, y: 80,
    fontSize: 18, fontFamily: 'Poiret One', color: accentColor,
    rotation: 0, bold: false, italic: false,
    align: 'center', letterSpacing: 8,
  })

  return frame(bg, els, img, 'rgba(0,0,0,0.28)')
}

// ─── PATTERN SELECTOR ─────────────────────────────────────────────

function selectPattern(segs: Segment[], style: StoryStyle, idx: number, img?: string): StoryFrame {
  const hasList = segs.some(s => s.role === 'list')
  const total = segs.reduce((n, s) => n + s.content.split(' ').length, 0)
  const hasHeadline = segs.some(s => s.role === 'headline')

  if (style === 'poster') {
    if (hasList)                   return posterList(segs, idx, img)
    if (total <= 12 && hasHeadline) return posterImpact(segs, idx, img)
    return posterBottom(segs, idx, img)
  } else {
    if (segs.length === 1 || total <= 8) return decoMinimal(segs, idx, img)
    if (hasList || segs.some(s => s.role === 'body')) return decoLeftBlock(segs, idx, img)
    return decoCenterQuote(segs, idx, img)
  }
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────

export function generateStoryFrames(
  text: string,
  style: StoryStyle,
  imageUrl?: string
): StoryFrame[] {
  const segs = parseSegments(text)
  const groups = groupIntoSlides(segs)
  return groups.map((group, i) =>
    selectPattern(group, style, i, i === 0 ? imageUrl : undefined)
  )
}
