import { useAppStore } from '@/stores/appStore'
import { Plus, Star, ChevronDown, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import type { TaskList } from '@/db/types'

export function Sidebar() {
  const { lists, selectedListId, createList, selectList, deleteList, updateList, completedTasks, showCompletedHistory, toggleShowCompletedHistory, expandedListId, setExpandedListId, selectCompletedTask } = useAppStore()
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
      acc[task.list_id] = { list: lists.find((l: TaskList) => l.id === task.list_id), tasks: [] }
    }
    acc[task.list_id].tasks.push(task)
    return acc
  }, {} as Record<string, { list: TaskList | undefined; tasks: typeof completedTasks }>)

  const handleSelectCompletedTask = async (taskId: string) => {
    await selectCompletedTask(taskId)
  }

  return (
    <aside className="w-64 border-r bg-muted/10 flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">daily quests</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
            <button
              onClick={() => selectList(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left ${
                selectedListId === null ? 'bg-accent' : ''
              }`}
            >
              <Star className="h-4 w-4" />
              <span>starred tasks</span>
            </button>

          <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground">
            lists
          </div>

          {lists.map((list) => (
            <div key={list.id} className="relative group">
              <button
                onClick={() => selectList(list.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left ${
                  selectedListId === list.id ? 'bg-accent' : ''
                }`}
              >
                <span className="flex-1 truncate">{list.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => openRenameDialog(list, e)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteList(list.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </button>
            </div>
          ))}

          <button
            onClick={toggleShowCompletedHistory}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left mt-4"
          >
            {showCompletedHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>history</span>
            <span className="ml-auto text-xs text-muted-foreground">({completedTasks.length})</span>
          </button>

          {showCompletedHistory && (
            <div className="mt-2 space-y-2 px-2">
              {Object.entries(tasksByList).map(([listId, { list, tasks }]) => {
                if (tasks.length === 0) return null
                const isExpanded = expandedListId === listId
                const listName = list ? (list.deleted_at ? `${list.name} (deleted)` : list.name) : 'unknown list'
                return (
                  <div key={listId} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedListId(isExpanded ? null : listId)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left text-sm font-medium"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span className="flex-1 truncate">{listName}</span>
                      <span className="text-xs text-muted-foreground">({tasks.length})</span>
                    </button>
                    {isExpanded && (
                      <div className="px-3 py-2 space-y-1 border-t">
                        {tasks.map(task => (
                          <button
                            key={task.id}
                            onClick={() => handleSelectCompletedTask(task.id)}
                            className="w-full text-left text-xs text-muted-foreground truncate line-through hover:text-foreground transition-colors"
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
      </div>

      <div className="p-2 border-t">
        <Button
          onClick={handleCreateList}
          variant="ghost"
          className="w-full justify-start"
        >
          <Plus className="h-4 w-4 mr-2" />
          new list
        </Button>
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
