import { useAppStore } from '@/stores/appStore'
import { Plus, Star, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Sidebar() {
  const { lists, selectedListId, createList, selectList, deleteList, completedTasks, showCompletedHistory, toggleShowCompletedHistory } = useAppStore()
  const [expandedListId, setExpandedListId] = useState<string | null>(null)

  const handleCreateList = async () => {
    const name = prompt('List name:')
    if (name) {
      const list = await createList(name)
      selectList(list.id)
    }
  }

  const handleDeleteList = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this list and all its tasks?')) {
      await deleteList(id)
    }
  }

  const tasksByList = completedTasks.reduce((acc, task) => {
    if (!acc[task.list_id]) {
      acc[task.list_id] = []
    }
    acc[task.list_id].push(task)
    return acc
  }, {} as Record<string, typeof completedTasks>)

  return (
    <aside className="w-64 border-r bg-muted/10 flex flex-col h-screen">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">Daily Quests</h1>
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
              <span>Starred tasks</span>
            </button>

          <div className="mt-4 mb-2 px-3 text-xs font-semibold text-muted-foreground">
            Lists
          </div>

          <button
            onClick={toggleShowCompletedHistory}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left mt-4"
          >
            {showCompletedHistory ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>History</span>
            <span className="ml-auto text-xs text-muted-foreground">({completedTasks.length})</span>
          </button>

          {showCompletedHistory && (
            <div className="mt-2 space-y-2 px-2">
              {Object.entries(tasksByList).map(([listId, tasks]) => {
                const list = lists.find(l => l.id === listId)
                if (!list || tasks.length === 0) return null
                const isExpanded = expandedListId === listId
                return (
                  <div key={listId} className="border rounded-lg">
                    <button
                      onClick={() => setExpandedListId(isExpanded ? null : listId)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent transition-colors text-left text-sm font-medium"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      <span className="flex-1 truncate">{list.name}</span>
                      <span className="text-xs text-muted-foreground">({tasks.length})</span>
                    </button>
                    {isExpanded && (
                      <div className="px-3 py-2 space-y-1 border-t">
                        {tasks.map(task => (
                          <div key={task.id} className="text-xs text-muted-foreground truncate line-through">
                            {task.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              {Object.keys(tasksByList).length === 0 && (
                <div className="text-xs text-muted-foreground px-3 py-2">No completed tasks yet</div>
              )}
            </div>
          )}

          {lists.map((list) => (
            <div key={list.id} className="relative group">
              <button
                onClick={() => selectList(list.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left ${
                  selectedListId === list.id ? 'bg-accent' : ''
                }`}
              >
                <span className="flex-1 truncate">{list.name}</span>
                <Trash2
                  className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  onClick={(e) => handleDeleteList(list.id, e)}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 border-t">
        <Button
          onClick={handleCreateList}
          variant="ghost"
          className="w-full justify-start"
        >
          <Plus className="h-4 w-4 mr-2" />
          New list
        </Button>
      </div>
    </aside>
  )
}
