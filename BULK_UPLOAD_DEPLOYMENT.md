# Bulk User Upload - Deployment Guide

## Overview

The bulk user upload feature has been updated to securely create Firebase Auth users using Cloud Functions. This ensures passwords are handled securely on the backend using the Firebase Admin SDK.

## What Changed

### 1. CSV Template Now Includes Password
- Template file: `user_upload_template.csv`
- Columns: `email,fullName,role,schoolName,phoneNumber,password`
- Sample row: `teacher@example.com,John Doe,school,St. Marys School,1234567890,ChangeMe123!`

### 2. Backend Processing (New)
- Created Cloud Function `bulkCreateUsers` that:
  - Creates Firebase Auth accounts with passwords
  - Stores user profiles in Firestore (WITHOUT passwords)
  - Validates admin permissions
  - Returns detailed success/failure information

### 3. Frontend Updates
- `src/pages/users/Users.tsx`: Updated to handle Cloud Function responses
- `src/features/users/services/userService.ts`: Calls Cloud Function instead of direct Firestore writes
- `src/config/firebase.ts`: Added Firebase Functions initialization

## Deployment Steps

### Step 1: Install Cloud Functions Dependencies

```powershell
cd functions
npm install
```

### Step 2: Build Cloud Functions

```powershell
npm run build
```

### Step 3: Deploy Cloud Functions

Make sure you're logged in to Firebase:
```powershell
firebase login
```

Deploy the functions:
```powershell
firebase deploy --only functions
```

**Note**: You may need to enable billing on your Firebase project for Cloud Functions.

### Step 4: Verify Deployment

After deployment, you should see:
```
✔  functions[bulkCreateUsers(us-central1)] Successful create operation.
```

### Step 5: Test the Feature

1. Log in as an admin user
2. Navigate to Users section
3. Click "Bulk Upload"
4. Download the CSV template
5. Fill in user details (including passwords)
6. Upload the CSV file
7. Verify users are created in Firebase Auth and Firestore

## Security Features

✅ **Passwords never stored in Firestore** - Only in Firebase Auth
✅ **Admin-only access** - Function checks caller's role
✅ **Password validation** - Minimum 6 characters
✅ **Email validation** - Proper format checking
✅ **Detailed error reporting** - Know exactly which users failed and why

## Local Development (Optional)

To test functions locally:

```powershell
cd functions
npm run serve
```

Then add to your Firebase config in development:
```typescript
import { connectFunctionsEmulator } from 'firebase/functions';
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
```

## Troubleshooting

### "Billing account not configured"
- Enable billing in Firebase Console
- Cloud Functions require the Blaze plan

### "Permission denied"
- Ensure you're logged in as an admin user
- Check Firestore rules allow admin access

### "Function not found"
- Verify deployment completed successfully
- Check function name matches in code: `bulkCreateUsers`

### Users not appearing
- Check Firebase Console > Authentication
- Check Firestore > users collection
- Review function logs: `firebase functions:log`

## Cost Considerations

Firebase Cloud Functions pricing:
- 2 million invocations/month free
- Each bulk upload = 1 invocation
- Additional invocations: $0.40 per million

For most applications, this feature will remain within free tier limits.

## Next Steps

After deployment, you can:
1. Test with sample CSV data
2. Monitor function logs for errors
3. Adjust validation rules if needed
4. Add email notifications for new users (future enhancement)

## Support

For issues or questions:
- Check function logs: `firebase functions:log`
- Review Firebase Console > Functions section
- Verify Firestore security rules allow admin operations
