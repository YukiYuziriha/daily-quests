# AGENTS.md

## Decision Making
- Pragmatism over perfection
- Build for the problem, not the hype
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

## Centralization
- One source of truth for DB schema
- Shared types for data shapes
- Reusable UI components in components/ui
- Utility functions in lib/utils.ts
- DB operations in db/
- Store logic in stores/ (Zustand)
