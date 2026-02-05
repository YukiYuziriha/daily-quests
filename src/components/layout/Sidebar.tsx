import { useAppStore } from '@/stores/appStore'
import { Plus, Star, ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import type { TaskList } from '@/db/types'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableListRow({
  list,
  isSelected,
  isPinned,
  onSelect,
  onTogglePin,
  onRename,
  onDelete
}: {
  list: TaskList
  isSelected: boolean
  isPinned: boolean
  onSelect: () => void
  onTogglePin: () => void
  onRename: (event: React.MouseEvent) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: list.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        onClick={onSelect}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted/70 transition-colors text-left cursor-pointer text-sm ${
          isSelected ? 'bg-accent text-foreground' : 'text-foreground'
        }`}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          className="h-6 w-6 grid place-items-center rounded-full hover:bg-muted/60 cursor-grab"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div
          onClick={(event) => event.stopPropagation()}
          className="flex items-center"
        >
          <Checkbox
            checked={isPinned}
            onCheckedChange={onTogglePin}
            aria-label="pin list"
          />
        </div>
        <span className="flex-1 truncate">{list.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
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
    </div>
  )
}

export function Sidebar() {
  const { lists, allLists, selectedListId, createList, selectList, deleteList, updateList, completedTasks, showCompletedHistory, toggleShowCompletedHistory, expandedListId, setExpandedListId, selectCompletedTask, pinnedListIds, togglePinnedList, reorderLists } = useAppStore()
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingListId, setRenamingListId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')

  const handleCreateList = async () => {
    const name = prompt('list name:')
    if (name) {
      const list = await createList(name)
      selectList(list.id)
    }
  }

  const handleDeleteList = async (id: string) => {
    if (confirm('are you sure you want to delete this list and all its tasks?')) {
      await deleteList(id)
    }
  }

  const openRenameDialog = (list: TaskList, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingListId(list.id)
    setNewListName(list.name)
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

  const tasksByList = completedTasks.reduce((acc, task) => {
    if (!acc[task.list_id]) {
      const list = allLists.find(l => l.id === task.list_id)
      const listName = list ? (list.deleted_at ? `${list.name} (deleted)` : list.name) : task.list_name
      acc[task.list_id] = { listName, tasks: [] }
    }
    acc[task.list_id].tasks.push(task)
    return acc
  }, {} as Record<string, { listName: string; tasks: typeof completedTasks }>)

  const handleSelectCompletedTask = async (taskId: string) => {
    await selectCompletedTask(taskId)
  }

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = lists.findIndex((list) => list.id === active.id)
    const newIndex = lists.findIndex((list) => list.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const ordered = arrayMove(lists, oldIndex, newIndex)
    await reorderLists(ordered.map((list) => list.id))
  }

  return (
    <aside className="w-72 border-r bg-white/80 flex flex-col h-full">
      <div className="p-4">
        <Button
          onClick={handleCreateList}
          variant="ghost"
          className="w-full justify-start gap-2 rounded-full border border-border bg-white shadow-sm hover:bg-muted/60"
        >
          <Plus className="h-4 w-4" />
          create
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <button
          onClick={() => selectList(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted/70 transition-colors text-left text-sm ${
            selectedListId === null ? 'bg-accent text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Star className="h-4 w-4" />
          <span>starred tasks</span>
        </button>

        <div className="mt-5 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          lists
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lists.map((list) => list.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {lists.map((list) => (
                <SortableListRow
                  key={list.id}
                  list={list}
                  isSelected={selectedListId === list.id}
                  isPinned={pinnedListIds.includes(list.id)}
                  onSelect={() => selectList(list.id)}
                  onTogglePin={() => togglePinnedList(list.id)}
                  onRename={(event) => openRenameDialog(list, event)}
                  onDelete={() => handleDeleteList(list.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <button
          onClick={toggleShowCompletedHistory}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted/70 transition-colors text-left mt-4 text-sm text-muted-foreground"
        >
          {showCompletedHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span>history</span>
          <span className="ml-auto text-xs">({completedTasks.length})</span>
        </button>

        {showCompletedHistory && (
          <div className="mt-2 space-y-2 px-2">
            {Object.entries(tasksByList).map(([listId, { listName, tasks }]) => {
              if (tasks.length === 0) return null
              const isExpanded = expandedListId === listId
              return (
                <div key={listId} className="border rounded-xl bg-white">
                  <button
                    onClick={() => setExpandedListId(isExpanded ? null : listId)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left text-xs font-medium"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span className="flex-1 truncate">{listName}</span>
                    <span className="text-[11px] text-muted-foreground">({tasks.length})</span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 py-2 space-y-1 border-t">
                      {tasks.map(task => (
                        <button
                          key={task.id}
                          onClick={() => handleSelectCompletedTask(task.id)}
                          className="w-full text-left text-[11px] text-muted-foreground truncate line-through hover:text-foreground transition-colors"
                        >
                          {task.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {Object.keys(tasksByList).length === 0 && (
              <div className="text-xs text-muted-foreground px-3 py-2">no completed tasks yet</div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <button
          onClick={handleCreateList}
          className="w-full flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          create new list
        </button>
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
    </aside>
  )
}
