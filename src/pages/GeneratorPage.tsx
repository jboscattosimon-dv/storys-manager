import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ImageIcon, X, Download, Edit3,
  RotateCcw, Plus, Trash2, ChevronDown, ChevronUp, ZoomIn,
} from 'lucide-react'
import { generateStoryFrames, type StoryStyle } from '../hooks/useAutoLayout'
import { useAppStore } from '../store/useAppStore'
import type { StoryFrame, TextElement } from '../types'

/* ─── SLIDE PREVIEW ──────────────────────────────────────────── */
function SlidePreview({
  frame,
  scale = 1,
}: {
  frame: StoryFrame
  scale?: number
}) {
  const overlay = frame.overlayColor ?? (frame.imageUrl ? 'rgba(0,0,0,0.42)' : undefined)

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: frame.imageUrl
          ? `url(${frame.imageUrl}) center/cover`
          : frame.backgroundColor,
      }}>

      {overlay && (
        <div className="absolute inset-0" style={{ backgroundColor: overlay }} />
      )}

      {frame.textElements.map((el) => {
        const align = el.align ?? 'center'
        const isLeft = align === 'left'
        const isRight = align === 'right'

        const translateX = isLeft ? '0%' : isRight ? '-100%' : '-50%'
        const paddingH = Math.round(10 * scale)
        const paddingV = Math.round(6 * scale)

        return (
          <div
            key={el.id}
            className="absolute pointer-events-none"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              transform: `translate(${translateX}, -50%) rotate(${el.rotation}deg)`,
              maxWidth: `${el.maxWidth ?? 85}%`,
              opacity: el.opacity ?? 1,
            }}>

            {/* border-left accent */}
            {el.borderLeft && (
              <div
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: Math.round(3 * scale),
                  backgroundColor: el.borderLeftColor ?? '#ffffff',
                  borderRadius: 2,
                }}
              />
            )}

            {/* background box */}
            <div
              style={{
                paddingLeft: el.borderLeft ? Math.round(10 * scale) : (el.backgroundBox ? paddingH : 0),
                paddingRight: el.backgroundBox ? paddingH : 0,
                paddingTop: el.backgroundBox ? paddingV : 0,
                paddingBottom: el.backgroundBox ? paddingV : 0,
                backgroundColor: el.backgroundBox ?? 'transparent',
                display: 'inline-block',
                borderRadius: Math.round(4 * scale),
              }}>
              <div
                style={{
                  fontFamily: el.fontFamily,
                  fontSize: `${el.fontSize * scale}px`,
                  color: el.color,
                  fontWeight: el.bold ? 'bold' : 400,
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textShadow: el.backgroundBox ? 'none' : '0 2px 10px rgba(0,0,0,0.5)',
                  whiteSpace: 'pre-wrap',
                  textAlign: align,
                  lineHeight: el.lineHeight ?? 1.2,
                  letterSpacing: el.letterSpacing ? `${el.letterSpacing * scale}px` : undefined,
                  textTransform: el.uppercase ? 'uppercase' : undefined,
                }}>
                {el.content}
              </div>
            </div>

            {/* decorative line */}
            {el.decorLine && (
              <div
                style={{
                  height: Math.round(2 * scale),
                  backgroundColor: el.decorLineColor ?? el.color,
                  marginTop: Math.round(5 * scale),
                  width: '100%',
                  borderRadius: 2,
                  opacity: 0.75,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── STORY CARD ─────────────────────────────────────────────── */
function StoryCard({
  frame,
  index,
  onEdit,
  onDelete,
  onDownload,
  onZoom,
}: {
  frame: StoryFrame
  index: number
  onEdit: () => void
  onDelete: () => void
  onDownload: () => void
  onZoom: () => void
}) {
  const [hover, setHover] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.07 }}
      className="flex-shrink-0 flex flex-col gap-2"
      style={{ width: '180px' }}>

      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{ width: '180px', height: '320px' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}>

        <SlidePreview frame={frame} scale={0.42} />

        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}>
              <button
                onClick={onZoom}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                <ZoomIn size={14} /> Ver
              </button>
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Edit3 size={14} /> Editar
              </button>
              <button
                onClick={onDownload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <Download size={14} /> Baixar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          {index + 1}
        </div>

        <button
          onClick={onDelete}
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#ef4444'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}>
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
          <Download size={11} /> PNG
        </button>
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ backgroundColor: 'var(--color-surface-2)', color: '#9ca3af', border: '1px solid var(--color-border)' }}>
          <Edit3 size={11} /> Editar
        </button>
      </div>
    </motion.div>
  )
}

