# Light Suvara - Admin Panel PRD (Product Requirements Document)

## 📋 Project Overview

### About the Existing Application
**Light Suvara** (formerly "Sunday School App") is a Flutter-based mobile application for managing church/sunday school events across multiple parishes. The app uses Firebase (Firestore, Auth, Storage) as the backend.

### Purpose of Admin Panel
Create a **React-based web admin panel** that allows administrators to manage all aspects of the Light Suvara application, including events, users, notifications, and reports.

---

## 🔥 Firebase Configuration

### Project Details
```
Project ID: sunday-school-8cde8
Auth Domain: sunday-school-8cde8.firebaseapp.com
Storage Bucket: sunday-school-8cde8.firebasestorage.app
Messaging Sender ID: 922341060283
```

### Web App Configuration
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCvXo7_BOOHgs1psB3wweXgl8n1_esGPmQ",
  authDomain: "sunday-school-8cde8.firebaseapp.com",
  projectId: "sunday-school-8cde8",
  storageBucket: "sunday-school-8cde8.firebasestorage.app",
  messagingSenderId: "922341060283",
  appId: "1:922341060283:web:5cd86a8f5cb672f73ac39e"
};
```

---

## 📊 Firestore Database Schema

### Collection: `users`
Stores all user information including admins and schools.

```javascript
// User document structure
{
  uid: "string",                  // Document ID (Firebase Auth UID)
  email: "string",                // User email
  role: "admin" | "school",       // User role
  schoolname: "string",           // School/Parish name (for role='school') - optional
  schoolName: "string",           // Alternative field (handle both) - optional
  fullName: "string",             // Full name - optional
  phoneNumber: "string",          // Contact number - optional
  profileImageUrl: "string",      // Profile picture URL (Firebase Storage) - optional
  createdAt: Timestamp             // Account creation date - optional
}
```

### Collection: `events`
Stores all events created by schools.

```javascript
// Event document structure
{
  id: "string",                   // Document ID (auto-generated)
  title: "string",                // Event title
  description: "string",          // Event description (can be long)
  place: "string",                // Venue/Location
  date: Timestamp,                // Event date
  timestamp: Timestamp,           // Creation/Sort timestamp
  imageUrl: "string",             // Event poster image (Firebase Storage) - optional
  category: "cml" | "suvara",     // Event category
  isPublic: true | false,         // true = Published, false = Draft
  creatorId: "string",            // UID of the creator
  creatorSchoolName: "string"     // Name of the school that created it
}
```

### Collection: `notifications`
Stores targeted notifications sent to specific users or all users.

```javascript
// Notification document structure
{
  id: "string",                   // Document ID (auto-generated)
  title: "string",                // Notification title
  body: "string",                 // Notification message
  timestamp: Timestamp,           // When notification was sent
  recipientId: "string",          // 'all' for broadcast, or specific user UID
  isBroadcast: true | false,      // true if sent to all, false for specific
  isRead: true | false            // Read status (default: false)
}
```

### Collection: `broadcasts`
Stores public announcements visible to everyone.

```javascript
// Broadcast document structure
{
  id: "string",                   // Document ID (auto-generated)
  title: "string",                // Broadcast title
  body: "string",                 // Broadcast message
  timestamp: Timestamp            // When broadcast was sent
}
```

---

## 🔐 Authentication & Authorization

### Admin Detection Logic
```javascript
// Check if current user is admin
const isAdmin = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  return userDoc.exists() && userDoc.data()?.role === 'admin';
};
```

### Access Control Rules
- Only users with `role: 'admin'` can access the admin panel
- Implement Firebase Auth + Firestore role check on every protected route
- Redirect non-admins to a "Not Authorized" page

---

## 📱 Feature Requirements

### 1. Dashboard (Home)
**Route:** `/dashboard`

**Components:**
- Statistics Cards showing:
  - Total Events count
  - Public Events count
  - Draft Events count
  - Total Users count
  - Total Schools count
- Recent Events list (last 5)
- Recent Notifications sent (last 5)

**Implementation:**
```javascript
// Fetch statistics
const fetchStatistics = async () => {
  const eventsSnapshot = await getDocs(collection(db, 'events'));
  const usersSnapshot = await getDocs(collection(db, 'users'));
  
  const totalEvents = eventsSnapshot.size;
  const publicEvents = eventsSnapshot.docs.filter(
    (doc) => doc.data().isPublic === true
  ).length;
  const draftEvents = totalEvents - publicEvents;
  
  const schools = usersSnapshot.docs.filter(
    (doc) => doc.data().role === 'school'
  ).length;
};
```

---

### 2. Event Management
**Route:** `/events`

**Features:**
1. **Event List View**
   - Table/Grid view of all events
   - Columns: Image thumbnail, Title, Category, Status (Public/Draft), Created By, Date, Actions
   - Filter by: Category (ALL, CML, SUVARA), Status (All, Public, Draft)
   - Search by title
   - Sort by: Newest First, Alphabetical, Date

2. **Event Detail View** (`/events/:eventId`)
   - Full event information display
   - Large image preview
   - Edit/Delete buttons

3. **Event Actions**
   - **Publish:** Change `isPublic: false` → `true`
   - **Unpublish:** Change `isPublic: true` → `false`
   - **Edit:** Modify title, description, place, date, category, image
   - **Delete:** Remove event permanently

4. **Create Event** (`/events/new`)
   - Form with: Title, Description, Place, Date/Time picker, Category dropdown, Image upload
   - Image compression before upload (max 400KB recommended)
   - Save as Draft or Publish directly

**Key Functions:**
```javascript
// Publish event
const publishEvent = async (eventId) => {
  await updateDoc(doc(db, 'events', eventId), { isPublic: true });
};

