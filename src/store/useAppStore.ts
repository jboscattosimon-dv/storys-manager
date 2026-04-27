import { create } from 'zustand'
import type { Story, StoryFrame, TextElement, AppPage, EditorTool } from '../types'
import { mockStories } from '../services/mockData'

const defaultFrame = (): StoryFrame => ({
  id: crypto.randomUUID(),
  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  textElements: [],
  stickers: [],
  createdAt: new Date().toISOString(),
})

interface AppStore {
  currentPage: AppPage
  setCurrentPage: (page: AppPage) => void

  stories: Story[]
  addStory: (story: Story) => void

  viewerOpen: boolean
  viewerStoryIndex: number
  openViewer: (index: number) => void
  closeViewer: () => void

  editorFrame: StoryFrame
  activeTool: EditorTool
  selectedElementId: string | null
  editorHistory: StoryFrame[]
  editorHistoryIndex: number

  setActiveTool: (tool: EditorTool) => void
  setSelectedElementId: (id: string | null) => void
  updateFrame: (frame: StoryFrame) => void
  addTextElement: (element: TextElement) => void
  updateTextElement: (id: string, updates: Partial<TextElement>) => void
  removeTextElement: (id: string) => void
  setBackground: (bg: string) => void
  loadTemplate: (frame: Partial<StoryFrame>) => void
  resetEditor: () => void
  undoEditor: () => void
  redoEditor: () => void

  generatedFrames: StoryFrame[]
  activeGeneratedIndex: number
  setGeneratedFrames: (frames: StoryFrame[]) => void
  setActiveGeneratedIndex: (i: number) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentPage: 'generator',
  setCurrentPage: (page) => set({ currentPage: page }),

  stories: mockStories,
  addStory: (story) => set((s) => ({ stories: [story, ...s.stories] })),

  viewerOpen: false,
  viewerStoryIndex: 0,
  openViewer: (index) => set({ viewerOpen: true, viewerStoryIndex: index }),
  closeViewer: () => set({ viewerOpen: false }),

  editorFrame: defaultFrame(),
  activeTool: 'select',
  selectedElementId: null,
  editorHistory: [],
  editorHistoryIndex: -1,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setSelectedElementId: (id) => set({ selectedElementId: id }),

  updateFrame: (frame) => {
    const { editorHistory, editorHistoryIndex } = get()
    const newHistory = editorHistory.slice(0, editorHistoryIndex + 1)
    set({
      editorFrame: frame,
      editorHistory: [...newHistory, frame],
      editorHistoryIndex: newHistory.length,
    })
  },

  addTextElement: (element) => {
    const { editorFrame, updateFrame } = get()
    updateFrame({
      ...editorFrame,
      textElements: [...editorFrame.textElements, element],
    })
    set({ selectedElementId: element.id, activeTool: 'select' })
  },

  updateTextElement: (id, updates) => {
    const { editorFrame } = get()
    const updated = {
      ...editorFrame,
      textElements: editorFrame.textElements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }
    set({ editorFrame: updated })
  },

  removeTextElement: (id) => {
    const { editorFrame, updateFrame } = get()
    updateFrame({
      ...editorFrame,
      textElements: editorFrame.textElements.filter((el) => el.id !== id),
    })
    set({ selectedElementId: null })
  },

  setBackground: (bg) => {
    const { editorFrame, updateFrame } = get()
    updateFrame({ ...editorFrame, backgroundColor: bg })
  },

  loadTemplate: (partial) => {
    const frame: StoryFrame = {
      ...defaultFrame(),
      ...partial,
      textElements: (partial.textElements ?? []).map((el) => ({
        ...el,
        id: crypto.randomUUID(),
      })),
    }
    set({
      editorFrame: frame,
      editorHistory: [frame],
      editorHistoryIndex: 0,
      selectedElementId: null,
    })
  },

  resetEditor: () => {
    const fresh = defaultFrame()
    set({
      editorFrame: fresh,
      editorHistory: [fresh],
      editorHistoryIndex: 0,
      selectedElementId: null,
      activeTool: 'select',
    })
  },

  undoEditor: () => {
    const { editorHistory, editorHistoryIndex } = get()
    if (editorHistoryIndex <= 0) return
    const idx = editorHistoryIndex - 1
    set({ editorFrame: editorHistory[idx], editorHistoryIndex: idx })
  },

  redoEditor: () => {
    const { editorHistory, editorHistoryIndex } = get()
    if (editorHistoryIndex >= editorHistory.length - 1) return
    const idx = editorHistoryIndex + 1
    set({ editorFrame: editorHistory[idx], editorHistoryIndex: idx })
  },

  generatedFrames: [],
  activeGeneratedIndex: 0,
  setGeneratedFrames: (frames) => {
    const first = frames[0]
    set({
      generatedFrames: frames,
      activeGeneratedIndex: 0,
      editorFrame: first ?? defaultFrame(),
      editorHistory: first ? [first] : [],
      editorHistoryIndex: first ? 0 : -1,
    })
  },
  setActiveGeneratedIndex: (i) => {
    const { generatedFrames } = get()
    const frame = generatedFrames[i]
    if (!frame) return
    set({
      activeGeneratedIndex: i,
      editorFrame: frame,
      editorHistory: [frame],
      editorHistoryIndex: 0,
      selectedElementId: null,
    })
  },
}))
