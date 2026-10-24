# Archived Feature: Kalolsavam (കലോത്സവം)

## Status: Archived
Per stakeholder feedback, the Kalolsavam module is currently not required and has been archived so it is completely removed from the active application UI and routes while preserving the full implementation for future reactivation.

---

## What was built:
1. **Kalolsavam Management Dashboard (`src/pages/kalolsavam/Kalolsavam.tsx`)**:
   - Festival status & announcements (Live on mobile app toggle, banner announcements).
   - Stages management (Stage numbering, current event, current chest number, venue, judge controls).
   - Event Programs schedule & point tracking (Single / Group, categories, maximum points, schedule times).
   - Participant list & chest number management.
   - Live Results publication & PDF attachment viewing.
   - Comprehensive championship point tally by parish / forane / team.

2. **Dialog Components (`src/features/kalolsavam/components/`)**:
   - `StageFormDialog.tsx`: Create / edit stages.
   - `ProgramFormDialog.tsx`: Create / edit program items.
   - `KalolsavamUserFormDialog.tsx`: Register / edit participants and assign chest numbers.
   - `LiveStageControlDialog.tsx`: Real-time stage monitor and chest number progression.
   - `ResultUploadDialog.tsx`: Upload result sheets and declare winners.
   - `LiveDisplayBoard.tsx`: Stage-side digital display board for live announcements.

3. **Backend Service (`src/features/kalolsavam/services/kalolsavamService.ts`)**:
   - Firestore real-time listeners and CRUD operations for:
     - `kalolsavam_settings`
     - `kalolsavam_stages`
     - `kalolsavam_programs`
     - `kalolsavam_users`
     - `kalolsavam_results`
   - Firebase Storage integration for PDF results.

---

## How to Restore / Reactivate:

### Option 1: Using the Dedicated Git Branch (Recommended)
The full working state has been committed to the git branch:
```bash
git checkout archive/kalolsavam
```
You can also merge or cherry-pick it back into `main`:
```bash
git checkout main
git cherry-pick 4dbca36
```

### Option 2: Applying the Git Patch
An intact patch file is preserved right in this directory:
```bash
git apply archive/kalolsavam/kalolsavam.patch
```

---
*Archived on: October 2026*
