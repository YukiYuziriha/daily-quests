import { useAppStore } from '@/stores/appStore'
import { MoreVertical, Calendar, Star, GripVertical, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import type { Task, TaskList } from '@/db/types'
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
      className={`group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2 ${
        selectedTaskId === task.id ? 'bg-blue-50/70 border-blue-500' : 'border-transparent hover:bg-muted/50'
      }`}
    >
      <div {...attributes} {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
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
          {task.starred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
        </div>

        {task.due_date && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), 'MMM d, yyyy')}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {canOutdent && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleOutdent}
            title="outdent (ctrl+[)"
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
            title="indent (ctrl+])"
          >
            →
          </Button>
        )}
      </div>
    </div>
  )
}

function PinnedTaskRow({ task, depth }: { task: Task; depth: number }) {
  const { toggleTaskComplete, selectTask, selectList } = useAppStore()

  return (
    <div
      onClick={() => {
        selectList(task.list_id)
        selectTask(task.id)
      }}
      className="group flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
      style={{ marginLeft: `${depth * 12}px` }}
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
          {task.starred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
        </div>
        {task.due_date && (
          <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.due_date), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    </div>
  )
}

function SortablePinnedListCard({
  list,
  children,
  onRename,
  onDelete
}: {
  list: { id: string; name: string }
  children: React.ReactNode
  onRename: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl border bg-white/90 shadow-sm p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="h-7 w-7 rounded-full hover:bg-muted/60 grid place-items-center cursor-grab"
            {...attributes}
            {...listeners}
            aria-label="reorder list"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">list</div>
            <h3 className="text-base font-semibold">{list.name}</h3>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="h-4 w-4 mr-2" />
              rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {children}
    </div>
  )
}

export function TaskList() {
  const { tasks, selectedListId, lists, createTask, selectedTaskId, toggleTaskComplete, indentTask, outdentTask, selectTask, deleteList, updateList, pinnedListIds, pinnedTasks, reorderPinnedLists, viewMode, setViewMode } = useAppStore()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [renamingListId, setRenamingListId] = useState<string | null>(null)
  const [newPinnedTaskTitles, setNewPinnedTaskTitles] = useState<Record<string, string>>({})

  const currentList = lists.find((l) => l.id === selectedListId)
  const isStarredView = selectedListId === null

  const handleDeleteList = async () => {
    if (confirm('are you sure you want to delete this list and all its tasks?')) {
      await deleteList(selectedListId!)
    }
  }

  const openRenameDialog = (listId: string, listName: string) => {
    setNewListName(listName)
    setRenamingListId(listId)
    setRenameDialogOpen(true)
  }

  const handleRenameList = async () => {
    if (renamingListId && newListName.trim()) {
      await updateList(renamingListId, newListName.trim())
      setRenameDialogOpen(false)
      setRenamingListId(null)
      setNewListName('')
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      if (e.key === 'Escape' && selectedTaskId) {
        selectTask(null)
      } else if (e.key === ' ' && selectedTaskId) {
        e.preventDefault()
        toggleTaskComplete(selectedTaskId)
      } else if (e.key === ']' && e.ctrlKey && selectedTaskId) {
        e.preventDefault()
        indentTask(selectedTaskId)
      } else if (e.key === '[' && e.ctrlKey && selectedTaskId) {
        e.preventDefault()
        outdentTask(selectedTaskId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTaskId, toggleTaskComplete, indentTask, outdentTask, selectTask])

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

  const handlePinnedTaskChange = (listId: string, value: string) => {
    setNewPinnedTaskTitles((prev) => ({ ...prev, [listId]: value }))
  }

  const handleCreatePinnedTask = async (listId: string) => {
    const title = newPinnedTaskTitles[listId]?.trim()
    if (!title) return

    await createTask({
      list_id: listId,
      parent_id: null,
      title,
      notes: '',
      due_date: null,
      due_time: null,
      status: 'active',
      deleted_at: null,
      starred: false,
      repeat: undefined
    })

    setNewPinnedTaskTitles((prev) => ({ ...prev, [listId]: '' }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateTask()
    }
  }

  const handlePinnedKeyDown = (e: React.KeyboardEvent, listId: string) => {
    if (e.key === 'Enter') {
      handleCreatePinnedTask(listId)
    }
  }

  const getTaskDepth = (task: Task, allTasks: Task[]): number => {
    if (!task.parent_id) return 0
    const parent = allTasks.find((t) => t.id === task.parent_id)
    return parent ? getTaskDepth(parent, allTasks) + 1 : 0
  }

  const pinnedLists = pinnedListIds
    .map((id) => lists.find((list) => list.id === id))
    .filter((list): list is TaskList => !!list)
  const activeViewMode = pinnedLists.length > 0 && viewMode === 'pinned' ? 'pinned' : 'list'

  const handlePinnedListDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = pinnedListIds.indexOf(active.id as string)
    const newIndex = pinnedListIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    const ordered = arrayMove(pinnedListIds, oldIndex, newIndex)
    reorderPinnedLists(ordered)
  }

  const viewToggle = (
    <div className="flex items-center rounded-full border bg-white p-1">
      <button
        type="button"
        onClick={() => setViewMode('pinned')}
        disabled={pinnedLists.length === 0}
        className={`px-3 py-1 text-xs rounded-full transition-colors ${
          activeViewMode === 'pinned'
            ? 'bg-blue-600 text-white'
            : 'text-muted-foreground hover:text-foreground'
        } ${pinnedLists.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        pinned
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`px-3 py-1 text-xs rounded-full transition-colors ${
          activeViewMode === 'list'
            ? 'bg-blue-600 text-white'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        list
      </button>
    </div>
  )

  if (activeViewMode === 'pinned') {
    return (
      <main className="flex-1 flex flex-col h-full bg-[radial-gradient(circle_at_top,_hsl(var(--background))_0%,_hsl(210_60%_96%)_40%,_hsl(210_30%_98%)_100%)]">
        <header className="border-b bg-white/70 backdrop-blur">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {viewToggle}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handlePinnedListDragEnd}
            >
              <SortableContext items={pinnedListIds} strategy={verticalListSortingStrategy}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {pinnedLists.map((list) => {
                    const listTasks = pinnedTasks[list.id] || []

                    return (
                      <SortablePinnedListCard
                        key={list.id}
                        list={list}
                        onRename={() => openRenameDialog(list.id, list.name)}
                        onDelete={() => deleteList(list.id)}
                      >
                        <div className="rounded-xl border bg-white p-2 mb-3">
                          <Input
                            placeholder="add a task"
                            value={newPinnedTaskTitles[list.id] || ''}
                            onChange={(e) => handlePinnedTaskChange(list.id, e.target.value)}
                            onKeyDown={(e) => handlePinnedKeyDown(e, list.id)}
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          {listTasks.map((task) => {
                            const depth = getTaskDepth(task, listTasks)
                            return <PinnedTaskRow key={task.id} task={task} depth={depth} />
                          })}
                        </div>

                        {listTasks.length === 0 && (
                          <div className="text-sm text-muted-foreground">no tasks yet</div>
                        )}
                      </SortablePinnedListCard>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>rename list</DialogTitle>
            </DialogHeader>
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameList()
                } else if (e.key === 'Escape') {
                  setRenameDialogOpen(false)
                }
              }}
              placeholder="enter list name"
              autoFocus
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>
                cancel
              </Button>
              <Button onClick={handleRenameList}>
                save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-[radial-gradient(circle_at_top,_hsl(var(--background))_0%,_hsl(210_60%_96%)_40%,_hsl(210_30%_98%)_100%)]">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {viewToggle}
            <div>
              <h2 className="text-2xl font-semibold leading-tight">
                {isStarredView ? 'starred tasks' : currentList?.name || 'select a list'}
              </h2>
            </div>
          </div>
          {currentList && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => openRenameDialog(currentList.id, currentList.name)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeleteList} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {selectedListId && (
          <div className="px-6 pt-5">
            <div className="rounded-2xl border bg-white/90 shadow-sm p-3">
              <Input
                placeholder="add a task"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              />
            </div>
          </div>
        )}

        <div className="px-4 pb-6 pt-4">
          <div className="rounded-2xl border bg-white/90 shadow-sm">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y">
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
                </div>
              </SortableContext>
            </DndContext>

            {tasks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                no tasks yet. add your first task above!
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>rename list</DialogTitle>
          </DialogHeader>
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameList()
              } else if (e.key === 'Escape') {
                setRenameDialogOpen(false)
              }
            }}
            placeholder="enter list name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>
              cancel
            </Button>
            <Button onClick={handleRenameList}>
              save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
