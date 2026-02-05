# Task Features

## Recurring Tasks
- Frequencies: DAILY, WEEKLY, MONTHLY, YEARLY
- Interval: integer ≥ 1
- End conditions: NEVER, ON_DATE, AFTER_N_OCCURRENCES

**On Completion:**
- Mark current task `completed`, set `completed_at`
- Create NEW task as next occurrence
- Advance due date based on frequency
- Keeps all historical occurrences (audit trail)

## Subtasks (Indentation)
- Max depth: 3 levels
- Stored flat with `parent_id`
- Indent: task becomes child of previous sibling
- Outdent: task becomes sibling of current parent
- Tree built at runtime via `buildTaskTree()`

## Sorting Modes
- **My order**: Uses stored `order` field
- **Date**: Tasks with due dates first (ascending), no due date last
- **Starred recently**: Starred tasks first by `starred_at` desc

## Completed Tasks
- Stored in same table with `status = 'completed'`
- Removed from active task list
- `getCompleted()` for historical view
