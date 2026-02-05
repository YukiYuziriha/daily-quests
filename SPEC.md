0) Target: “Google Tasks clone” definition (V1)

V1 must feel like Google Tasks: minimal UI, fast entry, lists on the left, tasks in the middle, task details panel, subtasks via indent, recurring tasks, starred, sorting, completed section. Google’s own docs explicitly call out subtasks, due dates/notifications, repeating tasks, starred tasks, and keyboard shortcuts.

V1 explicitly does NOT include: themes, stats, visual history, tags, priorities, calendar time-blocking, “smart views”, collaboration, cloud sync.

1) Stack (chosen to be “AI-friendly” and low-chaos)
Single codebase approach: PWA-first ✅

This satisfies:

PC browser ✅

“as an app” on desktop ✅ (installed PWA runs in its own window)

Android ✅ (install to homescreen; offline; notifications possible)

Frontend

TypeScript + React + Vite

UI styling: Tailwind (simple + fast to iterate)

Components: Radix UI (or shadcn/ui wrappers) for dialogs/drawers/menus

State: Zustand (small surface area, easy to reason about)

Forms/validation: react-hook-form + zod

Drag & drop ordering: @dnd-kit/core

Dates: date-fns

Persistence (local-first)

IndexedDB via Dexie (super reliable, simple API, works in PWA)

PWA

vite-plugin-pwa (offline cache + installability)

Optional: Web Push / Notifications later (still V1-parity-ish because Tasks uses due dates + notifications)

Testing

Unit: Vitest

E2E: Playwright (drag/drop + keyboard shortcuts are perfect for this)

Why this stack fits your “AI won’t fuck it up” requirement

No backend initially → no auth, no migrations, no sync bugs.

One app → no monorepo gymnastics required.

Dexie schema is dead simple and doesn’t require a server.

(If later you want real native desktop + Play Store packaging, you can wrap the same PWA with Tauri (desktop) and Capacitor (Android), but do not start there.)

2) V1 UX spec (screens + interactions)
Layout (desktop/tablet)

Left sidebar:

App title

List of task lists

“+ New list”

Special view: Starred tasks (Google Tasks has this)

Main column:

Header: current list name + “⋮” menu

“Add a task” input row

Task list (incomplete)

Collapsible “Completed” section at bottom

Right side panel (details drawer/panel):

Title (editable)

Notes/details (textarea)

Due date (date picker; time optional for your app, but keep it simple)

Repeat (day/week/month/year + end conditions)

Star toggle

Subtasks section (add subtask, list subtasks)

Delete task

Mobile layout

Sidebar becomes a slide-out drawer

Details open as full-screen sheet

Core interactions

Add task: type + Enter creates task (like GT)

Click task row → opens details panel

Checkbox toggles complete/incomplete

Drag handle (or long-press on mobile) reorders tasks

“Sort by” in list menu:

My order

Date

Starred recently (or “Recently starred”)

3) V1 Functional spec (what exactly it must do)
3.1 Lists

Create list (name required)

Rename list

Delete list (confirm; deleting list deletes tasks OR moves them to a default list — pick one; GT tends to just delete the list and its tasks)

Reorder lists (optional for V1; can be V1.1)

3.2 Tasks

Each task supports:

Title (required, 1–200 chars)

Notes/details (optional)

Due date (optional)

Repeat rule (optional)

Starred (boolean)

Completed state + completion timestamp

Manual ordering (“My order”)

Delete task (soft delete recommended for future history)

3.3 Subtasks (indent model)

Google Tasks supports subtasks and keyboard indent/outdent.
Rules:

A task may have a parent_id (null = top-level)

Max depth: 3 (or 5). GT feels limited; pick 3 for simplicity.

Subtasks appear directly beneath parent, indented

Completing a parent does NOT auto-complete children (keep simple)

Reordering respects the “block” (parent + its subtree move together) unless you implement advanced behavior later

Indent/outdent behaviors:

Indent: selected task becomes child of previous visible task at same level (if any)

Outdent: selected task becomes sibling of its current parent

