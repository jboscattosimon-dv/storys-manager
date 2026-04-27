import { motion } from 'framer-motion'
import { Sparkles, Edit3, Clock, Zap } from 'lucide-react'
import type { AppPage } from '../../types'
import { useAppStore } from '../../store/useAppStore'

const navItems: { icon: React.ElementType; label: string; page: AppPage }[] = [
  { icon: Sparkles, label: 'Criar', page: 'generator' },
  { icon: Edit3,    label: 'Editor', page: 'editor' },
  { icon: Clock,    label: 'Histórico', page: 'history' },
]

export function Sidebar() {
  const { currentPage, setCurrentPage } = useAppStore()

  return (
    <aside
      className="fixed left-0 top-0 h-full w-16 md:w-52 flex flex-col z-30"
      style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>

      <div className="flex items-center gap-2.5 px-3 md:px-4 h-14 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          <Zap size={14} className="text-white" />
        </div>
        <span className="hidden md:block text-white font-bold text-base tracking-tight">Storify</span>
      </div>

      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {navItems.map(({ icon: Icon, label, page }) => {
          const active = currentPage === page
          return (
            <motion.button
              key={page}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentPage(page)}
              className="flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-lg w-full transition-colors text-left"
              style={{
                backgroundColor: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: active ? '#a855f7' : '#9ca3af',
              }}>
              <Icon size={17} className="flex-shrink-0" />
              <span className="hidden md:block text-sm font-medium">{label}</span>
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#a855f7' }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      <div className="p-3 border-t hidden md:block flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=MyUser"
            alt="perfil"
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: 'var(--color-surface-2)' }}
          />
          <p className="text-xs font-medium text-white truncate">Meu Perfil</p>
        </div>
      </div>
    </aside>
  )
}
