# Firebase Index Setup

You need to create the Firebase composite index for the events collection to fix the EventApprovals query.

## Option 1: Deploy via Firebase CLI (Recommended)

```bash
firebase deploy --only firestore:indexes
```

This will deploy the indexes defined in `firestore.indexes.json`.

## Option 2: Create via Firebase Console

Click on this link to create the index automatically:
[Create Index](https://console.firebase.google.com/v1/r/project/sunday-school-8cde8/firestore/indexes?create_composite=ClJwcm9qZWN0cy9zdW5kYXktc2Nob29sLThjZGU4L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ldmVudHMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaDQoJdGltZXN0YW1wEAIaDAoIX19uYW1lX18QAg)

Or manually create it in Firebase Console:
1. Go to Firebase Console > Firestore Database > Indexes
2. Click "Create Index"
3. Collection: `events`
4. Fields to index:
   - `status` (Ascending)
   - `timestamp` (Descending)
5. Click "Create"

The index will take a few minutes to build. Once complete, the EventApprovals page will work without errors.
