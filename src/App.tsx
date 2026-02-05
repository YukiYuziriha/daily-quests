import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { TaskList } from '@/components/layout/TaskList'
import { TaskDetails } from '@/components/layout/TaskDetails'
import { CheckSquare2, Search, Settings, UserCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

function App() {
  const loadLists = useAppStore((state) => state.loadLists)
  const hydrate = useAppStore((state) => state.hydrate)

  useEffect(() => {
    loadLists().then(() => hydrate())
  }, [loadLists, hydrate])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 bg-white/90 backdrop-blur border-b">
        <div className="h-full px-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CheckSquare2 className="h-5 w-5" />
          </div>
          <div className="text-lg font-semibold">daily quests</div>
          <div className="hidden md:block flex-1 max-w-md ml-4">
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="search"
                className="h-9 pl-9 bg-muted/60 border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button className="h-9 w-9 rounded-full hover:bg-muted/60 grid place-items-center" type="button" aria-label="settings">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="h-9 w-9 rounded-full hover:bg-muted/60 grid place-items-center" type="button" aria-label="account">
              <UserCircle2 className="h-6 w-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <TaskList />
        <TaskDetails />
      </div>
    </div>
  )
}

export default App