// Delete event
const deleteEvent = async (eventId) => {
  await deleteDoc(doc(db, 'events', eventId));
};

// Delete all events by a specific user
const deleteEventsByUserId = async (userId) => {
  const batch = writeBatch(db);
  const eventsQuery = query(
    collection(db, 'events'),
    where('creatorId', '==', userId)
  );
  const snapshot = await getDocs(eventsQuery);
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};
```

---

### 3. User Management
**Route:** `/users`

**Features:**
1. **User List View**
   - Table showing: Profile Image, Name/School Name, Email, Role, Phone, Actions
   - Filter by role: All, Admin, School
   - Search by name or email

2. **User Detail View** (`/users/:userId`)
   - Full profile information
   - List of events created by this user
   - Activity statistics

3. **User Actions**
   - **View Profile:** See detailed user info
   - **Change Role:** Promote school to admin or demote
   - **Delete User:** Remove user (consider cascade delete of their events)
   - **Reset Password:** Send password reset email

4. **Create User** (`/users/new`)
   - Create new admin or school user
   - Assign role, school name, etc.

**Key Functions:**
```javascript
// Get all users
const getUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Update user role (newRole: 'admin' or 'school')
const updateUserRole = async (userId, newRole) => {
  await updateDoc(doc(db, 'users', userId), { role: newRole });
};

// Get events by user
const getEventsByUser = async (userId) => {
  const q = query(
    collection(db, 'events'),
    where('creatorId', '==', userId)
  );
  return await getDocs(q);
};
```

---

### 4. Notification Management
**Route:** `/notifications`

**Features:**
1. **Send Notification**
   - **Audience Types:**
     - `public` → Goes to `broadcasts` collection (visible to all, no auth needed)
     - `all` → Goes to `notifications` with `recipientId: 'all'` (for logged-in users)
     - `specific` → Multiple notifications to selected schools

   - **Form Fields:**
     - Title (required)
     - Message/Body (required)
     - Audience selector (Radio buttons + School picker for specific)

2. **School Picker (for specific notifications)**
   - Fetch all users with `role: 'school'`
   - Multi-select checkbox list
   - Search by school name

3. **Notification History**
   - List all sent notifications (from both collections)
   - Show: Title, Body preview, Type, Recipient(s), Sent At
   - Delete notification option

**Key Functions:**
```javascript
// Send public broadcast
const sendBroadcast = async (title, body) => {
  await addDoc(collection(db, 'broadcasts'), {
    title,
    body,
    timestamp: serverTimestamp(),
  });
};

