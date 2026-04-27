import type { StoryFrame, TextElement } from '../types'

export type StoryStyle = 'poster' | 'deco'

// ── SEGMENT TYPES ────────────────────────────────────────────────
interface Segment {
  content: string
  role: 'headline' | 'sub' | 'body' | 'cta' | 'list'
}

const uid = () => crypto.randomUUID()

// ── STORY BLOCK PARSER ────────────────────────────────────────────
// Splits "STORY 1\n...\nSTORY 2\n..." or "STORYS 1\n..." into separate blocks
export function splitStoryBlocks(raw: string): string[] {
  const marker = /^(STORY|STORYS|STORIES?)\s*\d+\s*$/im
  const lines = raw.split('\n')
  const hasMarkers = lines.some(l => marker.test(l.trim()))
  if (!hasMarkers) return [raw.trim()].filter(Boolean)

  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    if (marker.test(line.trim())) {
      if (current.length > 0) blocks.push(current.join('\n').trim())
      current = []
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) blocks.push(current.join('\n').trim())
  return blocks.filter(b => b.length > 0)
}

// ── SEGMENT PARSER ───────────────────────────────────────────────
function parseSegments(raw: string): Segment[] {
  return raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map((line): Segment => {
      const words = line.split(/\s+/).length
      const isCheck = /^[✅☑✓✔]/.test(line)
      const isArrow = /^[→\-•]/.test(line) || /^\d+\./.test(line)
      const isList = isCheck || isArrow
      const isCTA = /\blink\b|\bbio\b|acesse|clique|saiba|compre|garanta|@\w/i.test(line) && !isList
      if (isList) return { content: line, role: 'list' }
      if (isCTA)  return { content: line, role: 'cta' }
      if (words <= 3) return { content: line, role: 'headline' }
      if (words <= 9) return { content: line, role: 'sub' }
      return         { content: line, role: 'body' }
    })
}

// ── FRAME FACTORY ────────────────────────────────────────────────
function mkFrame(bg: string, elements: TextElement[], imageUrl?: string, overlay?: string): StoryFrame {
  return {
    id: uid(),
    backgroundColor: bg,
    imageUrl,
    overlayColor: overlay,
    textElements: elements,
    stickers: [],
    createdAt: new Date().toISOString(),
  }
}

// ── PALETTES ─────────────────────────────────────────────────────
const DARK_BGS = [
  'linear-gradient(160deg,#1a0a0a,#3b0f0f)',
  'linear-gradient(160deg,#0a0a1a,#0f0f3b)',
  'linear-gradient(160deg,#0d0d0d,#1a1a1a)',
  'linear-gradient(160deg,#0f0c29,#302b63)',
  'linear-gradient(160deg,#0a1a0a,#0f3b1a)',
]

const BOX_COLORS = [
  'rgba(80,20,20,0.90)',
  'rgba(30,30,80,0.90)',
  'rgba(20,60,30,0.90)',
  'rgba(60,50,10,0.90)',
  'rgba(50,30,60,0.90)',
]

const OLIVE_BOXES = [
  'rgba(85,90,60,0.92)',
  'rgba(60,50,30,0.92)',
  'rgba(40,60,70,0.92)',
]

