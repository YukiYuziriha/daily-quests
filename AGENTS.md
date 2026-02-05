# AGENTS.md

## Decision Making
- Pragmatism over perfection
- Build for problem, not the hype
- When in doubt, ship simple
- Optimize for iteration speed
- Avoid premature abstraction
- Choose boring tech over bleeding edge

## Code Style
- Readable > Clean > Clever
- DRY within reason ( duplication > wrong abstraction)
- Explicit > Implicit
- Centralize shared utilities (helpers folder)
- Keep files focused and small (<300 lines)
- Early returns over deep nesting
- UI text must always be lowercase (never start with capital letters)

## Tool Usage
- Use subagents for MCP calls (Context7, Tavily) to preserve main context
- For library API questions → use Context7 first (docs change; training data stale)
- For time-sensitive info → use Tavily search
- Never guess API signatures or current best practices — verify with tools
- Before grep: Check docs/ for relevant patterns and crutches

## Centralization
- One source of truth for DB schema
- Shared types for data shapes
- Reusable UI components in components/ui
- Utility functions in lib/utils.ts
- DB operations in db/
- Store logic in stores/ (Zustand)

## Data & DB Rails
- UI components must not access Dexie; only repositories/services query DB
- Default queries exclude records where deleted_at != null (history/trash only)
- Task invariants: completed => completed_at set; active => completed_at null
- parent_id must exist in same list_id; max depth 3
- Complex ops (indent/outdent/reorder/list delete/recurring spawn) are single atomic mutations
- Drag & drop: move subtree; reorder only within same parent_id lane; no cross-list parenting
- Persisted UI state must be versioned and tolerate missing IDs
- Changes to repos/ordering/hierarchy must include or update unit tests

## Documentation

### Project Docs (docs/)
- **typescript-config.md** - TypeScript compilation rules, path aliases, verbatimModuleSyntax
- **database.md** - Dexie schema, compound indexes, soft delete, task hierarchy
- **state-management.md** - Zustand store pattern, data flow, sorting, reloading
- **task-features.md** - Recurring tasks, subtasks/indentation, sorting modes
- **pwa-config.md** - vite-plugin-pwa setup, service worker, offline caching
- **components-ui.md** - shadcn/ui setup, layout components, Tailwind theming
- **file-structure.md** - Directory layout and file organization

### Documentation Rules
- **Update or create docs** when discovering non-obvious patterns, crutches, or architectural decisions
- Keep docs brief and meta-level (one-page overviews preferred)
- Reference existing docs before making assumptions about architecture
- Each doc should focus on a single aspect of the project
