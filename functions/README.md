# Firebase Cloud Functions

This directory contains the backend Cloud Functions for secure user management operations.

## Features

- **Bulk User Creation**: Securely creates Firebase Auth users with passwords using the Admin SDK
- **Role-based Access**: Only admin users can call the bulk create function
- **Data Validation**: Validates email format, password strength, and required fields
- **Error Handling**: Returns detailed success/failure information for each user

## Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Deploy to Firebase

Deploy all functions:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:bulkCreateUsers
```

### 3. Test Locally (Optional)

Start the Firebase emulator:
```bash
cd functions
npm run serve
```

Then update your frontend Firebase config to use the emulator:
```typescript
import { connectFunctionsEmulator } from 'firebase/functions';
connectFunctionsEmulator(functions, 'localhost', 5001);
```

## Functions

### bulkCreateUsers

Creates multiple Firebase Auth users and their Firestore profiles from CSV data.

**Permissions**: Requires authenticated admin user

**Input**:
```typescript
{
  users: Array<{
    email: string;
    password: string;
    role: "admin" | "school";
    fullName?: string;
    schoolName?: string;
    phoneNumber?: string;
  }>
}
```

**Output**:
```typescript
{
  success: boolean;
  created: number;
  failed: number;
  errors: Array<{
    email: string;
    error: string;
  }>
}
```

**Security**:
- Passwords are never stored in Firestore
- Only admin users can create bulk users
- All operations are logged for auditing

## Development

Build TypeScript:
```bash
npm run build
```

Watch mode:
```bash
tsc --watch
```

View logs:
```bash
npm run logs
```

## Notes

- Node.js 18 is required for these functions
- Make sure your Firebase project billing is enabled for Cloud Functions
- The first deployment may take a few minutes