// ────────────────────────────────────────────────────────────────
// T1 — BoxTop + BigWord
// Ref img 1: "Construa sua própria" [dark box] + OPORTUNIDADE [huge]
// When: phrase/subtitle + one short headline word
// ────────────────────────────────────────────────────────────────
function t1_boxTopBigWord(segs: Segment[], idx: number, img?: string): StoryFrame {
  const bg = img ? '#000000' : DARK_BGS[idx % DARK_BGS.length]
  const boxColor = BOX_COLORS[idx % BOX_COLORS.length]

  const headline = segs.find(s => s.role === 'headline') ?? segs[segs.length - 1]
  const phrase = segs.find(s => s !== headline) ?? segs[0]

  const bigFont = headline.content.length > 12 ? 68 : headline.content.length > 8 ? 82 : 96

  const els: TextElement[] = [
    {
      id: uid(), content: phrase.content,
      x: 50, y: 24,
      fontSize: 28, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'center', backgroundBox: boxColor, maxWidth: 82,
    },
    {
      id: uid(), content: headline.content,
      x: 50, y: 44,
      fontSize: bigFont, fontFamily: 'Paytone One', color: '#8B1A1A',
      rotation: 0, bold: true, italic: false,
      align: 'center', uppercase: true, maxWidth: 90,
    },
  ]

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.45)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T2 — GiantLetter + WordList
// Ref img 2: "RE" [huge left] + fazer / construir / inventar... [right column]
// When: first segment ≤ 3 chars + 3+ remaining single-word items
// ────────────────────────────────────────────────────────────────
function t2_giantLetterList(segs: Segment[], idx: number, img?: string): StoryFrame {
  const isDark = !!img || idx % 2 === 0
  const bg = isDark ? '#f0ede8' : '#0d0d0d'
  const bigColor = isDark ? '#111111' : '#f0f0f0'
  const listColor = isDark ? '#1a1a1a' : '#e8e8e8'

  const prefix = segs[0]
  const items = segs.slice(1)

  const els: TextElement[] = [
    {
      id: uid(), content: prefix.content,
      x: 11, y: 34,
      fontSize: 155, fontFamily: 'Paytone One', color: bigColor,
      rotation: 0, bold: true, italic: false,
      align: 'left', maxWidth: 35,
    },
    ...items.slice(0, 6).map((s, i): TextElement => ({
      id: uid(), content: s.content,
      x: 48, y: 18 + i * 8.5,
      fontSize: 28, fontFamily: 'Poiret One', color: listColor,
      rotation: 0, bold: false, italic: false,
      align: 'left', maxWidth: 48,
    })),
  ]

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.12)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T3 — InlineHighlight
// Ref img 3: "O seu sucesso deve ser seu [COMPROMISSO] diário!"
// When: one sentence with one key word highlighted in a colored box
// ────────────────────────────────────────────────────────────────
function t3_inlineHighlight(segs: Segment[], idx: number, img?: string): StoryFrame {
  const bg = img ? '#000000' : DARK_BGS[idx % DARK_BGS.length]
  const boxColor = BOX_COLORS[idx % BOX_COLORS.length]

  const mainSeg = segs.find(s => s.role === 'body' || s.role === 'sub') ?? segs[0]
  const keywordSeg = segs.find(s => s.role === 'headline' && s !== mainSeg)

  const els: TextElement[] = []

  if (keywordSeg) {
    els.push({
      id: uid(), content: mainSeg.content,
      x: 50, y: 46,
      fontSize: 24, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'center', maxWidth: 80, lineHeight: 1.4,
    })
    els.push({
      id: uid(), content: keywordSeg.content,
      x: 50, y: 60,
      fontSize: 28, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: true, italic: false,
      align: 'center', backgroundBox: boxColor, maxWidth: 64,
    })
  } else {
    // Auto-highlight the longest word in the sentence
    const words = mainSeg.content.split(/\s+/)
    const hi = [...words].sort((a, b) => b.length - a.length)[0]
    const hiIdx = words.indexOf(hi)
    const before = words.slice(0, hiIdx).join(' ')
    const after  = words.slice(hiIdx + 1).join(' ')

    if (before) els.push({
      id: uid(), content: before,
      x: 50, y: 42, fontSize: 24, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false, align: 'center', maxWidth: 80,
    })
    els.push({
      id: uid(), content: hi,
      x: 50, y: before ? 54 : 48,
      fontSize: 28, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: true, italic: false,
      align: 'center', backgroundBox: boxColor,
    })
    if (after) els.push({
      id: uid(), content: after,
      x: 50, y: before ? 66 : 60, fontSize: 24, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false, align: 'center', maxWidth: 80,
    })
  }

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.40)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T4 — BottomTitleLine
// Ref img 4: photo + CONSTÂNCIA [big center bottom] + line + subtitle
// When: one-word headline + subtitle phrase (bottom zone)
// ────────────────────────────────────────────────────────────────
function t4_bottomTitleLine(segs: Segment[], idx: number, img?: string): StoryFrame {
  const bg = img ? '#000000' : DARK_BGS[idx % DARK_BGS.length]

  const headline = segs.find(s => s.role === 'headline') ?? segs[0]
  const sub = segs.find(s => s !== headline)

  const bigFont = headline.content.length > 12 ? 58 : headline.content.length > 8 ? 70 : 84

  const els: TextElement[] = [
    {
      id: uid(), content: headline.content,
      x: 50, y: 72,
      fontSize: bigFont, fontFamily: 'Paytone One', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'center', uppercase: true,
      decorLine: true, decorLineColor: 'rgba(255,255,255,0.65)',
      maxWidth: 88,
    },
  ]

  if (sub) {
    els.push({
      id: uid(), content: sub.content,
      x: 50, y: 86,
      fontSize: 20, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.88)',
      rotation: 0, bold: false, italic: false,
      align: 'center', maxWidth: 80, lineHeight: 1.35,
    })
  }

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.50)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T5 — BoxHeadline + ArrowList
// Ref img 5: olive box headline center + cream box arrow list below
// When: headline/body + 2+ list items
// ────────────────────────────────────────────────────────────────
function t5_boxHeadlineArrowList(segs: Segment[], idx: number, img?: string): StoryFrame {
  const bg = img ? '#1a1a12' : 'linear-gradient(160deg,#1e1e16,#2a2a1a)'
  const headlineBox = OLIVE_BOXES[idx % OLIVE_BOXES.length]
  const listBox = 'rgba(245,242,235,0.93)'

  const phrase = segs.find(s => s.role === 'body' || s.role === 'sub') ?? segs[0]
  const headline = segs.find(s => s.role === 'headline')
  const items = segs.filter(s => s.role === 'list')
  const cta = segs.find(s => s.role === 'cta')

  const headlineText = [phrase?.content, headline?.content].filter(Boolean).join('\n')

  const listText = items
    .map(s => s.content.startsWith('→') ? s.content : `→ ${s.content}`)
    .join('\n')

  const els: TextElement[] = [
    {
      id: uid(), content: headlineText,
      x: 50, y: 36,
      fontSize: 22, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'center', backgroundBox: headlineBox, maxWidth: 80, lineHeight: 1.45,
    },
  ]

  if (listText) {
    els.push({
      id: uid(), content: listText,
      x: 12, y: 62,
      fontSize: 19, fontFamily: 'Poppins', color: '#1a1a0a',
      rotation: 0, bold: false, italic: false,
      align: 'left', backgroundBox: listBox, maxWidth: 76, lineHeight: 1.6,
    })
  }

  if (cta) {
    els.push({
      id: uid(), content: cta.content,
      x: 50, y: 88,
      fontSize: 14, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.45)',
      rotation: 0, bold: false, italic: false, align: 'center',
    })
  }

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.40)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T6 — CardQuoteLeft
// Ref img 6: semi-transparent card left-center + vertical line + quote
// When: single long quote / paragraph
// ────────────────────────────────────────────────────────────────
function t6_cardQuoteLeft(segs: Segment[], _idx: number, img?: string): StoryFrame {
  const bg = img ? '#1a1209' : 'linear-gradient(160deg,#c8a97e,#8B6914)'
  const cardColor = 'rgba(180,140,60,0.78)'

  const mainSeg = segs.find(s => s.role === 'body' || s.role === 'sub') ?? segs[0]
  const cta = segs.find(s => s.role === 'cta')

  const els: TextElement[] = [
    {
      id: uid(), content: mainSeg.content,
      x: 10, y: 45,
      fontSize: 22, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'left', backgroundBox: cardColor,
      borderLeft: true, borderLeftColor: '#ffffff',
      maxWidth: 72, lineHeight: 1.5,
    },
  ]

  if (cta) {
    els.push({
      id: uid(), content: cta.content,
      x: 10, y: 76,
      fontSize: 14, fontFamily: 'Poiret One', color: 'rgba(255,255,255,0.55)',
      rotation: 0, bold: false, italic: false,
      align: 'left', letterSpacing: 1,
    })
  }

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.28)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T7 — ItalicHeading + ArrowList + Footer
// Ref img 7: "Nosso dia a dia é assim:" italic center + ↓ + list + italic footer
// When: headline ending ":" + list items + closing phrase
// ────────────────────────────────────────────────────────────────
function t7_italicHeadingList(segs: Segment[], _idx: number, img?: string): StoryFrame {
  const bg = img ? '#000000' : 'linear-gradient(160deg,#0d0d0d,#1a1a1a)'

  const heading = segs.find(s => s.role === 'headline' || s.role === 'sub') ?? segs[0]
  const items = segs.filter(s => s.role === 'list' || (s !== heading && s.role === 'body'))
  const footer = segs.find(s => s.role === 'cta')

  const headFontSize = heading.content.length > 20 ? 34 : 42

  const els: TextElement[] = [
    {
      id: uid(), content: heading.content,
      x: 50, y: 32,
      fontSize: headFontSize, fontFamily: 'Poiret One', color: '#ffffff',
      rotation: 0, bold: false, italic: true,
      align: 'center', maxWidth: 80, lineHeight: 1.25,
    },
    {
      id: uid(), content: '↓',
      x: 60, y: 46,
      fontSize: 26, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.45)',
      rotation: 0, bold: false, italic: false, align: 'center',
    },
    ...items.slice(0, 4).map((s, i): TextElement => ({
      id: uid(), content: s.content,
      x: 16, y: 55 + i * 9,
      fontSize: 20, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.88)',
      rotation: 0, bold: false, italic: false,
      align: 'left', maxWidth: 76, lineHeight: 1.3,
    })),
  ]

  if (footer) {
    els.push({
      id: uid(), content: footer.content,
      x: 50, y: 88,
      fontSize: 17, fontFamily: 'Poiret One', color: 'rgba(255,255,255,0.55)',
      rotation: 0, bold: false, italic: true,
      align: 'center', maxWidth: 80,
    })
  }

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.60)' : undefined)
}

