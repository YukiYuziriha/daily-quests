import { ulid } from 'ulid'
import { db } from './index'
import { Task, TaskList, RepeatRule } from './types'
import { addDays, addWeeks, addMonths, addYears, parseISO } from 'date-fns'

export class ListRepository {
  static async getAll(): Promise<TaskList[]> {
    return await db.lists.where('deleted_at').equals(0 as any).toArray()
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
    return await db.tasks
      .where('[list_id+parent_id+status]')
      .equals([listId, null, 'active'] as any)
      .sortBy('order')
  }

  static async getByParentId(parentId: string): Promise<Task[]> {
    return await db.tasks
      .where('[list_id+parent_id+status]')
      .anyOf([null, parentId, 'active'] as any)
      .sortBy('order')
  }

  static async getStarred(): Promise<Task[]> {
    return await db.tasks
      .where('[starred+status]')
      .equals([true, 'active'] as any)
      .reverse()
      .sortBy('starred_at')
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
    await db.tasks.update(id, { deleted_at: Date.now() })
  }

  static async toggleComplete(id: string): Promise<void> {
    const task = await this.getById(id)
    if (!task) return

    const now = Date.now()
    const isCompleting = task.status === 'active'

    if (isCompleting && task.repeat) {
      await this.createNextOccurrence(task)
    }

    await this.update(id, {
      status: isCompleting ? 'completed' : 'active',
      completed_at: isCompleting ? now : null
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

  static async setParent(id: string, parentId: string | null): Promise<void> {
    await this.update(id, { parent_id: parentId })
  }

  static async getCompleted(listId: string): Promise<Task[]> {
    return await db.tasks
      .where('[list_id+parent_id+status]')
      .equals([listId, null, 'completed'] as any)
      .reverse()
      .sortBy('completed_at')
  }

  private static async createNextOccurrence(task: Task): Promise<void> {
    const now = Date.now()
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
      completed_at: null,
      deleted_at: null,
      starred: task.starred,
      repeat: task.repeat
    })
  }
}
