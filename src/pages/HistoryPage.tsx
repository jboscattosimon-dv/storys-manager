import { motion } from 'framer-motion'
import { Clock, Eye, Edit3 } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { useAppStore } from '../store/useAppStore'

export function HistoryPage() {
  const { stories, openViewer, setCurrentPage } = useAppStore()

  const myStories = stories.filter((s) => s.userId === 'me')
  const allStories = stories

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Histórico" subtitle="Stories criados por você" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {myStories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-surface-2)' }}>
              <Clock size={24} style={{ color: '#6b7280' }} />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold">Nenhum story criado ainda</p>
              <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Crie seu primeiro story no editor</p>
            </div>
            <button
              onClick={() => setCurrentPage('generator')}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              Criar story
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {myStories.map((story, i) => {
              const frame = story.frames[0]
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div
                    className="w-12 h-20 rounded-lg flex-shrink-0 overflow-hidden"
                    style={{ background: frame.imageUrl ? `url(${frame.imageUrl}) center/cover` : frame.backgroundColor }}>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {frame.textElements[0]?.content ?? 'Story sem texto'}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: '#6b7280' }}>
                        {new Date(story.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <div className="flex items-center gap-1">
                        <Eye size={10} style={{ color: '#6b7280' }} />
                        <span className="text-xs" style={{ color: '#6b7280' }}>{story.views}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openViewer(allStories.indexOf(story))}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                      style={{ color: '#9ca3af' }}>
                      <Eye size={14} />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                      style={{ color: '#9ca3af' }}>
                      <Edit3 size={14} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        <section>
          <h2 className="text-sm font-semibold text-white mb-3">Todos os stories da plataforma</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {allStories.map((story, i) => {
              const frame = story.frames[0]
              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => openViewer(i)}
                  className="cursor-pointer rounded-xl overflow-hidden relative group"
                  style={{ aspectRatio: '9/16', background: frame.imageUrl ? `url(${frame.imageUrl}) center/cover` : frame.backgroundColor }}>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye size={16} className="text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-1.5">
                    <p className="text-white text-xs truncate">{story.user.name.split(' ')[0]}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