// ────────────────────────────────────────────────────────────────
// T8 — BorderLeft Title + Checklist
// Ref img 8: | italic title + bold subtitle upper-left + ✅ checklist middle
// When: title + subtitle + checklist items
// ────────────────────────────────────────────────────────────────
function t8_borderLeftChecklist(segs: Segment[], _idx: number, img?: string): StoryFrame {
  const bg = img ? '#000000' : 'linear-gradient(160deg,#0d0d0d,#1a1a1a)'

  const headline = segs.find(s => s.role === 'headline') ?? segs[0]
  const sub = segs.find(s => s.role === 'sub')
  const items = segs.filter(s => s.role === 'list')
  const cta = segs.find(s => s.role === 'cta')

  const els: TextElement[] = [
    {
      id: uid(), content: headline.content,
      x: 10, y: 22,
      fontSize: 36, fontFamily: 'Poiret One', color: '#ffffff',
      rotation: 0, bold: false, italic: true,
      align: 'left', borderLeft: true, borderLeftColor: '#ffffff',
      maxWidth: 75,
    },
  ]

  if (sub) {
    els.push({
      id: uid(), content: sub.content,
      x: 14, y: 34,
      fontSize: 24, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: true, italic: false,
      align: 'left', maxWidth: 75,
    })
  }

  items.slice(0, 5).forEach((s, i) => {
    const text = /^[✅☑✓✔]/.test(s.content) ? s.content : `✅ ${s.content}`
    els.push({
      id: uid(), content: text,
      x: 10, y: 52 + i * 10,
      fontSize: 22, fontFamily: 'Poppins', color: '#ffffff',
      rotation: 0, bold: false, italic: false,
      align: 'left', maxWidth: 82, lineHeight: 1.3,
    })
  })

  if (cta) {
    els.push({
      id: uid(), content: cta.content,
      x: 50, y: 91,
      fontSize: 13, fontFamily: 'Poppins', color: 'rgba(255,255,255,0.35)',
      rotation: 0, bold: false, italic: false, align: 'center',
    })
  }

  return mkFrame(bg, els, img, img ? 'rgba(0,0,0,0.55)' : undefined)
}

