import { useAppStore } from '../stores/appStore'
import { Check, MoreVertical, Calendar, Star } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { useState } from 'react'
import { format } from 'date-fns'

export function TaskList() {
  const { tasks, selectedListId, lists, createTask, toggleTaskComplete, toggleTaskStar, selectTask, selectedTaskId } = useAppStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const currentList = lists.find((l) => l.id === selectedListId)
  const isStarredView = selectedListId === null

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedListId) return

    await createTask({
      list_id: selectedListId,
      parent_id: null,
      title: newTaskTitle,
      notes: '',
      due_date: null,
      due_time: null,
      status: 'active',
      deleted_at: null,
      starred: false,
      repeat: undefined
    })

    setNewTaskTitle('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTask()
    }
  }

  return (
    <main className="flex-1 flex flex-col h-screen">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            {isStarredView ? 'Starred tasks' : currentList?.name || 'Select a list'}
          </h2>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {selectedListId && (
          <div className="p-4 border-b">
            <Input
              placeholder="Add a task"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        )}

        <div className="p-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => selectTask(task.id)}
              className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                selectedTaskId === task.id ? 'bg-accent' : ''
              }`}
            >
              <Checkbox
                checked={task.status === 'completed'}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTaskComplete(task.id)
                }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </span>
                  {task.starred && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                </div>

                {task.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.due_date), 'MMM d, yyyy')}
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tasks yet. Add your first task above!
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
