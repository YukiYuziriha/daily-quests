import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskList, SortMode } from '../db/types'
import { ListRepository, TaskRepository } from '../db/repositories'

interface AppState {
  lists: TaskList[]
  tasks: Task[]
  completedTasks: Task[]
  selectedListId: string | null
  selectedTaskId: string | null
  sortMode: SortMode
  loading: boolean
  showCompletedHistory: boolean
}

interface AppActions {
  loadLists: () => Promise<void>
  loadTasks: (listId: string) => Promise<void>
  loadStarredTasks: () => Promise<void>
  loadCompletedTasks: () => Promise<void>
  createList: (name: string) => Promise<TaskList>
  updateList: (id: string, name: string) => Promise<void>
  deleteList: (id: string) => Promise<void>
  selectList: (id: string | null) => void
  selectTask: (id: string | null) => void
  createTask: (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'order' | 'completed_at' | 'starred_at'>) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  toggleTaskStar: (id: string) => Promise<void>
  indentTask: (id: string) => Promise<boolean>
  outdentTask: (id: string) => Promise<boolean>
  setSortMode: (mode: SortMode) => void
  sortTasks: (tasks: Task[]) => Task[]
  toggleShowCompletedHistory: () => void
  hydrate: () => void
}

const sortTasksFn = (tasks: Task[], sortMode: SortMode): Task[] => {
  const sorted = [...tasks]

  switch (sortMode) {
    case 'my_order':
      return sorted.sort((a, b) => a.order - b.order)
    case 'date':
      return sorted.sort((a, b) => {
        if (!a.due_date && !b.due_date) return a.order - b.order
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return a.due_date.localeCompare(b.due_date)
      })
    case 'starred_recently':
      return sorted.sort((a, b) => {
        if (a.starred && !b.starred) return -1
        if (!a.starred && b.starred) return 1
        if (!a.starred_at || !b.starred_at) return 0
        return b.starred_at - a.starred_at
      })
    default:
      return sorted
  }
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      lists: [],
      tasks: [],
      completedTasks: [],
      selectedListId: null,
      selectedTaskId: null,
      sortMode: 'my_order',
      loading: false,
      showCompletedHistory: false,

      loadLists: async () => {
        set({ loading: true })
        const lists = await ListRepository.getAll()
        set({ lists, loading: false })
      },

      loadTasks: async (listId: string) => {
        set({ loading: true })
        const tasks = await TaskRepository.getByListId(listId)
        set({ tasks: sortTasksFn(tasks, get().sortMode), loading: false })
      },

      loadStarredTasks: async () => {
        set({ loading: true })
        const tasks = await TaskRepository.getStarred()
        set({ tasks, loading: false })
      },

      loadCompletedTasks: async () => {
        set({ loading: true })
        const tasks = await TaskRepository.getAllCompleted()
        set({ completedTasks: tasks, loading: false })
      },

      createList: async (name: string) => {
        const list = await ListRepository.create(name)
        set((state) => ({ lists: [...state.lists, list] }))
        return list
      },

      updateList: async (id: string, name: string) => {
        await ListRepository.update(id, { name })
        set((state) => ({
          lists: state.lists.map((l) => (l.id === id ? { ...l, name } : l))
        }))
      },

      deleteList: async (id: string) => {
        await ListRepository.delete(id)
        set((state) => {
          const lists = state.lists.filter((l) => l.id !== id)
          const selectedListId = state.selectedListId === id ? null : state.selectedListId
          return { lists, selectedListId, tasks: [] }
        })
      },

      selectList: (id: string | null) => {
        set({ selectedListId: id, selectedTaskId: null })
        if (id) {
          get().loadTasks(id)
        } else {
          get().loadStarredTasks()
        }
      },

      selectTask: (id: string | null) => {
        set({ selectedTaskId: id })
      },

      createTask: async (data) => {
        const task = await TaskRepository.create(data)
        set((state) => ({ tasks: sortTasksFn([...state.tasks, task], state.sortMode) }))
        return task
      },

      updateTask: async (id: string, updates: Partial<Task>) => {
        await TaskRepository.update(id, updates)
        set((state) => ({
          tasks: sortTasksFn(state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)), state.sortMode)
        }))
      },

      deleteTask: async (id: string) => {
        await TaskRepository.delete(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId
        }))
      },

      toggleTaskComplete: async (id: string) => {
        await TaskRepository.toggleComplete(id)
        const task = await TaskRepository.getById(id)
        if (!task) return

        set((state) => {
          if (task.status === 'completed') {
            return {
              tasks: state.tasks.filter((t) => t.id !== id),
              selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId
            }
          } else {
            return {
              tasks: sortTasksFn(state.tasks.map((t) => (t.id === id ? task : t)), state.sortMode)
            }
          }
        })
      },

      toggleTaskStar: async (id: string) => {
        await TaskRepository.toggleStar(id)
        const task = await TaskRepository.getById(id)
        if (!task) return

        set((state) => ({
          tasks: sortTasksFn(state.tasks.map((t) => (t.id === id ? task : t)), state.sortMode)
        }))
      },

      indentTask: async (id: string) => {
        const listId = get().selectedListId
        if (!listId) return false
        const success = await TaskRepository.indentTask(id, listId)
        if (success) {
          await get().loadTasks(listId)
        }
        return success
      },

      outdentTask: async (id: string) => {
        const listId = get().selectedListId
        if (!listId) return false
        const success = await TaskRepository.outdentTask(id, listId)
        if (success) {
          await get().loadTasks(listId)
        }
        return success
      },

      setSortMode: (mode: SortMode) => {
        const { tasks } = get()
        set({ sortMode: mode, tasks: sortTasksFn(tasks, mode) })
      },

      sortTasks: (tasks: Task[]) => {
        return sortTasksFn(tasks, get().sortMode)
      },

      toggleShowCompletedHistory: () => {
        const show = !get().showCompletedHistory
        set({ showCompletedHistory: show })
        if (show && get().completedTasks.length === 0) {
          get().loadCompletedTasks()
        }
      },

      hydrate: () => {
        const { selectedListId, selectedTaskId } = get()
        if (selectedListId) {
          get().loadTasks(selectedListId)
        } else {
          get().loadStarredTasks()
        }
        if (selectedTaskId) {
          get().selectTask(selectedTaskId)
        }
      }
    }),
    {
      name: 'daily-quests-storage',
      partialize: (state) => ({
        selectedListId: state.selectedListId,
        selectedTaskId: state.selectedTaskId,
        sortMode: state.sortMode,
        showCompletedHistory: state.showCompletedHistory
      })
    }
  )
)