// ── TEMPLATE RANKER ──────────────────────────────────────────────
// Scores all 8 templates for a given set of segments and returns them
// sorted by suitability. rotation picks which rank to use, so each
// Regenerar click cycles to the next valid alternative layout.
type TemplateFn = (segs: Segment[], idx: number, img?: string) => StoryFrame

function rankTemplates(segs: Segment[], _style: StoryStyle, img?: string): TemplateFn[] {
  const listItems    = segs.filter(s => s.role === 'list')
  const hasChecklist = listItems.some(s => /^[✅☑✓✔]/.test(s.content))
  const hasArrows    = listItems.some(s => /^→/.test(s.content))
  const hasAnyList   = listItems.length >= 2
  const headlines    = segs.filter(s => s.role === 'headline')
  const hasBody      = segs.some(s => s.role === 'body')
  const totalWords   = segs.reduce((n, s) => n + s.content.split(' ').length, 0)
  const firstIsAbbr  = segs[0].content.replace(/\s/g, '').length <= 3
  const headingColon = segs.some(s => /:\s*$/.test(s.content.trim()))
  const hasSub       = segs.some(s => s.role === 'sub')
  const hasPhrase    = hasBody || hasSub
  const oneWordHL    = headlines.some(s => s.content.split(' ').length === 1)

  const scores: Array<{ fn: TemplateFn; score: number }> = [
    { fn: t1_boxTopBigWord,        score: (oneWordHL && hasPhrase ? 10 : 0) + (img ? 2 : 0) },
    { fn: t2_giantLetterList,      score: firstIsAbbr && segs.length >= 3 ? 10 : 0 },
    { fn: t3_inlineHighlight,      score: totalWords <= 14 && segs.length <= 2 ? 8 : 1 },
    { fn: t4_bottomTitleLine,      score: (oneWordHL && !hasPhrase ? 9 : oneWordHL ? 4 : 1) + (img ? 3 : 0) },
    { fn: t5_boxHeadlineArrowList, score: (hasArrows || hasAnyList) && hasPhrase ? 10 : hasAnyList ? 7 : 1 },
    { fn: t6_cardQuoteLeft,        score: hasBody && !hasAnyList && totalWords > 10 ? 9 : 2 },
    { fn: t7_italicHeadingList,    score: headingColon && hasAnyList ? 10 : hasSub ? 3 : 1 },
    { fn: t8_borderLeftChecklist,  score: hasChecklist ? 10 : hasSub && hasAnyList ? 5 : 1 },
  ]

  return scores
    .sort((a, b) => b.score - a.score)
    .map(s => s.fn)
}

// ── MAIN EXPORT ──────────────────────────────────────────────────
export function generateStoryFrames(
  text: string,
  style: StoryStyle,
  imageUrl?: string,
  rotation = 0
): StoryFrame[] {
  const blocks = splitStoryBlocks(text)
  return blocks.map((block, i) => {
    const segs    = parseSegments(block)
    const img     = i === 0 ? imageUrl : undefined
    const ranked  = rankTemplates(segs, style, img)
    const pick    = ranked[rotation % ranked.length]
    return pick(segs, i, img)
  })
}
