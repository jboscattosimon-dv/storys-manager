import { AnimatePresence, motion } from 'framer-motion'
import { AppLayout } from './components/layout/AppLayout'
import { StoryViewer } from './components/story/StoryViewer'
import { GeneratorPage } from './pages/GeneratorPage'
import { EditorPage } from './pages/EditorPage'
import { HistoryPage } from './pages/HistoryPage'
import { useAppStore } from './store/useAppStore'

const pageVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -10 },
}

function PageContent() {
  const { currentPage } = useAppStore()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.15, ease: 'easeInOut' }}
        className="flex-1 flex flex-col overflow-hidden">
        {currentPage === 'generator' && <GeneratorPage />}
        {currentPage === 'editor'    && <EditorPage />}
        {currentPage === 'history'   && <HistoryPage />}
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AppLayout>
      <PageContent />
      <StoryViewer />
    </AppLayout>
  )
}
