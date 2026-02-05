import { useAppStore } from '@/stores/appStore'
import { Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useEffect, useState } from 'react'
import type { Task, RepeatRule } from '@/db/types'

export function TaskDetails() {
  const { tasks, selectedTaskId, selectedCompletedTask, updateTask, deleteTask, allLists, toggleTaskStar } = useAppStore()
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')

  const activeTask = tasks.find((t: Task) => t.id === selectedTaskId)
  const task = activeTask || selectedCompletedTask
  const isCompleted = !!selectedCompletedTask
  const list = task ? allLists.find((l) => l.id === task.list_id) : null

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNotes(task.notes)
      setDueDate(task.due_date || '')
    } else {
      setTitle('')
      setNotes('')
      setDueDate('')
    }
  }, [task])

  if (!task) {
    return (
      <aside className="w-96 border-l bg-muted/10 h-screen flex items-center justify-center">
        <p className="text-muted-foreground">select a task to view details</p>
      </aside>
    )
  }

  const handleUpdateTask = async (updates: Partial<Task>) => {
    await updateTask(task.id, updates)
  }

  const handleDeleteTask = async () => {
    if (confirm('are you sure you want to delete this task?')) {
      await deleteTask(task.id)
    }
  }

  const handleTitleBlur = () => {
    if (title !== task.title) {
      handleUpdateTask({ title })
    }
  }

  const handleNotesBlur = () => {
    if (notes !== task.notes) {
      handleUpdateTask({ notes })
    }
  }

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDueDate(value)
    handleUpdateTask({ due_date: value || null })
  }

  const handleRepeatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'none') {
      handleUpdateTask({ repeat: undefined })
    } else {
      const repeat: RepeatRule = {
        freq: value as RepeatRule['freq'],
        interval: 1,
        ends: 'NEVER'
      }
      handleUpdateTask({ repeat })
    }
  }

  return (
    <aside className="w-96 border-l bg-muted/10 h-screen flex flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <h3 className="font-semibold">task details</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isCompleted ? (
          <>
            <div className="text-lg font-semibold line-through">{task.title}</div>
            <div className="text-sm text-muted-foreground">
              completed: {task.completed_at ? new Date(task.completed_at).toLocaleString() : 'unknown'}
            </div>
            {task.notes && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium">notes</label>
                  <div className="mt-1 p-3 border rounded-md bg-muted/30">{task.notes}</div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="task title"
              className="text-lg font-semibold"
            />

            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="add notes..."
              rows={4}
            />

            <Separator />

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">due date</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={handleDueDateChange}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">repeat</label>
                <select
                  value={task.repeat?.freq || 'none'}
                  onChange={handleRepeatChange}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                >
                  <option value="none">no repeat</option>
                  <option value="DAILY">daily</option>
                  <option value="WEEKLY">weekly</option>
                  <option value="MONTHLY">monthly</option>
                  <option value="YEARLY">yearly</option>
                </select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Button
                variant={task.starred ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleTaskStar(task.id)}
              >
                {task.starred ? '⭐ starred' : '☆ star'}
              </Button>
            </div>
          </>
        )}

        <Separator />

        <div className="text-xs text-muted-foreground">
          list: {list ? (list.deleted_at ? `${list.name} (deleted)` : list.name) : task.list_name}
        </div>
      </div>

      {!isCompleted && (
        <footer className="border-t p-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteTask}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            delete task
          </Button>
        </footer>
      )}
    </aside>
  )
}
