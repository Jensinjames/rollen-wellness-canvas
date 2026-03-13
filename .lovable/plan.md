

## Diagnosis: Blank Screen

The most likely cause is the **service worker caching stale content**. The current `sw.js` caches `/index.html` on install and serves assets cache-first. After a deployment with new hashed JS/CSS filenames, the SW can serve an old `index.html` that references non-existent asset files, causing a blank screen.

A secondary issue is **duplicate auth providers**: `main.tsx` wraps in `AuthProvider` while `App.tsx` wraps in `UnifiedAuthProvider`. Some components import `useAuth` from `AuthContext`, others from `UnifiedAuthContext`. This redundancy is messy but shouldn't cause a blank screen on its own.

---

## Plan

### 1. Fix the service worker (root cause of blank screen)

**`public/sw.js`**: Remove the pre-caching of `/` and `/index.html` from the install event. For navigation requests, switch to **network-only** (no caching of HTML). For assets, keep stale-while-revalidate but add proper cache-busting by including the URL hash in cache matching.

Key change: Navigation requests should always go to network, never serve from cache. This prevents stale HTML from referencing deleted JS chunks.

### 2. Remove duplicate AuthProvider in `main.tsx`

**`src/main.tsx`**: Remove the `AuthProvider` wrapper. The app already uses `UnifiedAuthProvider` inside `App.tsx`, so this outer wrapper is unnecessary.

### 3. Unify `useAuth` imports across the codebase

Update these files to import `useAuth` from `UnifiedAuthContext` instead of `AuthContext`:
- `src/components/settings/SystemSettings.tsx`
- `src/components/UserProfile.tsx`
- `src/components/calendar/ActivityModal.tsx`
- `src/hooks/useRealtimeActivities.ts`
- `src/components/settings/PreferencesSettings.tsx`
- `src/components/forms/RefactoredActivityEntryForm.tsx`
- `src/hooks/useSleepEntries.ts`
- `src/hooks/useHabitLogs.ts`
- `src/hooks/useActivities.ts` (if applicable)
- `src/hooks/useDailyScores.ts` (if applicable)

---

### Technical details

The service worker fix changes the fetch handler for navigation from network-first-with-cache-fallback to network-only. This ensures the latest `index.html` (with correct asset hashes) is always served. Static assets (`/assets/*`) remain cache-first since they have content hashes in their filenames.

The auth unification removes the unused `AuthProvider` from `main.tsx` and standardizes all imports to use `UnifiedAuthContext`, eliminating the risk of a component trying to access the wrong context.

