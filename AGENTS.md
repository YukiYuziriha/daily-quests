# AGENTS.md

## Decision Making
- Pragmatism over perfection
- Build for the problem, not the hype
- When in doubt, ship simple
- Optimize for iteration speed
- Avoid premature abstraction
- Choose boring tech over bleeding edge
- Update Project Observations section when discovering non-obvious patterns

## Code Style
- Readable > Clean > Clever
- DRY within reason ( duplication > wrong abstraction)
- Explicit > Implicit
- Centralize shared utilities (helpers folder)
- Keep files focused and small (<300 lines)
- Early returns over deep nesting

## Tool Usage
- Use subagents for MCP calls (Context7, Tavily) to preserve main context
- For library API questions → use Context7 first (docs change; training data stale)
- For time-sensitive info → use Tavily search
- Never guess API signatures or current best practices — verify with tools
- Before grep: Check AGENTS.md Project Observations for architectural patterns and known crutches

## Centralization
- One source of truth for DB schema
- Shared types for data shapes
- Reusable UI components in components/ui
- Utility functions in lib/utils.ts
- DB operations in db/
- Store logic in stores/ (Zustand)

## Project Observations

### Architecture & Crutches
- **verbatimModuleSyntax**: Requires `type` keyword for type imports (`import type { X }`) - causes build errors if missing
- **Path aliases**: Must be configured in BOTH `tsconfig.app.json` (paths) AND `vite.config.ts` (resolve.alias) - missing either breaks imports
- **Dexie compound indexes**: Use array syntax like `[list_id+parent_id+status]` for multi-key queries
- **shadcn/ui installation**: Creates `@/` directory outside `src/` by default - components must be moved to `src/components/ui/`
- **Task hierarchy**: Stored flat in DB with `parent_id` - `buildTaskTree()` converts to nested structure for UI
- **Subtask depth**: Calculated recursively at runtime (max depth = 3), not stored in DB
- **Soft delete pattern**: Uses `deleted_at` timestamp instead of actual deletion - queries must filter `deleted_at === null`
- **Zustand sort function**: Defined as helper then exposed in store - both needed for internal consistency
- **Recurring tasks**: Creates NEW task on completion (doesn't modify existing task) - leaves audit trail naturally
- **PWA assets**: Manifest references non-existent PNGs (pwa-192x192.png, pwa-512x512.png) - builds successfully but missing icons
- **TaskRepository.getByListId**: Returns flattened hierarchical tasks (depth-first traversal), not flat list from DB
- **Dexie equals() with compound indexes**: Requires exact array match including order - `[listId, null, 'active']` not `[listId, 'active']`

### File Locations
- shadcn/ui: `src/components/ui/`
- Store: `src/stores/appStore.ts`
- DB: `src/db/index.ts`, repositories at `src/db/repositories.ts`
- Types: `src/db/types.ts`
- Layout: `src/components/layout/Sidebar.tsx`, `TaskList.tsx`, `TaskDetails.tsx`
