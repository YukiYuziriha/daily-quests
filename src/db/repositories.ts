import { ulid } from 'ulid'
import { db } from './index'
import type { Task, TaskList } from './types'
import { addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns'

const MAX_DEPTH = 3

type TaskWithChildren = Task & { children: TaskWithChildren[] }

export class ListRepository {
  static async getAll(): Promise<TaskList[]> {
    return await db.lists.filter((l) => l.deleted_at === null).toArray()
  }

  static async getById(id: string): Promise<TaskList | undefined> {
    return await db.lists.get(id)
  }

  static async create(name: string): Promise<TaskList> {
    const now = Date.now()
    const list: TaskList = {
      id: ulid(),
      name,
      created_at: now,
      updated_at: now,
      order: now,
      deleted_at: null
    }
    await db.lists.add(list)
    return list
  }

  static async update(id: string, updates: Partial<TaskList>): Promise<void> {
    await db.lists.update(id, {
      ...updates,
      updated_at: Date.now()
    })
  }

  static async delete(id: string): Promise<void> {
    await db.lists.update(id, { deleted_at: Date.now() })
    await db.tasks.where('list_id').equals(id).modify({ deleted_at: Date.now() })
  }
}

export class TaskRepository {
  static async getByListId(listId: string): Promise<Task[]> {
    const allTasks = await db.tasks
      .where('list_id')
      .equals(listId)
      .and((t) => t.deleted_at === null && t.status === 'active')
      .sortBy('order')

    return this.buildTaskTree(allTasks)
  }

  static async getByParentId(parentId: string | null, listId: string): Promise<Task[]> {
    return await db.tasks
      .where('[list_id+parent_id+status]')
      .equals([listId, parentId, 'active'] as any)
      .sortBy('order')
  }

  static async getStarred(): Promise<Task[]> {
    return await db.tasks
      .filter((t) => t.starred && t.status === 'active' && t.deleted_at === null)
      .sortBy('order')
  }

  static async getById(id: string): Promise<Task | undefined> {
    return await db.tasks.get(id)
  }

  static async create(data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'order' | 'completed_at' | 'starred_at'>): Promise<Task> {
    const now = Date.now()
    const task: Task = {
      ...data,
      id: ulid(),
      created_at: now,
      updated_at: now,
      order: now,
      completed_at: null,
      starred_at: null
    }
    await db.tasks.add(task)
    return task
  }

  static async update(id: string, updates: Partial<Task>): Promise<void> {
    await db.tasks.update(id, {
      ...updates,
      updated_at: Date.now()
    })
  }

  static async delete(id: string): Promise<void> {
    const task = await this.getById(id)
    if (!task) return

    await db.tasks.where('id').equals(id).modify({ deleted_at: Date.now() })

    const allTasks = await db.tasks
      .where('list_id')
      .equals(task.list_id)
      .toArray()

    const descendantIds = this.getDescendantIds(task.id, allTasks)
    for (const descendantId of descendantIds) {
      await db.tasks.update(descendantId, { deleted_at: Date.now() })
    }
  }

  static async toggleComplete(id: string): Promise<void> {
    const task = await this.getById(id)
    if (!task) return

    const isCompleting = task.status === 'active'

    if (isCompleting && task.repeat) {
      await this.createNextOccurrence(task)
    }

    await this.update(id, {
      status: isCompleting ? 'completed' : 'active',
      completed_at: isCompleting ? Date.now() : null
    })
  }

  static async toggleStar(id: string): Promise<void> {
    const task = await this.getById(id)
    if (!task) return

    await this.update(id, {
      starred: !task.starred,
      starred_at: !task.starred ? Date.now() : null
    })
  }

  static async reorder(id: string, newOrder: number): Promise<void> {
    await this.update(id, { order: newOrder })
  }

  static async setParent(id: string, parentId: string | null, listId: string): Promise<boolean> {
    const allTasks = await db.tasks.where('list_id').equals(listId).toArray()
    const task = allTasks.find((t) => t.id === id)

    if (!task) return false

    const newDepth = parentId ? this.getDepth(parentId, allTasks) + 1 : 0

    if (newDepth > MAX_DEPTH) return false

    await this.update(id, { parent_id: parentId })
    return true
  }

  static async getCompleted(listId: string): Promise<Task[]> {
    return await db.tasks
      .where('[list_id+parent_id+status]')
      .equals([listId, null, 'completed'] as any)
      .reverse()
      .sortBy('completed_at')
  }

  static async getAllCompleted(): Promise<Task[]> {
    return await db.tasks
      .where('status')
      .equals('completed')
      .and((t) => t.deleted_at === null)
      .reverse()
      .sortBy('completed_at')
  }

  static async canIndent(id: string, listId: string): Promise<boolean> {
    const allTasks = await db.tasks.where('list_id').equals(listId).toArray()
    const task = allTasks.find((t) => t.id === id)

    if (!task || !task.parent_id) return false

    const siblings = allTasks.filter((t) => t.parent_id === task.parent_id && t.deleted_at === null)
    const taskIndex = siblings.findIndex((t) => t.id === id)

    if (taskIndex === 0) return false

    const previousTask = siblings[taskIndex - 1]

    const newDepth = previousTask ? this.getDepth(previousTask.id, allTasks) + 1 : 0

    return newDepth <= MAX_DEPTH
  }

  static async canOutdent(id: string): Promise<boolean> {
    const task = await this.getById(id)
    return !!(task && task.parent_id)
  }

  static async indentTask(id: string, listId: string): Promise<boolean> {
    const canIndent = await this.canIndent(id, listId)
    if (!canIndent) return false

    const allTasks = await db.tasks.where('list_id').equals(listId).toArray()
    const task = allTasks.find((t) => t.id === id)

    if (!task || !task.parent_id) return false

    const siblings = allTasks.filter((t) => t.parent_id === task.parent_id && t.deleted_at === null)
    const taskIndex = siblings.findIndex((t) => t.id === id)

    if (taskIndex === 0) return false

    const previousTask = siblings[taskIndex - 1]
    await this.setParent(id, previousTask.id, listId)

    return true
  }

  static async outdentTask(id: string, listId: string): Promise<boolean> {
    const task = await this.getById(id)
    if (!task || !task.parent_id) return false

    const parentTask = await this.getById(task.parent_id)
    const newParentId = parentTask ? parentTask.parent_id : null

    await this.setParent(id, newParentId, listId)
    return true
  }

  private static buildTaskTree(tasks: Task[]): Task[] {
    const taskMap = new Map<string, TaskWithChildren>()
    const rootTasks: TaskWithChildren[] = []

    tasks.forEach((task) => {
      taskMap.set(task.id, { ...task, children: [] })
    })

    tasks.forEach((task) => {
      const taskWithChildren = taskMap.get(task.id)!
      if (task.parent_id && taskMap.has(task.parent_id)) {
        taskMap.get(task.parent_id)!.children.push(taskWithChildren)
      } else {
        rootTasks.push(taskWithChildren)
      }
    })

    return this.flattenTaskTree(rootTasks)
  }

  private static flattenTaskTree(tasks: TaskWithChildren[]): Task[] {
    let result: Task[] = []

    tasks.forEach((task) => {
      result.push(task)
      if (task.children.length > 0) {
        result = result.concat(this.flattenTaskTree(task.children))
      }
    })

    return result
  }

  private static getDepth(taskId: string, allTasks: Task[]): number {
    const task = allTasks.find((t) => t.id === taskId)
    if (!task || !task.parent_id) return 0
    return 1 + this.getDepth(task.parent_id, allTasks)
  }

  private static getDescendantIds(taskId: string, allTasks: Task[]): string[] {
    const children = allTasks.filter((t) => t.parent_id === taskId)
    let ids: string[] = []

    children.forEach((child) => {
      ids.push(child.id)
      ids = ids.concat(this.getDescendantIds(child.id, allTasks))
    })

    return ids
  }

  private static async createNextOccurrence(task: Task): Promise<void> {
    let nextDueDate: Date | null = null

    if (task.due_date) {
      const dueDate = parseISO(task.due_date)
      switch (task.repeat!.freq) {
        case 'DAILY':
          nextDueDate = addDays(dueDate, task.repeat!.interval)
          break
        case 'WEEKLY':
          nextDueDate = addWeeks(dueDate, task.repeat!.interval)
          break
        case 'MONTHLY':
          nextDueDate = addMonths(dueDate, task.repeat!.interval)
          break
        case 'YEARLY':
          nextDueDate = addYears(dueDate, task.repeat!.interval)
          break
      }
    }

    await this.create({
      list_id: task.list_id,
      parent_id: task.parent_id,
      title: task.title,
      notes: task.notes,
      due_date: nextDueDate ? nextDueDate.toISOString().split('T')[0] : null,
      due_time: task.due_time,
      status: 'active',
      deleted_at: null,
      starred: task.starred,
      repeat: task.repeat
    })
  }
}
