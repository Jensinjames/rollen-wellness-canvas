

## Habit Tracking UI - Implementation Plan

### What Exists
- **Database**: `habits` table (name, description, target_value, target_unit, is_active) and `habit_logs` table (habit_id, log_date, value, notes) with full RLS
- **Hooks**: `useHabits`, `useCreateHabit`, `useHabitLogs`, `useCreateHabitLog` -- all functional
- **Form**: `HabitLogForm` exists but references a non-existent `completed` field (DB only has `value`)
- **No dedicated page or route** for habits

### What To Build

#### 1. Add `/habits` route and sidebar link
- New `src/pages/Habits.tsx` page with sidebar layout (matching existing pages)
- Add "Habits" nav item to `Sidebar.tsx` with `CheckSquare` icon

#### 2. Habits page with three sections

**Section A - Today's Habits (top)**
- Grid of habit cards showing today's status
- Each card: habit name, target (e.g. "8 glasses"), today's logged value, quick-log button
- One-click logging: tap a habit to log value=1 (or enter custom value for measurable habits)
- Visual check/uncheck state based on whether a log exists for today

**Section B - Streak Calendar (middle)**
- Heatmap-style grid showing last 90 days per habit
- Color intensity based on completion (value >= target_value = complete)
- Current streak count and longest streak displayed per habit

**Section C - Progress Charts (bottom)**
- Bar chart: daily completion rate over last 30 days (how many habits completed / total)
- Line chart: per-habit trend over time using Recharts

#### 3. Create/Edit Habit Dialog
- Form fields: name, description, target_value, target_unit, is_active toggle
- Used for both create and edit (reuse pattern from CategoryForm)

#### 4. Hook additions
- `useUpdateHabit` and `useDeleteHabit` mutations in `useHabits.ts`
- Fix `useHabitLogs` interface to match DB schema (no `completed` field -- use `value >= target` logic)
- `useHabitStreaks` hook: compute streaks client-side from habit_logs data

#### 5. Fix HabitLogForm
- Remove `completed` field references; use `value` field directly (matching DB schema)
- The "completed" concept = `value >= target_value` (or `value >= 1` for boolean habits)

### Technical Details

**Files to create:**
- `src/pages/Habits.tsx` - main page
- `src/components/habits/TodayHabits.tsx` - today's checklist grid
- `src/components/habits/HabitCard.tsx` - individual habit card with quick-log
- `src/components/habits/HabitFormDialog.tsx` - create/edit dialog
- `src/components/habits/HabitStreakCalendar.tsx` - 90-day heatmap
- `src/components/habits/HabitProgressCharts.tsx` - Recharts bar/line charts
- `src/hooks/useHabitStreaks.ts` - streak calculation

**Files to modify:**
- `src/App.tsx` - add `/habits` route
- `src/components/Sidebar.tsx` - add nav item
- `src/hooks/useHabits.ts` - add update/delete mutations
- `src/hooks/useHabitLogs.ts` - fix interface, remove `completed` field
- `src/components/forms/HabitLogForm.tsx` - fix to use `value` instead of `completed`

**No database changes needed** - existing schema supports everything.

