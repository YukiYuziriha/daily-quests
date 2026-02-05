# Database (Dexie)

## Schema
- Tables: `lists`, `tasks`
- IDs: ULIDs (sortable, client-side generated)
- Soft delete: `deleted_at` timestamp instead of hard delete
- Queries must filter: `deleted_at === null`

## Compound Indexes
- Use array syntax for multi-key queries: `[list_id+parent_id+status]`
- `equals()` requires exact array match including order
- Example: `[listId, null, 'active']` not `[listId, 'active']`

## Indexes Defined
```
lists: 'id, order, deleted_at'
tasks: 'id, list_id, parent_id, status, starred, starred_at, due_date, order, deleted_at, [list_id+parent_id+status], [starred+status], [list_id+due_date]'
```

## Task Hierarchy
- Stored flat with `parent_id: string | null`
- Top-level tasks have `parent_id === null`
- Subtask depth: calculated recursively at runtime (max depth = 3)
- `getByListId()` returns depth-first flattened tree for UI
