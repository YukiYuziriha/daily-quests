import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import { Sidebar } from '@/components/layout/Sidebar'
import { TaskList } from '@/components/layout/TaskList'
import { TaskDetails } from '@/components/layout/TaskDetails'

function App() {
  const loadLists = useAppStore((state) => state.loadLists)
  const hydrate = useAppStore((state) => state.hydrate)

  useEffect(() => {
    loadLists().then(() => hydrate())
  }, [loadLists, hydrate])

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <TaskList />
      <TaskDetails />
    </div>
  )
}

export default App
