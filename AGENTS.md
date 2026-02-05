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

## Centralization
- One source of truth for DB schema
- Shared types for data shapes
- Reusable UI components in components/ui
- Utility functions in lib/utils.ts
- DB operations in db/
- Store logic in stores/ (Zustand)

## Project Observations
- Path aliases: `@/` maps to `./src/*` (configured in tsconfig.app.json and vite.config.ts)
- shadcn/ui components located at `src/components/ui/`
- Store: Zustand at `src/stores/appStore.ts`
- DB: Dexie at `src/db/index.ts` with repositories in `src/db/repositories.ts`
- Types: `src/db/types.ts` contains shared DB interfaces
- Layout components in `src/components/layout/` (Sidebar, TaskList, TaskDetails)
