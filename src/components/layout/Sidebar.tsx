import { useAppStore } from '../stores/appStore'
import { Plus, Star } from 'lucide-react'
import { Button } from '../components/ui/button'

export function Sidebar() {
  const { lists, selectedListId, createList, selectList } = useAppStore()

  const handleCreateList = async () => {
    const name = prompt('List name:')
    if (name) {
      const list = await createList(name)
      selectList(list.id)
    }
  }

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

          {lists.map((list) => (
            <button
              key={list.id}
              onClick={() => selectList(list.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-left ${
                selectedListId === list.id ? 'bg-accent' : ''
              }`}
            >
              <span className="flex-1 truncate">{list.name}</span>
            </button>
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
