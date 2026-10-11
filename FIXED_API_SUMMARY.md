# API Fix Summary: /api/dos Project Name & Colour Display

## Problem
The `/api/dos` endpoint was joining the `projects` table but not selecting `project_name` and `project_colour`, causing sidebars to not display project names and colour indicators.

## Solution
Added `project_name` and `project_colour` fields to all relevant SELECT statements in `src/pages/api/dos/index.ts`.

## Files Modified
- ✅ `src/pages/api/dos/index.ts` - Added project data to API responses

## Changes Made

### 1. GET /api/dos (Main Query) - Lines 33-49
**Before:**
```typescript
.select({
  id: dos.id,
  title: dos.title,
  description: dos.description,
  project_id: dos.project_id,
  column_id: dos.column_id,
  start_at: dos.start_at,
  end_at: dos.end_at,
  created_at: dos.created_at,
  updated_at: dos.updated_at,
})
```

**After:**
```typescript
.select({
  id: dos.id,
  title: dos.title,
  description: dos.description,
  project_id: dos.project_id,
  column_id: dos.column_id,
  start_at: dos.start_at,
  end_at: dos.end_at,
  created_at: dos.created_at,
  updated_at: dos.updated_at,
  project_name: projects.name,        // ← ADDED
  project_colour: projects.colour,    // ← ADDED
})
```

### 2. POST /api/dos - Lines 213-218
**Before:**
```typescript
.select({ 
  id: dos.id, title: dos.title, description: dos.description, 
  project_id: dos.project_id, column_id: dos.column_id, 
  start_at: dos.start_at, end_at: dos.end_at, 
  created_at: dos.created_at, updated_at: dos.updated_at 
})
.from(dos)
.orderBy(desc(dos.updated_at))
.limit(1);
```

**After:**
```typescript
.select({ 
  id: dos.id, title: dos.title, description: dos.description, 
  project_id: dos.project_id, column_id: dos.column_id, 
  start_at: dos.start_at, end_at: dos.end_at, 
  created_at: dos.created_at, updated_at: dos.updated_at,
  project_name: projects.name,        // ← ADDED
  project_colour: projects.colour     // ← ADDED
})
.from(dos)
.innerJoin(projects, eq(dos.project_id, projects.id))  // ← ADDED JOIN
.orderBy(desc(dos.updated_at))
.limit(1);
```

## API Response Changes

### GET /api/dos now returns:
```json
{
  "id": 1,
  "title": "Complete this task",
  "description": "...",
  "project_id": 123,
  "column_id": 456,
  "start_at": null,
  "end_at": null,
  "created_at": "...",
  "updated_at": "...",
  "project_name": "Marketing Campaign",  // ← NEW
  "project_colour": "#3B82F6"            // ← NEW
}
```

### POST /api/dos now returns:
```json
{
  "success": true,
  "task": {
    ...existing fields...,
    "project_name": "Marketing Campaign",  // ← NEW
    "project_colour": "#3B82F6"           // ← NEW
  }
}
```

## Note on Tags Query (Line ~65)
The `.select()` at line 65 is fetching **tags** for tasks (not projects), so it correctly only includes:
- `do_id`, `id`, `name`, `colour` from the tags/doTags relationship
- This does NOT need project fields

## Testing
1. Restart dev server: `npm run dev`
2. Navigate to `http://localhost:4321`
3. Verify sidebars show:
   - ✅ DO titles with project names underneath
   - ✅ Coloured circles for each project's colour
   - ✅ Proper hover states and text contrast

## Related Fixes in Other Files
- `src/components/Sidebar/doSidebar/DoSidebar.tsx` - Fixed layout typo (line 17)
- `src/styles/global.css` - Added sidebar styling classes
- `src/components/Sidebar/DesktopSidebar.tsx` - Enhanced header styling
- `src/components/Sidebar/MobileSidebar.tsx` - Consistent branding
- `src/components/Sidebar/ProjectsSidebar.tsx` - Improved project item display

---
**Date:** 2026-10-11  
**Status:** ✅ COMPLETE