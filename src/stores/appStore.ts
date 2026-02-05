import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, TaskList, SortMode } from '../db/types'
import { ListRepository, TaskRepository } from '../db/repositories'

interface AppState {
  lists: TaskList[]
  allLists: TaskList[]
  tasks: Task[]
  completedTasks: Task[]
  selectedListId: string | null
  selectedTaskId: string | null
  selectedCompletedTask: Task | null
  sortMode: SortMode
  loading: boolean
  showCompletedHistory: boolean
  expandedListId: string | null
  pinnedListIds: string[]
  pinnedTasks: Record<string, Task[]>
  viewMode: 'list' | 'pinned'
}

interface AppActions {
  loadLists: () => Promise<void>
  loadTasks: (listId: string) => Promise<void>
  loadStarredTasks: () => Promise<void>
  loadCompletedTasks: () => Promise<void>
  loadAllLists: () => Promise<void>
  createList: (name: string) => Promise<TaskList>
  updateList: (id: string, name: string) => Promise<void>
  deleteList: (id: string) => Promise<void>
  selectList: (id: string | null) => void
  selectTask: (id: string | null) => void
  selectCompletedTask: (id: string | null) => Promise<void>
  createTask: (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'order' | 'completed_at' | 'starred_at' | 'list_name'>) => Promise<Task>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTaskComplete: (id: string) => Promise<void>
  toggleTaskStar: (id: string) => Promise<void>
  indentTask: (id: string) => Promise<boolean>
  outdentTask: (id: string) => Promise<boolean>
  setSortMode: (mode: SortMode) => void
  sortTasks: (tasks: Task[]) => Task[]
  toggleShowCompletedHistory: () => void
  setExpandedListId: (id: string | null) => void
  reorderLists: (ids: string[]) => Promise<void>
  togglePinnedList: (id: string) => Promise<void>
  loadPinnedTasks: (listId: string) => Promise<void>
  refreshPinnedList: (listId: string) => Promise<void>
  reorderPinnedLists: (ids: string[]) => void
  setViewMode: (mode: 'list' | 'pinned') => void
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
      allLists: [],
      tasks: [],
      completedTasks: [],
      selectedListId: null,
      selectedTaskId: null,
      selectedCompletedTask: null,
      sortMode: 'my_order',
      loading: false,
      showCompletedHistory: false,
      expandedListId: null,
      pinnedListIds: [],
      pinnedTasks: {},
      viewMode: 'list',

      loadLists: async () => {
        set({ loading: true })
        const lists = await ListRepository.getAll()
        lists.sort((a, b) => a.order - b.order)
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
        const allLists = await ListRepository.getAllIncludingDeleted()
        set({ completedTasks: tasks, allLists, loading: false })
      },

