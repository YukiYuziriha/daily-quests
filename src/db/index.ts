import Dexie, { type Table } from 'dexie'
import type { Task, TaskList } from './types'

export class DailyQuestsDB extends Dexie {
  lists!: Table<TaskList>
  tasks!: Table<Task>

  constructor() {
    super('DailyQuestsDB')
    this.version(1).stores({
      lists: 'id, order, deleted_at',
      tasks: 'id, list_id, parent_id, status, starred, starred_at, due_date, order, deleted_at, [list_id+parent_id+status], [starred+status], [list_id+due_date]'
    })
  }
}

export const db = new DailyQuestsDB()
