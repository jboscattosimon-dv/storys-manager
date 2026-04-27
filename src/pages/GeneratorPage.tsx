import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ImageIcon, X, Type, ChevronRight, ChevronLeft, Download, Edit3, RotateCcw } from 'lucide-react'
import { generateStoryFrames, type StoryStyle } from '../hooks/useAutoLayout'
import { useAppStore } from '../store/useAppStore'
import type { StoryFrame, TextElement } from '../types'

function SlidePreview({ frame, small = false }: { frame: StoryFrame; small?: boolean }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl flex-shrink-0"
      style={{
        width: small ? '90px' : '100%',
        aspectRatio: '9/16',
        background: frame.imageUrl
          ? `url(${frame.imageUrl}) center/cover`
          : frame.backgroundColor,
      }}>
      {frame.imageUrl && (
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} />
      )}
      {frame.textElements.map((el) => (
        <div
          key={el.id}
          className="absolute pointer-events-none"
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
            fontFamily: el.fontFamily,
            fontSize: small ? `${el.fontSize * 0.18}px` : `${el.fontSize * 0.75}px`,
            color: el.color,
            fontWeight: el.bold ? 'bold' : 400,
            fontStyle: el.italic ? 'italic' : 'normal',
            textShadow: '0 1px 6px rgba(0,0,0,0.4)',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
            maxWidth: '80%',
            lineHeight: 1.2,
          }}>
          {el.content}
        </div>
      ))}
    </div>
  )
}

