export interface User {
  id: string
  name: string
  username: string
  avatar: string
  hasNewStory: boolean
}

export interface StoryFrame {
  id: string
  imageUrl?: string
  backgroundColor: string
  textElements: TextElement[]
  stickers: Sticker[]
  createdAt: string
}

export interface TextElement {
  id: string
  content: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  rotation: number
  bold: boolean
  italic: boolean
}

export interface Sticker {
  id: string
  emoji: string
  x: number
  y: number
  size: number
}

export interface Story {
  id: string
  userId: string
  user: User
  frames: StoryFrame[]
  duration: number
  createdAt: string
  views: number
}

export interface Template {
  id: string
  name: string
  category: 'promotion' | 'product' | 'quote' | 'announcement'
  thumbnail: string
  backgroundColor: string
  textElements: Omit<TextElement, 'id'>[]
}

export type EditorTool = 'select' | 'text' | 'image' | 'sticker' | 'background'

export interface EditorState {
  activeTool: EditorTool
  selectedElementId: string | null
  frame: StoryFrame
  history: StoryFrame[]
  historyIndex: number
}

export type AppPage = 'generator' | 'editor' | 'history'
