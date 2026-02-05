import { useAppStore } from '@/stores/appStore'
import { MoreVertical, Calendar, Star, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { format } from 'date-fns'
import type { Task } from '@/db/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableTask({ task, depth, canIndent, canOutdent }: {
  task: Task
  depth: number
  canIndent: boolean
  canOutdent: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })
  const { toggleTaskComplete, selectTask, selectedTaskId, indentTask, outdentTask } = useAppStore()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 16}px`
  }

  const handleIndent = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await indentTask(task.id)
  }

  const handleOutdent = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await outdentTask(task.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectTask(task.id)}
      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
        selectedTaskId === task.id ? 'bg-accent' : ''
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

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

      <div className="flex items-center gap-1">
        {canOutdent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOutdent}
            title="Outdent (Ctrl+[)"
          >
            ←
          </Button>
        )}
        {canIndent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleIndent}
            title="Indent (Ctrl+])"
          >
            →
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function TaskList() {
  const { tasks, selectedListId, lists, createTask } = useAppStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const currentList = lists.find((l) => l.id === selectedListId)
  const isStarredView = selectedListId === null

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)
      
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)
      
      for (let i = 0; i < reorderedTasks.length; i++) {
        await useAppStore.getState().updateTask(reorderedTasks[i].id, { order: i * 1000 })
      }
    }
  }

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

  const getTaskDepth = (task: Task, allTasks: Task[]): number => {
    if (!task.parent_id) return 0
    const parent = allTasks.find((t) => t.id === task.parent_id)
    return parent ? getTaskDepth(parent, allTasks) + 1 : 0
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tasks.map((task: Task) => {
                const depth = getTaskDepth(task, tasks)
                const canIndent = depth < 3 && !!task.parent_id
                const canOutdent = !!task.parent_id

                return (
                  <SortableTask
                    key={task.id}
                    task={task}
                    depth={depth}
                    canIndent={canIndent}
                    canOutdent={canOutdent}
                  />
                )
              })}
            </SortableContext>
          </DndContext>

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
