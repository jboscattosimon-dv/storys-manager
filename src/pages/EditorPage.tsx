import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Eye, RotateCcw, Save, X } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { EditorCanvas } from '../components/editor/EditorCanvas'
import { EditorToolbar } from '../components/editor/EditorToolbar'
import { useAppStore } from '../store/useAppStore'
import type { Story, StoryFrame } from '../types'

function renderFrameToCanvas(frame: StoryFrame, width = 1080, height = 1920): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    const isGradient = frame.backgroundColor.startsWith('linear-gradient')
    if (isGradient) {
      const stops = frame.backgroundColor.match(/#[0-9a-fA-F]{3,6}/g) ?? ['#667eea', '#764ba2']
      const grad = ctx.createLinearGradient(0, 0, width, height)
      stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c))
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = frame.backgroundColor
    }
    ctx.fillRect(0, 0, width, height)

    const drawText = () => {
      frame.textElements.forEach((el) => {
        ctx.save()
        const x = (el.x / 100) * width
        const y = (el.y / 100) * height
        ctx.translate(x, y)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.font = `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.fontSize}px "${el.fontFamily}", sans-serif`
        ctx.fillStyle = el.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.4)'
        ctx.shadowBlur = 16
        ctx.fillText(el.content, 0, 0)
        ctx.restore()
      })
      frame.stickers.forEach((s) => {
        ctx.save()
        const x = (s.x / 100) * width
        const y = (s.y / 100) * height
        ctx.font = `${s.size}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(s.emoji, x, y)
        ctx.restore()
      })
      resolve(canvas.toDataURL('image/png'))
    }

    if (frame.imageUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        drawText()
      }
      img.onerror = drawText
      img.src = frame.imageUrl
    } else {
      drawText()
    }
  })
}

function ExportPreviewModal({ onClose }: { onClose: () => void }) {
  const { editorFrame } = useAppStore()

  const handleDownload = async () => {
    const dataUrl = await renderFrameToCanvas(editorFrame)
    const link = document.createElement('a')
    link.download = `story-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-white font-semibold">Preview de exportação</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div
            className="rounded-xl overflow-hidden mx-auto relative"
            style={{
              width: '240px',
              height: '426px',
              background: editorFrame.imageUrl
                ? `url(${editorFrame.imageUrl}) center/cover`
                : editorFrame.backgroundColor,
            }}>
            {editorFrame.textElements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                  fontFamily: el.fontFamily,
                  fontSize: `${el.fontSize * 0.67}px`,
                  color: el.color,
                  fontWeight: el.bold ? 'bold' : 'normal',
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textShadow: '0 2px 8px rgba(0,0,0,0.35)',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'center',
                }}>
                {el.content}
              </div>
            ))}
            {editorFrame.stickers.map((s) => (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  transform: 'translate(-50%,-50%)',
                  fontSize: `${s.size * 0.67}px`,
                }}>
                {s.emoji}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: '#9ca3af', backgroundColor: 'var(--color-surface-2)' }}>
            Cancelar
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            <Download size={15} />
            Baixar PNG
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function EditorPage() {
  const { editorFrame, resetEditor, addStory, setCurrentPage } = useAppStore()
  const [showPreview, setShowPreview] = useState(false)

  const handleSave = () => {
    const story: Story = {
      id: crypto.randomUUID(),
      userId: 'me',
      user: {
        id: 'me',
        name: 'Meu Perfil',
        username: 'meuperfil',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MyUser',
        hasNewStory: true,
      },
      frames: [editorFrame],
      duration: 5000,
      createdAt: new Date().toISOString(),
      views: 0,
    }
    addStory(story)
    resetEditor()
    setCurrentPage('generator')
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Editor de Story" subtitle="Crie e personalize seu story" />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="w-full" style={{ maxWidth: '360px' }}>
              <EditorCanvas />

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowPreview(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: '#9ca3af', backgroundColor: 'var(--color-surface)' }}>
                  <Eye size={15} />
                  Preview
                </button>
                <button
                  onClick={resetEditor}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
                  style={{ color: '#9ca3af', backgroundColor: 'var(--color-surface)' }}>
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                  <Save size={15} />
                  Salvar
                </button>
              </div>
            </div>
          </div>

          <div
            className="w-72 xl:w-80 flex-shrink-0 overflow-y-auto p-3 border-l"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <EditorToolbar />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && <ExportPreviewModal onClose={() => setShowPreview(false)} />}
      </AnimatePresence>
    </>
  )
}
