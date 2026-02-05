# Components & UI

## shadcn/ui
- Installation creates `@/` directory outside `src/`
- **Must move** to `src/components/ui/` after install
- Path alias `@/components/ui` maps to `src/components/ui`

## UI Components
- `button`, `input`, `textarea`, `checkbox`
- `scroll-area`, `separator`, `sheet`, `dialog`
- All unstyled components - styled via Tailwind

## Layout Components
- **Sidebar**: List navigation, "Starred tasks" view
- **TaskList**: Task display, subtask indentation, actions
- **TaskDetails**: Task editing panel (right side)

## Tailwind
- CSS variables for theming (`--background`, `--foreground`, etc.)
- Dark mode support via `darkMode: ["class"]`
- Radius: `0.5rem` via `--radius` variable