      loadAllLists: async () => {
        const allLists = await ListRepository.getAllIncludingDeleted()
        allLists.sort((a, b) => a.order - b.order)
        set({ allLists })
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

      reorderLists: async (ids: string[]) => {
        await Promise.all(ids.map((id, index) => ListRepository.update(id, { order: index * 1000 })))
        set((state) => {
          const listMap = new Map(state.lists.map((list) => [list.id, list]))
          const ordered = ids
            .map((id, index) => {
              const list = listMap.get(id)
              if (!list) return null
              return { ...list, order: index * 1000 }
            })
            .filter((list): list is TaskList => list !== null)

          ordered.sort((a, b) => a.order - b.order)
          return { lists: ordered }
        })
      },

      deleteList: async (id: string) => {
        await ListRepository.delete(id)
        set((state) => {
          const lists = state.lists.filter((l) => l.id !== id)
          const selectedListId = state.selectedListId === id ? null : state.selectedListId
          const pinnedListIds = state.pinnedListIds.filter((listId) => listId !== id)
          const pinnedTasks = { ...state.pinnedTasks }
          delete pinnedTasks[id]
          return { lists, selectedListId, tasks: [], pinnedListIds, pinnedTasks }
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
        set({ selectedTaskId: id, selectedCompletedTask: null })
      },

      selectCompletedTask: async (id: string | null) => {
        if (!id) {
          set({ selectedCompletedTask: null })
          return
        }
        const task = await TaskRepository.getById(id)
        set({ selectedCompletedTask: task || null })
      },

      createTask: async (data) => {
        const task = await TaskRepository.create(data)
        set((state) => ({ tasks: sortTasksFn([...state.tasks, task], state.sortMode) }))
        await get().refreshPinnedList(task.list_id)
        return task
      },

      updateTask: async (id: string, updates: Partial<Task>) => {
        await TaskRepository.update(id, updates)
        set((state) => ({
          tasks: sortTasksFn(state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)), state.sortMode)
        }))
        const task = await TaskRepository.getById(id)
        if (task) {
          await get().refreshPinnedList(task.list_id)
        }
      },

      deleteTask: async (id: string) => {
        await TaskRepository.delete(id)
        const task = await TaskRepository.getById(id)
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId
        }))
        if (task) {
          await get().refreshPinnedList(task.list_id)
        }
      },

      toggleTaskComplete: async (id: string) => {
        await TaskRepository.toggleComplete(id)
        const task = await TaskRepository.getById(id)
        if (!task) return

        set((state) => {
          if (task.status === 'completed') {
            const updatedCompletedTasks = sortTasksFn([task, ...state.completedTasks], 'starred_recently')
            return {
              tasks: state.tasks.filter((t) => t.id !== id),
              selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
              completedTasks: state.showCompletedHistory ? updatedCompletedTasks : state.completedTasks
            }
          } else {
            return {
              tasks: sortTasksFn(state.tasks.map((t) => (t.id === id ? task : t)), state.sortMode),
              completedTasks: state.completedTasks.filter((t) => t.id !== id)
            }
          }
        })
        await get().refreshPinnedList(task.list_id)
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
          await get().refreshPinnedList(listId)
        }
        return success
      },

      outdentTask: async (id: string) => {
        const listId = get().selectedListId
        if (!listId) return false
        const success = await TaskRepository.outdentTask(id, listId)
        if (success) {
          await get().loadTasks(listId)
          await get().refreshPinnedList(listId)
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

      toggleShowCompletedHistory: async () => {
        const show = !get().showCompletedHistory
        set({ showCompletedHistory: show })
        if (show) {
          await get().loadCompletedTasks()
        }
      },

      setExpandedListId: (id: string | null) => {
        set({ expandedListId: id })
      },

      loadPinnedTasks: async (listId: string) => {
        const tasks = await TaskRepository.getByListId(listId)
        set((state) => ({
          pinnedTasks: {
            ...state.pinnedTasks,
            [listId]: tasks
          }
        }))
      },

      refreshPinnedList: async (listId: string) => {
        const { pinnedListIds } = get()
        if (!pinnedListIds.includes(listId)) return
        await get().loadPinnedTasks(listId)
      },

      togglePinnedList: async (id: string) => {
        const { pinnedListIds } = get()
        if (pinnedListIds.includes(id)) {
          set((state) => {
            const updatedIds = state.pinnedListIds.filter((listId) => listId !== id)
            const pinnedTasks = { ...state.pinnedTasks }
            delete pinnedTasks[id]
            return { pinnedListIds: updatedIds, pinnedTasks }
          })
          return
        }

        set((state) => ({ pinnedListIds: [...state.pinnedListIds, id] }))
        await get().loadPinnedTasks(id)
      },

      reorderPinnedLists: (ids: string[]) => {
        set({ pinnedListIds: ids })
      },

      setViewMode: (mode: 'list' | 'pinned') => {
        set({ viewMode: mode })
      },

      hydrate: async () => {
        const { selectedListId, selectedTaskId, selectedCompletedTask, pinnedListIds } = get()
        if (selectedListId) {
          get().loadTasks(selectedListId)
        } else {
          get().loadStarredTasks()
        }
        if (selectedTaskId) {
          get().selectTask(selectedTaskId)
        }
        if (selectedCompletedTask) {
          await get().selectCompletedTask(selectedCompletedTask.id)
        }
        await get().loadCompletedTasks()
        get().loadAllLists()
        await Promise.all(pinnedListIds.map((listId) => get().loadPinnedTasks(listId)))
      }
    }),
    {
      name: 'daily-quests-storage',
      partialize: (state) => ({
        selectedListId: state.selectedListId,
        selectedTaskId: state.selectedTaskId,
        sortMode: state.sortMode,
        showCompletedHistory: state.showCompletedHistory,
        expandedListId: state.expandedListId,
        selectedCompletedTask: state.selectedCompletedTask,
        pinnedListIds: state.pinnedListIds,
        viewMode: state.viewMode
      })
    }
  )
)
