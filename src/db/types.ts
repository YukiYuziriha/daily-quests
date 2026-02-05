export type RepeatFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
export type RepeatEnd = "NEVER" | "ON_DATE" | "AFTER"

export interface RepeatRule {
  freq: RepeatFrequency
  interval: number
  ends: RepeatEnd
  until?: string
  count?: number
}

export interface Task {
  id: string
  list_id: string
  list_name: string
  parent_id: string | null
  title: string
  notes: string
  due_date: string | null
  due_time: string | null
  status: "active" | "completed"
  completed_at: number | null
  created_at: number
  updated_at: number
  deleted_at: number | null
  order: number
  starred: boolean
  starred_at: number | null
  repeat: RepeatRule | undefined
}

export interface TaskList {
  id: string
  name: string
  created_at: number
  updated_at: number
  order: number
  deleted_at: number | null
}

export type SortMode = "my_order" | "date" | "starred_recently"