// Send to all logged-in users
const sendToAll = async (title, body) => {
  await addDoc(collection(db, 'notifications'), {
    title,
    body,
    timestamp: serverTimestamp(),
    recipientId: 'all',
    isBroadcast: true,
    isRead: false,
  });
};

// Send to specific schools (schoolIds is an array of strings)
const sendToSpecific = async (title, body, schoolIds) => {
  const batch = writeBatch(db);
  schoolIds.forEach((schoolId) => {
    const ref = doc(collection(db, 'notifications'));
    batch.set(ref, {
      title,
      body,
      timestamp: serverTimestamp(),
      recipientId: schoolId,
      isBroadcast: false,
      isRead: false,
    });
  });
  await batch.commit();
};
```

---

### 5. Report Generation
**Route:** `/reports`

**Features:**
1. **Event Report Generator**
   - Select event from dropdown
   - Generate PDF report with:
     - Event title, date, venue
     - Category
     - Creator school name
     - Description
     - Event image (if available)

2. **Analytics Report**
   - Date range selector
   - Events created in period
   - Most active schools
   - Category distribution chart

3. **Export Options**
   - Download as PDF
   - Download as CSV (for tabular data)

**PDF Generation (using jsPDF or react-pdf):**
```javascript
import jsPDF from 'jspdf';