3.4 Sorting modes (per list)

My order: use stored manual order

Date: tasks with due dates ordered ascending by due date; tasks without due date go last

Starred recently: starred tasks first, ordered by starred_at desc; non-starred after

3.5 Starred tasks view

A dedicated “Starred tasks” view across all lists exists in Google Tasks.
Spec:

Shows all tasks where starred=true

Can sort by Date or Recently starred

Tapping a task still shows its “primary list” (the list it belongs to)

3.6 Recurring tasks

Google Tasks supports repeating tasks with frequency and end conditions.
Minimal recurrence spec:

Frequencies: DAILY, WEEKLY, MONTHLY, YEARLY

Interval: integer ≥ 1

End: NEVER | ON_DATE | AFTER_N_OCCURRENCES

When completing a recurring task:

Mark current task completed

Immediately create the next occurrence as a new task (same title/notes/star/list/parent, due date advanced)
This is the simplest way to match the “it comes back again” feeling without needing a full occurrences engine.

(Your future “visual history” will love this because it naturally leaves a trail of completed occurrences.)

4) Data model (Dexie / IndexedDB schema)

Use ULIDs for IDs (sortable-ish, easy to generate client-side).

Table: lists

id: string

name: string

created_at: number

updated_at: number

order: number (manual sort in sidebar)

deleted_at?: number

Table: tasks

id: string

list_id: string

parent_id?: string | null

title: string

notes: string

due_date?: string | null (ISO date: “YYYY-MM-DD”)

due_time?: string | null (optional, keep null in V1 if you want GT-ish simplicity)

status: "active" | "completed"

completed_at?: number | null

created_at: number

updated_at: number

deleted_at?: number | null

order: number (manual position among siblings)

starred: boolean

starred_at?: number | null

repeat?: { freq: "DAILY"|"WEEKLY"|"MONTHLY"|"YEARLY", interval: number, ends: "NEVER"|"ON_DATE"|"AFTER", until?: string, count?: number }

Indexes you want:

[list_id+parent_id+status]

[starred+status]

[list_id+due_date]

5) Ordering algorithm (simple + robust)

For “My order”, store order as a number.

When you drag an item between two neighbors:

If both neighbors exist: set order = (prev.order + next.order) / 2

If dropped at top: order = next.order - 1

If dropped at bottom: order = prev.order + 1
If you detect orders getting too dense (difference < 0.0001), renormalize the sibling list to integers 1000, 2000, 3000…

This avoids constant “reindex everything” while staying easy.

6) Keyboard shortcuts (V1 parity)

Google provides an official shortcut list.
Implement at least:

Enter: create task / finish edit

Esc: cancel edit / close details

Space: toggle complete

Ctrl + ] : indent

Ctrl + [ : outdent

Ctrl + ↑ / ↓ : move selection (optional but nice)

“.” or “v”: open “more actions” menu (optional)

Make shortcuts work only when focus is inside the task list component (don’t hijack globally).

7) Non-functional requirements (so it feels “Google-level snappy”)

Instant interactions: optimistic updates (it’s local DB anyway)

Offline-first by default

No blocking renders on 1k+ tasks:

Virtualize task list (optional in V1, but easy win later with react-virtual)

Accessibility:

Tab navigation for list + tasks

ARIA for drawer/menu/dialog

Backups:

Export/import JSON (V1.1 but I recommend it early because local-first needs an escape hatch)

8) “Out of spec” but pre-planned (your themes + visual history)

You can keep V1 clean while designing hooks for V2:

Themes (V2)

settings table:

theme: "light" | "dark" | "system" | "custom"

accent_color, etc.
Tailwind makes this easy with CSS variables.

Visual history (V2)

Add an append-only events table:

id, ts, type, task_id, payload
Types: created, edited, completed, uncompleted, deleted, starred, unstarred, moved, repeated_spawned…

Then you can build:

Calendar heatmap (“tasks completed per day”)

Timeline per list / per tag (if you add tags later)

Streaks and graphs (your “motivational telemetry” 😈)
