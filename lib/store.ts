import { create } from 'zustand'
import { ResumeData, ResumeModuleData } from '@/types/resume'
import { loadModuleConfigs } from '@/lib/modules'

// 需要 items 数组的模块类型（allowMultiple: true 的模块）
const LIST_MODULE_IDS = ['education', 'work-experience', 'project-experience', 'skills', 'certifications']

/**
 * 规范化模块数据结构
 * 确保列表类型模块始终有 items 数组，避免 undefined 访问错误
 */
function normalizeModuleData(module: ResumeModuleData): ResumeModuleData {
  // 如果是列表类型模块，确保 data.items 存在
  if (LIST_MODULE_IDS.includes(module.moduleId)) {
    const data = module.data || {}
    return {
      ...module,
      data: {
        ...data,
        items: Array.isArray(data.items) ? data.items : []
      }
    }
  }
  // 非列表模块，确保 data 至少是空对象
  return {
    ...module,
    data: module.data || {}
  }
}

/**
 * 规范化整个简历数据
 */
function normalizeResumeData(resume: ResumeData): ResumeData {
  if (!resume || !resume.modules) {
    return { modules: [], globalSettings: resume?.globalSettings }
  }
  return {
    ...resume,
    modules: resume.modules.map(normalizeModuleData)
  }
}

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
    currentResume: normalizeResumeData(resume),
    currentResumeId: id || null,
    currentResumeTitle: title || null,
  }),
  updateModuleData: (instanceId, data) =>
    set((state) => {
      if (!state.currentResume) return state
      const modules = state.currentResume.modules.map((m) =>
        m.instanceId === instanceId ? normalizeModuleData({ ...m, data }) : m
      )
      return { currentResume: { ...state.currentResume, modules } }
    }),
  addModule: (moduleId, instanceId, data) =>
    set((state) => {
      const newModule = normalizeModuleData({ moduleId, instanceId, data })
      if (!state.currentResume) {
        return {
          currentResume: {
            modules: [newModule],
          },
        }
      }
      return {
        currentResume: {
          ...state.currentResume,
          modules: [...state.currentResume.modules, newModule],
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