/* ─── ZOOM MODAL ─────────────────────────────────────────────── */
function ZoomModal({
  frame,
  index,
  total,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDownload,
  onTextChange,
}: {
  frame: StoryFrame
  index: number
  total: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onEdit: () => void
  onDownload: () => void
  onTextChange: (updated: StoryFrame) => void
}) {
  const [editMode, setEditMode] = useState(false)

  const updateEl = (id: string, updates: Partial<TextElement>) => {
    onTextChange({
      ...frame,
      textElements: frame.textElements.map((el) => (el.id === id ? { ...el, ...updates } : el)),
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={onClose}>

      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="flex gap-6 items-start max-w-4xl w-full">

        {/* Story preview */}
        <div className="flex-shrink-0">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: '300px', height: '534px' }}>
            <SlidePreview frame={frame} scale={0.7} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <button onClick={onPrev} disabled={index === 0}
              className="px-3 py-1.5 rounded-lg text-xs text-white disabled:opacity-30 transition-all hover:bg-white/10">
              ← Anterior
            </button>
            <span className="text-sm text-white/60">{index + 1} / {total}</span>
            <button onClick={onNext} disabled={index === total - 1}
              className="px-3 py-1.5 rounded-lg text-xs text-white disabled:opacity-30 transition-all hover:bg-white/10">
              Próximo →
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold text-lg">Story {index + 1}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10">
              <X size={18} />
            </button>
          </div>

          {/* Text editor */}
          <div className="space-y-3">
            <button
              onClick={() => setEditMode((p) => !p)}
              className="flex items-center gap-2 text-sm font-medium w-full px-3 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: editMode ? 'rgba(124,58,237,0.2)' : 'var(--color-surface-2)', color: editMode ? '#a855f7' : '#9ca3af', border: `1px solid ${editMode ? '#7c3aed' : 'var(--color-border)'}` }}>
              <Edit3 size={14} />
              {editMode ? 'Fechar edição' : 'Editar textos'}
              {editMode ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>

            <AnimatePresence>
              {editMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2">
                  {frame.textElements.map((el) => (
                    <div key={el.id} className="flex gap-2 items-start p-3 rounded-xl"
                      style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      <div className="flex-1">
                        <textarea
                          value={el.content}
                          onChange={(e) => updateEl(el.id, { content: e.target.value })}
                          rows={2}
                          className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-1 focus:ring-purple-500"
                          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: '#fff', fontFamily: el.fontFamily }}
                        />
                        <div className="flex gap-2 mt-2">
                          <input type="range" min={10} max={100} value={el.fontSize}
                            onChange={(e) => updateEl(el.id, { fontSize: Number(e.target.value) })}
                            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                            style={{ accentColor: '#7c3aed' }} />
                          <span className="text-xs w-8 text-right" style={{ color: '#6b7280' }}>{el.fontSize}px</span>
                        </div>
                      </div>
                      <input type="color"
                        value={el.color.startsWith('rgba') || el.color.startsWith('rgb') ? '#ffffff' : el.color}
                        onChange={(e) => updateEl(el.id, { color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 flex-shrink-0"
                        title="Cor" />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2 mt-auto">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <Edit3 size={15} /> Editor completo
            </button>
            <button onClick={onDownload}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
              style={{ backgroundColor: 'var(--color-surface-2)', color: '#9ca3af', border: '1px solid var(--color-border)' }}>
              <Download size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export function GeneratorPage() {
  const { setCurrentPage, setGeneratedFrames } = useAppStore()

  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [style, setStyle] = useState<StoryStyle>('poster')
  const [frames, setFrames] = useState<StoryFrame[]>([])
  const [zoomIndex, setZoomIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleGenerate = () => {
    if (!text.trim()) return
    const generated = generateStoryFrames(text, style, imageUrl)
    setFrames(generated)
  }

  const handleDownload = (frame: StoryFrame) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080; canvas.height = 1920
    const ctx = canvas.getContext('2d')!
    const stops = frame.backgroundColor.match(/#[0-9a-fA-F]{3,6}/g) ?? ['#000','#333']
    const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
    stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
    ctx.fillStyle = frame.backgroundColor.startsWith('linear') ? grad : frame.backgroundColor
    ctx.fillRect(0, 0, 1080, 1920)
    const draw = () => {
      frame.textElements.forEach((el) => {
        ctx.save()
        ctx.translate((el.x / 100) * 1080, (el.y / 100) * 1920)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.fontSize}px "${el.fontFamily}"`
        ctx.fillStyle = el.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24
        ctx.fillText(el.content, 0, 0); ctx.restore()
      })
      const link = document.createElement('a')
      link.download = `story-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png'); link.click()
    }
    if (frame.imageUrl) {
      const img = new Image()
      img.onload = () => { ctx.drawImage(img, 0, 0, 1080, 1920); ctx.fillStyle = 'rgba(0,0,0,0.38)'; ctx.fillRect(0, 0, 1080, 1920); draw() }
      img.src = frame.imageUrl
    } else draw()
  }

  const handleDownloadAll = () => frames.forEach((f) => setTimeout(() => handleDownload(f), 300))

  const handleEditInEditor = (index: number) => {
    setGeneratedFrames(frames)
    useAppStore.getState().setActiveGeneratedIndex(index)
    setCurrentPage('editor')
  }

  const deleteFrame = (id: string) => setFrames((prev) => prev.filter((f) => f.id !== id))

  const updateFrame = (updated: StoryFrame) =>
    setFrames((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))

  const zoomedFrame = zoomIndex !== null ? frames[zoomIndex] : null

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── LEFT PANEL: INPUT ── */}
      <div
        className="flex flex-col flex-shrink-0 overflow-y-auto border-r"
        style={{ width: '320px', borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>

        <div className="flex items-center gap-2 px-4 h-14 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}>
          <Sparkles size={15} style={{ color: '#a855f7' }} />
          <span className="text-sm font-semibold text-white">Gerar Stories</span>
        </div>

        <div className="flex-1 p-4 flex flex-col gap-5">

          {/* Style picker */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#6b7280' }}>ESTILO</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'poster' as StoryStyle, label: 'Poster', font: 'Paytone One', bg: 'linear-gradient(135deg,#0f0c29,#302b63)', color: '#fff', desc: 'Ousado' },
                { id: 'deco'   as StoryStyle, label: 'Deco',   font: 'Poiret One',  bg: 'linear-gradient(135deg,#f5f0e8,#d4c5b0)', color: '#1a1209', desc: 'Elegante' },
              ] as const).map((s) => (
                <motion.button key={s.id} whileTap={{ scale: 0.96 }} onClick={() => setStyle(s.id)}
                  className="relative rounded-xl p-3 text-left overflow-hidden transition-all"
                  style={{
                    background: s.bg,
                    outline: style === s.id ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                    outlineOffset: '2px',
                  }}>
                  <p className="text-xs mb-0.5" style={{ color: s.color, opacity: 0.6 }}>{s.desc}</p>
                  <p style={{ fontFamily: s.font, fontSize: '26px', color: s.color, lineHeight: 1 }}>{s.label}</p>
                  {style === s.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs" style={{ background: '#7c3aed' }}>✓</div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Copy text */}
          <div className="flex-1 flex flex-col">
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#6b7280' }}>COPY DO STORY</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Cole sua copy aqui.\nCada linha vira um elemento.\n\nEx:\nSale de inverno\n50% OFF\nSó essa semana\nLink na bio →`}
              className="flex-1 rounded-xl px-3 py-3 text-sm resize-none outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              style={{
                minHeight: '200px',
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: '#fff',
                lineHeight: 1.7,
              }}
            />
            <p className="text-xs mt-1.5" style={{ color: '#4b5563' }}>
              Linha curta = título · Linha longa = subtítulo · "link/bio" = CTA
            </p>
          </div>

          {/* Photo */}
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#6b7280' }}>FOTO DE FUNDO (OPCIONAL)</label>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden" style={{ height: '90px' }}>
                <img src={imageUrl} alt="bg" className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl(undefined)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-purple-500"
                style={{ borderColor: 'var(--color-border)' }}>
                <ImageIcon size={15} style={{ color: '#6b7280' }} />
                <span className="text-xs" style={{ color: '#6b7280' }}>Clique para adicionar foto</span>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {/* Generate button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            <Sparkles size={16} />
            {frames.length > 0 ? 'Gerar novamente' : 'Gerar Stories'}
          </motion.button>

        </div>
      </div>

      {/* ── RIGHT PANEL: STORIES ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {frames.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface)' }}>
              <Sparkles size={32} style={{ color: '#4b5563' }} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold mb-1">Nenhum story gerado ainda</p>
              <p className="text-sm" style={{ color: '#4b5563' }}>
                Cole sua copy à esquerda e clique em "Gerar Stories"
              </p>
            </div>

            {/* Visual hint: 3 placeholder cards */}
            <div className="flex gap-4 mt-4 opacity-20 pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl flex-shrink-0"
                  style={{
                    width: '120px', height: '214px',
                    background: i === 0
                      ? 'linear-gradient(160deg,#0f0c29,#302b63)'
                      : i === 1
                      ? 'linear-gradient(160deg,#1a1a2e,#e94560)'
                      : 'linear-gradient(160deg,#0f2027,#2c5364)',
                    borderRadius: '16px',
                  }} />
              ))}
            </div>
          </div>
        ) : (
          /* Stories grid */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold">{frames.length} story{frames.length > 1 ? 's' : ''} gerado{frames.length > 1 ? 's' : ''}</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#a855f7' }}>
                  {style === 'poster' ? 'Poster' : 'Deco'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ color: '#9ca3af', border: '1px solid var(--color-border)' }}>
                  <RotateCcw size={12} /> Regenerar
                </button>
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-80"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
                  <Download size={12} /> Baixar todos
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-auto p-6">
              <div className="flex gap-5 flex-wrap">
                <AnimatePresence>
                  {frames.map((frame, i) => (
                    <StoryCard
                      key={frame.id}
                      frame={frame}
                      index={i}
                      onZoom={() => setZoomIndex(i)}
                      onEdit={() => handleEditInEditor(i)}
                      onDelete={() => deleteFrame(frame.id)}
                      onDownload={() => handleDownload(frame)}
                    />
                  ))}
                </AnimatePresence>

                {/* Add slide */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGenerate}
                  className="flex-shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-purple-500"
                  style={{ width: '180px', height: '320px', borderColor: 'var(--color-border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-surface-2)' }}>
                    <Plus size={20} style={{ color: '#6b7280' }} />
                  </div>
                  <span className="text-xs" style={{ color: '#6b7280' }}>Novo estilo</span>
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── ZOOM MODAL ── */}
      <AnimatePresence>
        {zoomIndex !== null && zoomedFrame && (
          <ZoomModal
            frame={zoomedFrame}
            index={zoomIndex}
            total={frames.length}
            onClose={() => setZoomIndex(null)}
            onPrev={() => setZoomIndex((p) => Math.max(0, (p ?? 0) - 1))}
            onNext={() => setZoomIndex((p) => Math.min(frames.length - 1, (p ?? 0) + 1))}
            onEdit={() => { handleEditInEditor(zoomIndex); setZoomIndex(null) }}
            onDownload={() => handleDownload(zoomedFrame)}
            onTextChange={updateFrame}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
