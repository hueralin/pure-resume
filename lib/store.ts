import { create } from 'zustand'
import { ResumeData } from '@/types/resume'

interface User {
  id: string
  email: string
  name: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

interface ResumeState {
  currentResume: ResumeData | null
  currentResumeId: string | null
  currentResumeTitle: string | null
  setCurrentResume: (resume: ResumeData, id?: string, title?: string) => void
  updateModuleData: (instanceId: string, data: Record<string, any>) => void
  addModule: (moduleId: string, instanceId: string, data: Record<string, any>) => void
  removeModule: (instanceId: string) => void
  reorderModules: (instanceIds: string[]) => void
  clearResume: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('user') || 'null')) : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ user, token })
  },
  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    set({ user: null, token: null })
  },
}))

export const useResumeStore = create<ResumeState>((set) => ({
  currentResume: null,
  currentResumeId: null,
  currentResumeTitle: null,
  setCurrentResume: (resume, id, title) => set({ 
    currentResume: resume,
    currentResumeId: id || null,
    currentResumeTitle: title || null,
  }),
  updateModuleData: (instanceId, data) =>
    set((state) => {
      if (!state.currentResume) return state
      const modules = state.currentResume.modules.map((m) =>
        m.instanceId === instanceId ? { ...m, data } : m
      )
      return { currentResume: { ...state.currentResume, modules } }
    }),
  addModule: (moduleId, instanceId, data) =>
    set((state) => {
      if (!state.currentResume) {
        return {
          currentResume: {
            modules: [{ moduleId, instanceId, data }],
          },
        }
      }
      return {
        currentResume: {
          ...state.currentResume,
          modules: [...state.currentResume.modules, { moduleId, instanceId, data }],
        },
      }
    }),
  removeModule: (instanceId) =>
    set((state) => {
      if (!state.currentResume) return state
      return {
        currentResume: {
          ...state.currentResume,
          modules: state.currentResume.modules.filter((m) => m.instanceId !== instanceId),
        },
      }
    }),
  reorderModules: (instanceIds) =>
    set((state) => {
      if (!state.currentResume) return state
      const moduleMap = new Map(state.currentResume.modules.map((m) => [m.instanceId, m]))
      const modules = instanceIds.map((id) => moduleMap.get(id)!).filter(Boolean)
      return { currentResume: { ...state.currentResume, modules } }
    }),
  clearResume: () => set({ currentResume: null, currentResumeId: null, currentResumeTitle: null }),
}))

