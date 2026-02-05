# File Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui primitives (button, input, etc.)
│   └── layout/       # App layout components
│       ├── Sidebar.tsx
│       ├── TaskList.tsx
│       └── TaskDetails.tsx
├── db/
│   ├── index.ts       # Dexie instance and schema
│   ├── types.ts      # TypeScript interfaces
│   └── repositories.ts # DB query methods
├── lib/
│   └── utils.ts      # Helper functions (cn, etc.)
├── stores/
│   └── appStore.ts   # Zustand global state
├── App.tsx
└── main.tsx

docs/
├── typescript-config.md
├── database.md
├── state-management.md
├── task-features.md
├── pwa-config.md
└── components-ui.md

AGENTS.md
```
