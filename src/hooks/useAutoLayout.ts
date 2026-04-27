import type { StoryFrame, TextElement } from '../types'

export type StoryStyle = 'poster' | 'deco'

interface TextSegment {
  content: string
  role: 'headline' | 'subheadline' | 'body' | 'cta' | 'accent'
}

const POSTER_GRADIENTS = [
  'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(160deg, #1a1a2e 0%, #e94560 100%)',
  'linear-gradient(160deg, #000000 0%, #434343 100%)',
  'linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
  'linear-gradient(160deg, #4b0082 0%, #0000cd 100%)',
]

const DECO_GRADIENTS = [
  'linear-gradient(160deg, #f5f0e8 0%, #e8dcc8 100%)',
  'linear-gradient(160deg, #1a1a1a 0%, #2d2d2d 100%)',
  'linear-gradient(160deg, #0d0d0d 0%, #1a1209 100%)',
  'linear-gradient(160deg, #f0ebe3 0%, #d4c5b0 100%)',
  'linear-gradient(160deg, #111827 0%, #1f2937 100%)',
]

function parseTextIntoSegments(rawText: string): TextSegment[] {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  return lines.map((line): TextSegment => {
    const wordCount = line.split(/\s+/).length
    const isAllCaps = line === line.toUpperCase() && /[A-ZÀ-Ú]/.test(line)
    const hasEmoji = /\p{Emoji}/u.test(line)
    const endsWithCTA = /→|👆|clique|acesse|saiba|compre|garanta|link|bio/i.test(line)

    if (endsWithCTA) return { content: line, role: 'cta' }
    if (wordCount <= 3 || isAllCaps) return { content: line, role: 'headline' }
    if (wordCount <= 8) return { content: line, role: 'subheadline' }
    if (hasEmoji && wordCount <= 6) return { content: line, role: 'accent' }
    return { content: line, role: 'body' }
  })
}

function distributeSegmentsIntoSlides(segments: TextSegment[]): TextSegment[][] {
  const slides: TextSegment[][] = []
  let current: TextSegment[] = []
  let currentWeight = 0

  for (const seg of segments) {
    const weight = seg.role === 'body' ? 3 : seg.role === 'headline' ? 2 : 1

    if (currentWeight + weight > 4 && current.length > 0) {
      slides.push(current)
      current = []
      currentWeight = 0
    }

    current.push(seg)
    currentWeight += weight
  }

  if (current.length > 0) slides.push(current)
  if (slides.length === 0) slides.push([{ content: 'Seu texto aqui', role: 'headline' }])

  return slides
}

function buildPosterSlide(
  segments: TextSegment[],
  index: number,
  imageUrl?: string
): StoryFrame {
  const gradient = POSTER_GRADIENTS[index % POSTER_GRADIENTS.length]
  const elements: TextElement[] = []

  const positions = layoutPositions(segments.length)

  segments.forEach((seg, i) => {
    const pos = positions[i]
    const base: Omit<TextElement, 'id' | 'content' | 'fontSize' | 'color' | 'y'> = {
      x: 50,
      fontFamily: 'Paytone One',
      rotation: 0,
      bold: false,
      italic: false,
    }

    let el: TextElement

    switch (seg.role) {
      case 'headline':
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content.toUpperCase(),
          fontSize: seg.content.length > 12 ? 44 : 56,
          color: '#ffffff', y: pos,
          bold: false,
        }
        break
      case 'subheadline':
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: 26, color: 'rgba(255,255,255,0.85)', y: pos,
          fontFamily: 'Inter',
        }
        break
      case 'cta':
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: 20, color: '#f59e0b', y: pos,
          fontFamily: 'Inter', bold: true,
        }
        break
      case 'accent':
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: 32, color: '#f59e0b', y: pos,
        }
        break
      default:
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: 20, color: 'rgba(255,255,255,0.75)', y: pos,
          fontFamily: 'Inter',
        }
    }
    elements.push(el)
  })

  return {
    id: crypto.randomUUID(),
    backgroundColor: imageUrl ? '#000000' : gradient,
    imageUrl,
    textElements: elements,
    stickers: [],
    createdAt: new Date().toISOString(),
  }
}

function buildDecoSlide(
  segments: TextSegment[],
  index: number,
  imageUrl?: string
): StoryFrame {
  const gradient = DECO_GRADIENTS[index % DECO_GRADIENTS.length]
  const isDark = index % 2 === 1
  const baseColor = isDark ? '#f5f0e8' : '#1a1209'
  const accentColor = isDark ? '#d4af37' : '#8b6914'
  const elements: TextElement[] = []

  const positions = layoutPositions(segments.length)

  segments.forEach((seg, i) => {
    const pos = positions[i]
    const base: Omit<TextElement, 'id' | 'content' | 'fontSize' | 'color' | 'y'> = {
      x: 50,
      fontFamily: 'Poiret One',
      rotation: 0,
      bold: false,
      italic: false,
    }

    let el: TextElement

    switch (seg.role) {
      case 'headline':
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: seg.content.length > 14 ? 38 : 52,
          color: baseColor, y: pos,
        }
        break
      case 'subheadline':
        el = {
          ...base, id: crypto.randomUUID(), content: `— ${seg.content} —`,
          fontSize: 20, color: accentColor, y: pos,
          italic: true,
        }
        break
      case 'cta':
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: 18, color: accentColor, y: pos,
          fontFamily: 'Poiret One',
        }
        break
      case 'accent':
        el = {
          ...base, id: crypto.randomUUID(), content: `✦ ${seg.content} ✦`,
          fontSize: 22, color: accentColor, y: pos,
        }
        break
      default:
        el = {
          ...base, id: crypto.randomUUID(), content: seg.content,
          fontSize: 18, color: `${baseColor}cc`, y: pos,
          italic: true,
        }
    }
    elements.push(el)
  })

  if (segments.length === 1) {
    elements.push({
      id: crypto.randomUUID(),
      content: '✦',
      x: 50, y: 20,
      fontSize: 18,
      fontFamily: 'Poiret One',
      color: accentColor,
      rotation: 0, bold: false, italic: false,
    })
    elements.push({
      id: crypto.randomUUID(),
      content: '✦',
      x: 50, y: 80,
      fontSize: 18,
      fontFamily: 'Poiret One',
      color: accentColor,
      rotation: 0, bold: false, italic: false,
    })
  }

  return {
    id: crypto.randomUUID(),
    backgroundColor: imageUrl ? (isDark ? '#0d0d0d' : '#f5f0e8') : gradient,
    imageUrl,
    textElements: elements,
    stickers: [],
    createdAt: new Date().toISOString(),
  }
}

function layoutPositions(count: number): number[] {
  if (count === 1) return [50]
  if (count === 2) return [35, 62]
  if (count === 3) return [28, 50, 70]
  if (count === 4) return [22, 40, 57, 74]
  return Array.from({ length: count }, (_, i) => 20 + (i * 60) / (count - 1))
}

export function generateStoryFrames(
  text: string,
  style: StoryStyle,
  imageUrl?: string
): StoryFrame[] {
  const segments = parseTextIntoSegments(text)
  const slides = distributeSegmentsIntoSlides(segments)

  return slides.map((slideSegments, i) =>
    style === 'poster'
      ? buildPosterSlide(slideSegments, i, i === 0 ? imageUrl : undefined)
      : buildDecoSlide(slideSegments, i, i === 0 ? imageUrl : undefined)
  )
}
