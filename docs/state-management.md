# State Management (Zustand)

## Store Structure
- Single store: `src/stores/appStore.ts`
- State: `lists`, `tasks`, `completedTasks`, `selectedListId`, `selectedTaskId`, `sortMode`, `loading`, `showCompletedHistory`, `expandedListId`, `pinnedListIds`, `pinnedTasks`
- All DB operations go through repositories
- Persistence: Selected list/task, sort mode, history toggle, expanded history list, and pinned list ids persist across reloads (localStorage via zustand/persist)

## Sorting Pattern
- Helper function `sortTasksFn()` defined separately
- Exposed in store as `sortTasks()` action for internal consistency
- Sort modes: `my_order`, `date`, `starred_recently`

## Data Flow
1. User action → store action
2. Store action → repository method
3. Repository → DB (Dexie)
4. Repository returns data
5. Store updates state (optimistic updates where possible)
6. Components re-render from store state

## Task Reloading
- After structural changes (indent/outdent), full task reload: `loadTasks(listId)`
- Ensures hierarchical structure stays in sync with DB
- On app load, `hydrate()` action restores persisted state: selected list/task, history visibility, expanded history list

## Pinned Lists Board
- `pinnedListIds` tracks which lists are surfaced in the board view
- `pinnedTasks` caches the active task tree per pinned list
- `togglePinnedList()` adds/removes list ids and loads tasks on pin
- `refreshPinnedList(listId)` updates the cached tasks when tasks mutate
