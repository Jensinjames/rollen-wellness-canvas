

## Plan: Edit Habits from Card Click

The `HabitFormDialog` already supports editing mode (accepts `habit` prop, shows update/delete). The changes needed are minimal wiring:

### 1. `HabitCard` - Add `onEdit` callback prop
- Accept an `onEdit(habit)` callback
- Make the habit name/info area clickable (cursor-pointer) to trigger it
- Keep quick-log buttons working independently (stop propagation)

### 2. `TodayHabits` - Pass `onEdit` through
- Accept and forward `onEdit` callback to each `HabitCard`

### 3. `Habits.tsx` (page) - Manage edit state
- Add `editingHabit` state alongside existing `formOpen`
- When a card is clicked, set `editingHabit` and open the dialog
- Pass the habit to `HabitFormDialog`
- On close, clear `editingHabit`

### 4. `HabitFormDialog` - Reset form when habit changes
- Add `useEffect` to call `form.reset()` with new values when the `habit` prop changes, since `defaultValues` only apply on mount