const generateEventReport = async (eventData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Sunday School Event Report', 20, 20);
  
  doc.setFontSize(16);
  doc.text(eventData.title, 20, 40);
  
  doc.setFontSize(12);
  doc.text(`Date: ${formatDate(eventData.date)}`, 20, 55);
  doc.text(`Venue: ${eventData.place}`, 20, 65);
  doc.text(`Category: ${eventData.category.toUpperCase()}`, 20, 75);
  doc.text(`Created By: ${eventData.creatorSchoolName}`, 20, 85);
  
  // Add description with text wrapping
  const splitDescription = doc.splitTextToSize(eventData.description, 170);
  doc.text(splitDescription, 20, 100);
  
  doc.save(`${eventData.title}-report.pdf`);
};
```

---

### 6. Settings
**Route:** `/settings`

**Features:**
1. **Admin Profile**
   - View/Edit own profile
   - Change password

2. **App Configuration** (future scope)
   - Category management
   - Default settings

---

## 🛠️ Technical Stack Recommendations

### Frontend
```json
{
  "framework": "React 18+ with JavaScript",
  "routing": "React Router v6",
  "state": "React Context + useReducer or Zustand",
  "ui": "Material-UI (MUI) v5 or Tailwind CSS + shadcn/ui",
  "forms": "React Hook Form + Yup validation",
  "tables": "TanStack Table (React Table)",
  "charts": "Recharts or Chart.js",
  "pdf": "jsPDF or @react-pdf/renderer",
  "date": "date-fns or dayjs",
  "icons": "Lucide React or Material Icons"
}
```

### Firebase
```json
{
  "firebase": "^10.x",
  "firebase-tools": "CLI for deployment"
}
```

---

## 📁 Recommended Project Structure

```
admin-panel/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── events/
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── EventTable.jsx
│   │   │   └── EventFilters.jsx
│   │   ├── users/
│   │   │   ├── UserTable.jsx
│   │   │   ├── UserCard.jsx
│   │   │   └── SchoolPicker.jsx
│   │   ├── notifications/
│   │   │   ├── NotificationForm.jsx
│   │   │   ├── AudienceSelector.jsx
│   │   │   └── NotificationHistory.jsx
│   │   └── reports/
│   │       ├── ReportGenerator.jsx
│   │       └── AnalyticsCharts.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── EventDetailPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── UserDetailPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── ReportsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── NotAuthorizedPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useEvents.js
│   │   ├── useUsers.js
│   │   ├── useNotifications.js
│   │   └── useFirestore.js
│   ├── services/
│   │   ├── firebase.js          # Firebase initialization
│   │   ├── authService.js       # Auth functions
│   │   ├── eventService.js      # Event CRUD
│   │   ├── userService.js       # User management
│   │   ├── notificationService.js
│   │   └── storageService.js    # Image upload
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env
├── .env.example
├── package.json
├── jsconfig.json
├── vite.config.js
└── README.md
```

---

## 🎨 UI/UX Guidelines

### Color Scheme (matching Flutter app)
```css
:root {
  --primary: #1E40AF;        /* Blue 900 */
  --primary-light: #3B82F6;  /* Blue 500 */
  --primary-bg: #EFF6FF;     /* Blue 50 */
  --success: #22C55E;        /* Green */
  --danger: #EF4444;         /* Red */
  --warning: #F59E0B;        /* Amber */
  --text-primary: #111827;   /* Gray 900 */
  --text-secondary: #6B7280; /* Gray 500 */
  --background: #F9FAFB;     /* Gray 50 */
  --card: #FFFFFF;
}
```

### Typography
- Primary Font: `Poppins` (matching Flutter app)
- Fallback: `Inter, system-ui, sans-serif`

### Component Styling
- Rounded corners: 8px for buttons, 12px for cards, 16px for modals
- Shadows: Subtle shadows for cards and elevated elements
- Consistent spacing: 8px base unit

---

## 🔒 Security Considerations

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check admin status
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || request.auth.uid == userId;
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if true;  // Public events readable by all
      allow create: if request.auth != null;
      allow update, delete: if isAdmin() || 
        resource.data.creatorId == request.auth.uid;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        (resource.data.recipientId == request.auth.uid || 
         resource.data.recipientId == 'all' ||
         isAdmin());
      allow write: if isAdmin();
    }
    
    // Broadcasts
    match /broadcasts/{broadcastId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Project setup (Vite + React + JavaScript)
- [ ] Firebase configuration
- [ ] Authentication flow (Login/Logout)
- [ ] Admin role verification
- [ ] Basic layout (Sidebar, Header)
- [ ] Protected route wrapper

### Phase 2: Dashboard
- [ ] Statistics cards
- [ ] Recent events widget
- [ ] Recent activity widget

### Phase 3: Event Management
- [ ] Event list with filters
- [ ] Event detail view
- [ ] Create/Edit event form
- [ ] Publish/Unpublish functionality
- [ ] Delete event
- [ ] Bulk actions (delete by user)

### Phase 4: User Management
- [ ] User list with filters
- [ ] User detail view
- [ ] Role management
- [ ] User event history

### Phase 5: Notifications
- [ ] Notification composer
- [ ] Audience selector (Public/All/Specific)
- [ ] Multi-school picker
- [ ] Notification history

### Phase 6: Reports
- [ ] Event report PDF generation
- [ ] Analytics dashboard
- [ ] Export functionality

### Phase 7: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Responsive design
- [ ] Performance optimization

---

## 🚀 Deployment

### Firebase Hosting Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Environment Variables
```env
# .env
VITE_FIREBASE_API_KEY=AIzaSyCvXo7_BOOHgs1psB3wweXgl8n1_esGPmQ
VITE_FIREBASE_AUTH_DOMAIN=sunday-school-8cde8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sunday-school-8cde8
VITE_FIREBASE_STORAGE_BUCKET=sunday-school-8cde8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=922341060283
VITE_FIREBASE_APP_ID=1:922341060283:web:5cd86a8f5cb672f73ac39e
```

---

## 📝 Notes for AI Coding Agent

1. **Always check for admin role** before allowing any write operations
2. **Handle both `schoolname` and `schoolName`** fields as the Flutter app uses both
3. **Image uploads should be compressed** before uploading to Firebase Storage
4. **Use batch writes** when performing multiple Firestore operations
5. **Implement optimistic updates** for better UX
6. **Add proper error handling** with user-friendly messages
7. **Use real-time listeners** (`onSnapshot`) for live data updates where appropriate
8. **Follow the existing color scheme** to maintain brand consistency

---

## 🔗 Related Documentation

- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth/web/start)
- [Firebase Storage](https://firebase.google.com/docs/storage/web/start)
- [React Router](https://reactrouter.com/)
- [Material-UI](https://mui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

*Document Version: 1.0*
*Last Updated: November 26, 2025*
*Author: Generated for Light Suvara Admin Panel Development*