function InlineTextEditor({
  frame,
  onUpdate,
}: {
  frame: StoryFrame
  onUpdate: (frame: StoryFrame) => void
}) {
  const updateEl = (id: string, updates: Partial<TextElement>) => {
    onUpdate({
      ...frame,
      textElements: frame.textElements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    })
  }

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs font-semibold" style={{ color: '#9ca3af' }}>Editar textos</p>
      {frame.textElements.map((el) => (
        <div key={el.id} className="flex gap-2 items-start">
          <textarea
            value={el.content}
            onChange={(e) => updateEl(el.id, { content: e.target.value })}
            rows={2}
            className="flex-1 rounded-lg px-3 py-2 text-sm resize-none outline-none focus:ring-1"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: '#fff',
              fontFamily: el.fontFamily,
              fontSize: '13px',
            }}
          />
          <div className="flex flex-col gap-1">
            <input
              type="color"
              value={el.color.startsWith('rgba') ? '#ffffff' : el.color}
              onChange={(e) => updateEl(el.id, { color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0"
              title="Cor"
            />
            <button
              onClick={() => updateEl(el.id, { fontSize: Math.min(el.fontSize + 4, 100) })}
              className="w-7 h-7 rounded text-xs font-bold"
              style={{ backgroundColor: 'var(--color-surface-2)', color: '#9ca3af' }}>
              A+
            </button>
            <button
              onClick={() => updateEl(el.id, { fontSize: Math.max(el.fontSize - 4, 10) })}
              className="w-7 h-7 rounded text-xs"
              style={{ backgroundColor: 'var(--color-surface-2)', color: '#9ca3af' }}>
              A-
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function GeneratorPage() {
  const { setCurrentPage, setGeneratedFrames } = useAppStore()

  const [text, setText] = useState('')
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [style, setStyle] = useState<StoryStyle>('poster')
  const [frames, setFrames] = useState<StoryFrame[]>([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [step, setStep] = useState<'input' | 'result'>('input')
  const [editMode, setEditMode] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleGenerate = () => {
    if (!text.trim()) return
    const generated = generateStoryFrames(text, style, imageUrl)
    setFrames(generated)
    setActiveSlide(0)
    setStep('result')
    setEditMode(false)
  }

  const handleReset = () => {
    setStep('input')
    setFrames([])
    setActiveSlide(0)
  }

  const handleExportSlide = (frame: StoryFrame) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')!

    const isGradient = frame.backgroundColor.startsWith('linear-gradient')
    if (isGradient) {
      const stops = frame.backgroundColor.match(/#[0-9a-fA-F]{3,6}/g) ?? ['#000', '#333']
      const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
      stops.forEach((c, i) => grad.addColorStop(i / Math.max(stops.length - 1, 1), c))
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = frame.backgroundColor
    }
    ctx.fillRect(0, 0, 1080, 1920)

    const drawText = () => {
      frame.textElements.forEach((el) => {
        ctx.save()
        ctx.translate((el.x / 100) * 1080, (el.y / 100) * 1920)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.fontSize}px "${el.fontFamily}"`
        ctx.fillStyle = el.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 20
        ctx.fillText(el.content, 0, 0)
        ctx.restore()
      })
      const link = document.createElement('a')
      link.download = `story-slide-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }

    if (frame.imageUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 1080, 1920)
        ctx.fillStyle = 'rgba(0,0,0,0.35)'
        ctx.fillRect(0, 0, 1080, 1920)
        drawText()
      }
      img.src = frame.imageUrl
    } else {
      drawText()
    }
  }

  const updateFrame = (updated: StoryFrame) => {
    setFrames((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
  }

  const handleEditInEditor = () => {
    setGeneratedFrames(frames)
    setCurrentPage('editor')
  }

  if (step === 'result' && frames.length > 0) {
    const current = frames[activeSlide]
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 h-14 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)' }}>
          <button onClick={handleReset} className="flex items-center gap-2 text-sm"
            style={{ color: '#9ca3af' }}>
            <RotateCcw size={15} />
            Novo design
          </button>
          <span className="text-sm font-semibold text-white">
            {frames.length} slide{frames.length > 1 ? 's' : ''} gerado{frames.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleEditInEditor}
            className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
            <Edit3 size={14} />
            Editor completo
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-xs">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}>
                    <SlidePreview frame={current} />
                  </motion.div>
                </AnimatePresence>

                {frames.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveSlide((p) => Math.max(0, p - 1))}
                      disabled={activeSlide === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setActiveSlide((p) => Math.min(frames.length - 1, p + 1))}
                      disabled={activeSlide === frames.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all"
                      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: '#6b7280' }}>
                  Slide {activeSlide + 1} de {frames.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditMode((p) => !p)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      backgroundColor: editMode ? 'rgba(124,58,237,0.2)' : 'var(--color-surface)',
                      color: editMode ? '#a855f7' : '#9ca3af',
                      border: `1px solid ${editMode ? '#7c3aed' : 'var(--color-border)'}`,
                    }}>
                    <Edit3 size={12} />
                    Editar texto
                  </button>
                  <button
                    onClick={() => handleExportSlide(current)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff' }}>
                    <Download size={12} />
                    Baixar
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}>
                    <InlineTextEditor frame={current} onUpdate={updateFrame} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {frames.length > 1 && (
            <div className="w-28 flex-shrink-0 border-l overflow-y-auto p-2 flex flex-col gap-2"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <p className="text-xs text-center mt-1" style={{ color: '#6b7280' }}>Slides</p>
              {frames.map((f, i) => (
                <motion.button
                  key={f.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveSlide(i)}
                  className="relative rounded-lg overflow-hidden"
                  style={{
                    outline: activeSlide === i ? '2px solid #7c3aed' : '2px solid transparent',
                    outlineOffset: '2px',
                  }}>
                  <SlidePreview frame={f} small />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white text-xs font-bold"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                    {i + 1}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 md:px-6 h-14 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}>
        <Sparkles size={16} style={{ color: '#a855f7' }} />
        <h1 className="text-base font-semibold text-white">Criar Story</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5 max-w-xl mx-auto w-full">
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#9ca3af' }}>
            ESTILO DA FONTE
          </label>
          <div className="grid grid-cols-2 gap-3">
            {([
              {
                id: 'poster' as StoryStyle,
                label: 'Poster',
                font: 'Paytone One',
                desc: 'Impacto e ousadia',
                bg: 'linear-gradient(135deg,#0f0c29,#302b63)',
                color: '#fff',
              },
              {
                id: 'deco' as StoryStyle,
                label: 'Deco',
                font: 'Poiret One',
                desc: 'Elegância e sofisticação',
                bg: 'linear-gradient(135deg,#f5f0e8,#d4c5b0)',
                color: '#1a1209',
              },
            ] as const).map((s) => (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStyle(s.id)}
                className="relative rounded-xl p-4 text-left overflow-hidden transition-all"
                style={{
                  background: s.bg,
                  outline: style === s.id ? '2.5px solid #7c3aed' : '2.5px solid transparent',
                  outlineOffset: '2px',
                }}>
                <p className="text-xs mb-1" style={{ color: s.color, opacity: 0.65 }}>{s.desc}</p>
                <p style={{ fontFamily: s.font, fontSize: '32px', color: s.color, lineHeight: 1.1 }}>
                  {s.label}
                </p>
                {style === s.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: '#7c3aed' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#9ca3af' }}>
            <Type size={11} className="inline mr-1" />
            COLE SUA COPY AQUI
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Ex:\nSale de inverno\n50% de desconto\nSó essa semana\nAcesse o link na bio →`}
            rows={8}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: '#fff',
              lineHeight: 1.7,
            }}
          />
          <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
            Cada linha vira um elemento de texto. Linhas curtas = título. Linhas longas = subtítulo.
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: '#9ca3af' }}>
            <ImageIcon size={11} className="inline mr-1" />
            FOTO (OPCIONAL)
          </label>
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden" style={{ height: '120px' }}>
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              <button
                onClick={() => setImageUrl(undefined)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <label
              className="flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:border-purple-500"
              style={{ borderColor: 'var(--color-border)' }}>
              <ImageIcon size={18} style={{ color: '#6b7280' }} />
              <span className="text-sm" style={{ color: '#6b7280' }}>Clique para adicionar uma foto de fundo</span>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          disabled={!text.trim()}
          className="w-full py-4 rounded-xl text-base font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          <Sparkles size={18} />
          Gerar Design
        </motion.button>
      </div>
    </div>
  )
}
