# Light Suvara - Admin Web Panel PRD

**Version:** 2.0  
**Last Updated:** January 1, 2026  
**Product Name:** Light Suvara Admin Panel  
**Platform:** Web Application (React-based)  
**Backend:** Firebase (Firestore, Auth, Storage, Cloud Messaging)  

---

## 📋 Executive Summary

The Light Suvara Admin Panel is a comprehensive **React-based web administration system** designed to provide centralized management of the Light Suvara Sunday School mobile application ecosystem. This admin panel empowers administrators with complete control over events, users, programs, animator assignments, registrations, marks, and notifications for organizations under CML (Christian Mission League) and SUVARA.

### Key Admin Capabilities
| Capability | Description |
|------------|-------------|
| **Event Management** | Create, edit, publish/unpublish, and delete events across all schools |
| **User Administration** | Manage all user roles: Admin, Parish, School, Animator |
| **Program Configuration** | Create educational programs and configure registration periods |
| **Question Bank** | Define assessment questions with marks allocation |
| **Animator Management** | Create animators and assign them to schools (max 2 per animator) |
| **Registration Oversight** | Monitor all registrations across parishes with status tracking |
| **Marks & Assessment** | View all marks submissions and generate PDF reports |
| **Broadcast System** | Send targeted or mass notifications to mobile app users |
| **Analytics & Reporting** | Track metrics, generate reports, and export data |

---

## 🎯 Product Vision & Goals

### Vision
To provide administrators with a powerful, intuitive web interface for complete management of the Light Suvara ecosystem, enabling efficient oversight of Sunday School operations across multiple parishes and schools.

### Primary Goals
1. **Centralized Control** - Single dashboard for all administrative operations
2. **Real-time Monitoring** - Live view of events, registrations, and user activities
3. **Efficient Workflows** - Streamlined processes for common admin tasks
4. **Comprehensive Reporting** - Detailed analytics and exportable reports
5. **Secure Access** - Role-based access control with admin-only features
6. **Mobile App Sync** - Seamless data synchronization with Flutter mobile app

---

## 👤 Target User: System Administrator

### Admin Profile
| Attribute | Details |
|-----------|---------|
| **Role** | Super Administrator |
| **Technical Level** | Basic to intermediate computer literacy |
| **Access Method** | Web browser (Chrome, Firefox, Edge, Safari) |
| **Primary Device** | Desktop/Laptop |
| **Secondary Device** | Tablet |

### Admin Responsibilities Matrix

| Module | Create | Read | Update | Delete | Special Actions |
|--------|--------|------|--------|--------|-----------------|
| **Events** | ✅ | ✅ | ✅ | ✅ | Publish/Unpublish, Bulk Delete |
| **Users** | ✅ | ✅ | ✅ | ✅ | Change Role, Reset Password |
| **Parish Users** | ✅ | ✅ | ✅ | ✅ | Link to Schools |
| **Animators** | ✅ | ✅ | ✅ | ✅ | Assign Schools (max 2) |
| **Programs** | ✅ | ✅ | ✅ | ✅ | Activate/Deactivate |
| **Questions** | ✅ | ✅ | ✅ | ✅ | Set Order, Max Marks |
| **Registrations** | ❌ | ✅ | ❌ | ❌ | Override Status, Export |
| **Marks** | ❌ | ✅ | ❌ | ❌ | Download Reports |
| **Notifications** | ✅ | ✅ | ❌ | ✅ | Send Broadcasts |
| **Analytics** | ❌ | ✅ | ❌ | ❌ | Export Reports |

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

## 🛠️ Technical Stack

### Frontend Architecture
```json
{
  "framework": "React 18+ with JavaScript/TypeScript",
  "bundler": "Vite",
  "routing": "React Router v6",
  "state": "React Context + useReducer or Zustand",
  "ui": "Material-UI (MUI) v5 or Tailwind CSS + shadcn/ui",
  "forms": "React Hook Form + Yup/Zod validation",
  "tables": "TanStack Table (React Table)",
  "charts": "Recharts or Chart.js",
  "pdf": "jsPDF or @react-pdf/renderer",
  "date": "date-fns or dayjs",
  "icons": "Lucide React or Material Icons"
}
```

### Firebase SDK
```json
{
  "firebase": "^10.x",
  "firebase-tools": "CLI for deployment"
}
```

### Environment Variables
```env
VITE_FIREBASE_API_KEY=AIzaSyCvXo7_BOOHgs1psB3wweXgl8n1_esGPmQ
VITE_FIREBASE_AUTH_DOMAIN=sunday-school-8cde8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sunday-school-8cde8
VITE_FIREBASE_STORAGE_BUCKET=sunday-school-8cde8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=922341060283
VITE_FIREBASE_APP_ID=1:922341060283:web:5cd86a8f5cb672f73ac39e
```

---

## 📊 Database Schema (Firestore)

### Collection: `users`
Stores all user accounts.

```javascript
{
  uid: "string",                    // Document ID (Firebase Auth UID)
  email: "string",                  // User email
  role: "admin" | "school" | "animator" | "parish", // User role
  schoolname: "string",             // School name (legacy field)
  schoolName: "string",             // School name (alternative)
  fullName: "string",               // Full name
  phoneNumber: "string",            // Contact number
  profileImageUrl: "string",        // Profile picture URL
  createdAt: Timestamp,             // Account creation date
  parish: "string",                 // Parish name
  parishId: "string",               // Linked parish user ID (for schools)
  schoolId: "string",               // Linked school ID (for parish users)
  forane: "string"                  // Forane/region
}
```

**Admin Operations:**
- Query all users by role
- Create new users with any role
- Update user roles
- Delete users (cascade delete their events)
- Search by name/email/school

---

### Collection: `events`
Stores all events created by schools and admins.

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  title: "string",                  // Event title
  description: "string",            // Event description
  place: "string",                  // Venue/Location
  date: Timestamp,                  // Event date
  timestamp: Timestamp,             // Creation timestamp (for sorting)
  imageUrl: "string",               // Event poster image URL
  category: "cml" | "suvara",       // Event category
  isPublic: true | false,           // Published (true) or Draft (false)
  creatorId: "string",              // UID of the creator
  creatorSchoolName: "string"       // Name of the school that created it
}
```

**Admin Operations:**
- View all events (public and draft)
- Create new events
- Edit any event
- Publish/Unpublish events
- Delete events (single or bulk by creator)
- Filter by category, status, date range
- Search by title

---

### Collection: `notifications`
Stores targeted notifications sent to users.

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  title: "string",                  // Notification title
  body: "string",                   // Notification message
  timestamp: Timestamp,             // When notification was sent
  recipientId: "string",            // 'all' for broadcast, or specific user UID
  isBroadcast: true | false,        // true if sent to all logged-in users
  isRead: true | false              // Read status (default: false)
}
```

**Admin Operations:**
- Send to all logged-in users (`recipientId: 'all'`)
- Send to specific schools (multiple notifications)
- View notification history
- Delete notifications

---

### Collection: `broadcasts`
Stores public announcements visible to all (even non-authenticated).

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  title: "string",                  // Broadcast title
  body: "string",                   // Broadcast message
  timestamp: Timestamp,             // When broadcast was created
  category: "cml" | "suvara" | "all" // Target audience category
}
```

**Admin Operations:**
- Create public broadcasts (visible without login)
- View broadcast history
- Delete broadcasts

---

### Collection: `programs`
Stores educational programs for student registration.

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  name: "string",                   // Program name
  startDate: Timestamp,             // Program start date
  endDate: Timestamp,               // Registration deadline
  isActive: true | false,           // Whether program is currently active
  createdAt: Timestamp              // Creation timestamp
}
```

**Admin Operations:**
- Create new programs
- Edit program details (name, dates)
- Activate/Deactivate programs
- Delete programs
- View registration counts per program

---

### Collection: `program_registrations`
Stores student registrations for programs.

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  programId: "string",              // Reference to program
  programName: "string",            // Program name (denormalized)
  studentName: "string",            // Student's name
  studentPhone: "string",           // Student's phone number
  schoolUserId: "string",           // School user who registered
  schoolName: "string",             // School name (denormalized)
  parishUserId: "string",           // Parish user ID for approval
  status: "pending_parish" | "approved_parish" | "locked" | "rejected",
  submittedAt: Timestamp,           // Submission timestamp
  approvedAt: Timestamp             // Approval timestamp (optional)
}
```

**Registration Status Flow:**
```
pending_parish → approved_parish → locked
      ↓
   rejected
```

**Admin Operations:**
- View all registrations (read-only typically)
- Filter by program, status, school, parish
- Export to CSV/Excel
- Override status (if needed)
- Analytics on approval rates

---

### Collection: `questions`
Stores assessment questions for the Faith Formation program.

```javascript
{
  id: "string",                     // Document ID (auto-generated)
  text: "string",                   // Question text
  maxMarks: number,                 // Maximum marks (default: 10)
  order: number                     // Display order (1, 2, 3...)
}
```

**Admin Operations:**
- Create new questions
- Edit question text and max marks
- Reorder questions
- Delete questions
- View question-wise performance analytics

---

### Collection: `animator_assignments`
Stores animator assignments to schools.

```javascript
{
  id: "string",                     // Document ID = animator UID
  animatorName: "string",           // Animator's name
  animatorEmail: "string",          // Animator's email
  assignments: [                    // Array of assignments (max 2)
    {
      unitId: "string",             // Unique assignment ID
      schoolUserId: "string",       // School user ID
      schoolname: "string",         // School name
      parish: "string",             // Parish name
      forane: "string",             // Forane/region
      year: "string"                // Assignment year
    }
  ]
}
```

**Admin Operations:**
- View all animators with assignments
- Add assignment (max 2 per animator)
- Remove assignment
- Reassign schools
- View unassigned schools

---

### Collection: `marks`
Stores assessment marks entered by animators.

```javascript
{
  id: "string",                     // Document ID (composite key)
  unitId: "string",                 // Assignment unit ID
  schoolId: "string",               // School user ID
  parish: "string",                 // Parish name
  sundaySchool: "string",           // Sunday School name
  animatorId: "string",             // Animator user ID
  animatorName: "string",           // Animator name
  year: "string",                   // Assessment year
  marks: {                          // Map of question ID to marks
    "questionId": number
  },
  remarks: "string",                // General remarks/comments
  pdfUrl: "string",                 // Uploaded PDF URL (optional)
  locked: true | false,             // Whether marks are finalized
  submittedAt: Timestamp            // Submission timestamp
}
```

**Admin Operations:**
- View all marks submissions
- Filter by year, parish, school
- Search by school/animator name
- View detailed breakdown
- Download PDF reports
- Analytics on completion and scores

---

## 🖥️ Admin Panel Modules & Features

### 1. 🔐 Authentication Module

**Route:** `/login`

#### Features
- Email/password login via Firebase Auth
- Admin role verification after login
- Redirect non-admins to "Not Authorized" page
- Session persistence with auto-refresh
- Logout functionality

#### Admin Detection Logic
```javascript
const isAdmin = async () => {
  const user = auth.currentUser;
  if (!user) return false;
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  return userDoc.exists() && userDoc.data()?.role === 'admin';
};
```

#### Protected Route Wrapper
```javascript
const ProtectedRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/not-authorized" />;
  
  return children;
};
```

---

### 2. 📊 Dashboard Module

**Route:** `/dashboard`

#### Statistics Cards
| Metric | Description | Data Source |
|--------|-------------|-------------|
| Total Events | Count of all events | `events` collection |
| Published Events | Events with `isPublic: true` | `events` collection |
| Draft Events | Events with `isPublic: false` | `events` collection |
| Total Users | All registered users | `users` collection |
| Schools | Users with `role: 'school'` | `users` collection |
| Animators | Users with `role: 'animator'` | `users` collection |
| Parish Users | Users with `role: 'parish'` | `users` collection |
| Active Programs | Programs with `isActive: true` | `programs` collection |
| Total Registrations | All program registrations | `program_registrations` collection |
| Pending Approvals | Registrations with `status: 'pending_parish'` | `program_registrations` collection |

#### Dashboard Widgets
1. **Statistics Grid** - Key metrics at a glance
2. **Recent Events** - Last 5 created events
3. **Recent Registrations** - Last 10 registrations with status
4. **Pending Approvals Alert** - Count of items needing attention
5. **Quick Actions** - Shortcuts to common tasks
6. **Activity Timeline** - Recent admin actions (future)

---

### 3. 📅 Event Management Module

**Routes:**
- `/events` - Event list
- `/events/new` - Create event
- `/events/:id` - Event detail/edit

#### 3.1 Event List View

**Table Columns:**
| Column | Type | Sortable | Filterable |
|--------|------|----------|------------|
| Image | Thumbnail | No | No |
| Title | Text | Yes | Search |
| Category | Badge (CML/SUVARA) | Yes | Dropdown |
| Status | Badge (Public/Draft) | Yes | Dropdown |
| Created By | Text | Yes | Search |
| Event Date | Date | Yes | Date Range |
| Created At | Date | Yes | Date Range |
| Actions | Buttons | No | No |

**Filter Options:**
- Category: ALL, CML, SUVARA
- Status: All, Public, Draft
- Date Range: Start/End pickers
- Search: Title, Creator name

**Sorting Options:**
- Newest First (default)
- Oldest First
- Alphabetical (A-Z)
- Alphabetical (Z-A)
- Event Date (Upcoming)

**Actions Per Row:**
- 👁️ View Details
- ✏️ Edit
- ✅/❌ Publish/Unpublish
- 🗑️ Delete

**Bulk Actions:**
- Delete selected events
- Publish selected events
- Unpublish selected events

#### 3.2 Create/Edit Event Form

**Form Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Title | Text Input | ✅ | Min 5 chars |
| Description | Textarea (Rich) | ✅ | Min 20 chars |
| Place/Venue | Text Input | ✅ | Min 3 chars |
| Event Date | Date Picker | ✅ | Future date preferred |
| Category | Dropdown | ✅ | CML or SUVARA |
| Image | File Upload | ❌ | Max 5MB, JPG/PNG |
| Status | Toggle | ✅ | Draft/Published |

**Image Handling:**
- Client-side compression before upload
- Max file size: 5MB (compressed to ~400KB)
- Supported formats: JPG, PNG, WebP
- Firebase Storage upload with progress indicator
- Image preview before submit

#### 3.3 Event Detail View

**Display:**
- Large image preview
- Full title and description
- Event metadata (date, location, category)
- Creator information
- Publication status
- Creation/modification timestamps

**Actions:**
- Edit Event
- Publish/Unpublish
- Delete Event
- View Creator's Other Events

---

### 4. 👥 User Management Module

**Routes:**
- `/users` - User list
- `/users/new` - Create user
- `/users/:id` - User detail

#### 4.1 User List View

**Table Columns:**
| Column | Type | Sortable | Filterable |
|--------|------|----------|------------|
| Avatar | Image | No | No |
| Name | Text | Yes | Search |
| Email | Text | Yes | Search |
| Role | Badge | Yes | Dropdown |
| School/Parish | Text | Yes | Search |
| Phone | Text | No | No |
| Created | Date | Yes | Date Range |
| Actions | Buttons | No | No |

**Filter by Role:**
- All Users
- Admins
- Schools
- Animators
- Parish Users

**Actions Per Row:**
- 👁️ View Profile
- ✏️ Edit
- 🔄 Change Role
- 🔑 Reset Password
- 🗑️ Delete

#### 4.2 Create User Form

**Form Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Email | Email Input | ✅ | Must be unique |
| Password | Password | ✅ | Min 8 chars |
| Full Name | Text | ✅ | |
| Role | Dropdown | ✅ | admin/school/animator/parish |
| School Name | Text | Conditional | Required for school role |
| Parish | Text | Conditional | Required for school role |
| Forane | Text | ❌ | |
| Phone | Phone Input | ❌ | |
| Link to Parish | User Picker | Conditional | For schools, select parish user |
| Link to School | User Picker | Conditional | For parish users, select school |

**Role-Specific Fields:**
- **School**: schoolname, parish, forane, parishId (link)
- **Parish**: name, schoolId (link to school)
- **Animator**: fullName, (assignments managed separately)
- **Admin**: fullName only

#### 4.3 User Detail View

**Sections:**
1. **Profile Info** - Avatar, name, email, role, contact
2. **Linked Entities** - Parish link (for schools), School link (for parish)
3. **Events Created** - List of events by this user (for schools)
4. **Activity Stats** - Events count, registrations count
5. **Account Actions** - Change role, reset password, delete

---

### 5. 🎓 Program Management Module

**Routes:**
- `/programs` - Program list
- `/programs/new` - Create program
- `/programs/:id` - Program detail

#### 5.1 Program List View

**Table Columns:**
| Column | Type | Sortable |
|--------|------|----------|
| Program Name | Text | Yes |
| Start Date | Date | Yes |
| End Date | Date | Yes |
| Status | Badge (Active/Inactive) | Yes |
| Registrations | Count | Yes |
| Actions | Buttons | No |

**Status Indicators:**
- 🟢 **Active & Open** - Within date range, accepting registrations
- 🟡 **Active & Closed** - Active but past end date
- 🔴 **Inactive** - Manually deactivated

**Actions:**
- ✏️ Edit
- ✅/❌ Activate/Deactivate
- 📊 View Registrations
- 🗑️ Delete

#### 5.2 Create/Edit Program Form

**Form Fields:**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Program Name | Text | ✅ | Min 5 chars |
| Start Date | Date Picker | ✅ | |
| End Date | Date Picker | ✅ | Must be after start |
| Is Active | Toggle | ✅ | Default: true |

#### 5.3 Program Registration View

**Route:** `/programs/:id/registrations`

**Grouped View:**
```
Program: [Program Name]
├── Parish: [Parish Name 1]
│   ├── School: [School Name A]
│   │   ├── Student 1 - Approved ✅
│   │   ├── Student 2 - Pending ⏳
│   │   └── Student 3 - Rejected ❌
│   └── School: [School Name B]
│       └── Student 4 - Locked 🔒
└── Parish: [Parish Name 2]
    └── ...
```

**Export Options:**
- Export to CSV
- Export to Excel
- Export to PDF

---

### 6. ❓ Question Bank Module

**Routes:**
- `/questions` - Question list
- `/questions/new` - Create question

#### 6.1 Question List View

**Features:**
- Drag-and-drop reordering
- Inline editing
- Max marks display
- Delete confirmation

**Table Columns:**
| Column | Type | Editable |
|--------|------|----------|
| Order | Number | Drag |
| Question Text | Text | Inline |
| Max Marks | Number | Inline |
| Actions | Buttons | No |

#### 6.2 Create/Edit Question

**Form Fields:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| Question Text | Textarea | ✅ | |
| Max Marks | Number | ✅ | 10 |
| Order | Number | ✅ | Auto (next) |

---

### 7. 👨‍🏫 Animator Management Module

**Routes:**
- `/animators` - Animator dashboard
- `/animators/create` - Create animator account
- `/animators/:id/assign` - Manage assignments

#### 7.1 Animator Dashboard

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Animator Overview                                         │
├─────────────────────────────────────────────────────────────┤
│ Total Animators: 25  │  Assigned: 20  │  Unassigned: 5      │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Animator: John Doe                                       ││
│ │ Email: john@example.com                                  ││
│ │ Assignments (2/2):                                       ││
│ │   1. St. Mary's School - Sacred Heart Parish             ││
│ │   2. Holy Cross School - St. Thomas Parish               ││
│ │ [Manage Assignments] [View Marks]                        ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Animator: Jane Smith                                     ││
│ │ Email: jane@example.com                                  ││
│ │ Assignments (1/2):                                       ││
│ │   1. Christ School - Divine Mercy Parish                 ││
│ │ [Manage Assignments] [View Marks]                        ││
│ └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### 7.2 Create Animator

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | ✅ |
| Email | Email | ✅ |
| Password | Password | ✅ |
| Phone | Phone | ❌ |

**Process:**
1. Create Firebase Auth account
2. Create user document with `role: 'animator'`
3. Create empty `animator_assignments` document

#### 7.3 Assignment Manager

**Features:**
- View current assignments (0-2)
- Add new assignment (if < 2)
- Remove assignment
- School picker with search
- Shows unassigned schools only

**Add Assignment Form:**
| Field | Type | Source |
|-------|------|--------|
| School | Dropdown/Search | Schools without animator |
| Year | Text | Current year default |

**Validation:**
- Max 2 assignments per animator
- School can only be assigned to one animator
- Cannot assign same school twice

---

### 8. 📝 Marks Viewer Module

**Route:** `/marks`

#### 8.1 Marks List View

**Filters:**
- Year dropdown (from available years in data)
- Search by parish/school name

**Table Columns:**
| Column | Type | Sortable |
|--------|------|----------|
| Parish | Text | Yes |
| Sunday School | Text | Yes |
| Animator | Text | Yes |
| Total Marks | Number | Yes |
| Status | Badge (Locked/Unlocked) | Yes |
| PDF | Icon | No |
| Actions | Button | No |

#### 8.2 Marks Detail Dialog

**Display:**
- Parish and School info
- Animator name
- Question-wise marks table
- Total score with percentage
- Remarks section
- Uploaded PDF link (if available)

**Marks Table:**
| # | Question | Marks | Max |
|---|----------|-------|-----|
| 1 | Question text 1... | 8 | 10 |
| 2 | Question text 2... | 7 | 10 |
| 3 | Question text 3... | 9 | 10 |
| **Total** | | **24** | **30** |

#### 8.3 PDF Report Generation

**Report Contents:**
- Header with logo
- Title: "വിശ്വാസജീവിത പരിശീലനം" (Faith Formation)
- Subtitle: "ഇടവകതല വിലയിരുത്തൽ [Year]" (Parish Level Evaluation)
- Parish and School details
- Animator name
- Date of report
- Question-wise marks table
- Total score
- Remarks section

**Export Options:**
- Download as PDF
- Print directly
- Share via link (future)

---

### 9. 📢 Notification Module

**Routes:**
- `/notifications` - Notification composer & history
- `/notifications/history` - Sent notifications

#### 9.1 Notification Composer

**Audience Types:**

| Type | Target | Collection | Description |
|------|--------|------------|-------------|
| **Public** | Everyone | `broadcasts` | Visible to all (no auth required) |
| **All Users** | Logged-in users | `notifications` (recipientId: 'all') | All authenticated users |
| **Specific Schools** | Selected schools | `notifications` (per school) | Targeted by school |

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Title | Text | ✅ |
| Message Body | Textarea | ✅ |
| Audience Type | Radio | ✅ |
| Target Schools | Multi-select | Conditional |
| Category | Dropdown | For broadcasts only |

#### 9.2 School Picker (for Specific)

**Features:**
- Search by school name
- Multi-select with checkboxes
- Select All / Deselect All
- Shows school count selected
- Filter by parish/forane (future)

#### 9.3 Notification History

**Table Columns:**
| Column | Type |
|--------|------|
| Title | Text |
| Body Preview | Truncated text |
| Type | Badge (Public/All/Specific) |
| Recipients | Count or "All" |
| Sent At | DateTime |
| Actions | Delete button |

---

### 10. 📈 Analytics & Reports Module

**Route:** `/analytics`

#### 10.1 Dashboard Charts

**Event Analytics:**
- Events created over time (line chart)
- Events by category (pie chart)
- Top event creators (bar chart)

**Registration Analytics:**
- Registrations over time (line chart)
- Registration status distribution (pie chart)
- Registrations by program (bar chart)
- Parish-wise registration comparison

**User Analytics:**
- User distribution by role (pie chart)
- New users over time (line chart)
- Active schools (participation rate)

**Assessment Analytics:**
- Average marks distribution (histogram)
- Question-wise performance (bar chart)
- Completion rate by parish (bar chart)

#### 10.2 Report Generation

**Available Reports:**
| Report | Description | Format |
|--------|-------------|--------|
| Event Summary | All events with details | PDF/CSV |
| Registration Report | Program registrations | PDF/Excel |
| Marks Summary | All marks entries | PDF/Excel |
| User Directory | All users by role | CSV/Excel |
| Program Report | Single program details | PDF |

**Export Options:**
- PDF (formatted)
- CSV (raw data)
- Excel (formatted with sheets)

---

### 11. ⚙️ Settings Module

**Route:** `/settings`

#### 11.1 Admin Profile
- View/Edit own profile
- Change password
- Profile picture update

#### 11.2 System Settings (Future)
- Category management
- Default settings
- Notification preferences
- Backup configuration

---

## 🎨 UI/UX Design Guidelines

### Color Scheme
```css
:root {
  /* Primary */
  --primary: #1E40AF;        /* Blue 800 */
  --primary-light: #3B82F6;  /* Blue 500 */
  --primary-dark: #1E3A8A;   /* Blue 900 */
  --primary-bg: #EFF6FF;     /* Blue 50 */
  
  /* Category Colors */
  --cml: #2563EB;            /* Blue */
  --suvara: #7C3AED;         /* Violet */
  
  /* Status Colors */
  --success: #22C55E;        /* Green 500 */
  --warning: #F59E0B;        /* Amber 500 */
  --danger: #EF4444;         /* Red 500 */
  --info: #0EA5E9;           /* Sky 500 */
  
  /* Neutrals */
  --text-primary: #111827;   /* Gray 900 */
  --text-secondary: #6B7280; /* Gray 500 */
  --text-muted: #9CA3AF;     /* Gray 400 */
  --background: #F9FAFB;     /* Gray 50 */
  --card: #FFFFFF;
  --border: #E5E7EB;         /* Gray 200 */
}
```

### Typography
```css
/* Primary Font: Poppins (matching mobile app) */
font-family: 'Poppins', 'Inter', system-ui, sans-serif;

/* Headings */
h1: 2rem (32px) - Bold
h2: 1.5rem (24px) - SemiBold
h3: 1.25rem (20px) - SemiBold
h4: 1rem (16px) - Medium

/* Body */
body: 0.875rem (14px) - Regular
small: 0.75rem (12px) - Regular
```

### Component Styling
- **Border Radius**: 8px (buttons), 12px (cards), 16px (modals)
- **Shadows**: Subtle shadows for elevation
- **Spacing**: 8px base unit (8, 16, 24, 32, 48)
- **Icons**: Lucide React or Material Icons

### Responsive Breakpoints
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Small desktop */
xl: 1280px  /* Desktop */
2xl: 1536px /* Large desktop */
```

---

## 📁 Recommended Project Structure

```
admin-panel/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ConfirmDialog.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   ├── FilterDropdown.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── events/
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventForm.jsx
│   │   │   ├── EventTable.jsx
│   │   │   └── EventFilters.jsx
│   │   ├── users/
│   │   │   ├── UserTable.jsx
│   │   │   ├── UserForm.jsx
│   │   │   ├── UserCard.jsx
│   │   │   └── SchoolPicker.jsx
│   │   ├── programs/
│   │   │   ├── ProgramTable.jsx
│   │   │   ├── ProgramForm.jsx
│   │   │   └── RegistrationViewer.jsx
│   │   ├── animators/
│   │   │   ├── AnimatorCard.jsx
│   │   │   ├── AnimatorForm.jsx
│   │   │   └── AssignmentManager.jsx
│   │   ├── questions/
│   │   │   ├── QuestionList.jsx
│   │   │   └── QuestionForm.jsx
│   │   ├── marks/
│   │   │   ├── MarksTable.jsx
│   │   │   ├── MarksDialog.jsx
│   │   │   └── PdfGenerator.jsx
│   │   ├── notifications/
│   │   │   ├── NotificationForm.jsx
│   │   │   ├── AudienceSelector.jsx
│   │   │   └── NotificationHistory.jsx
│   │   └── analytics/
│   │       ├── StatCard.jsx
│   │       ├── Charts.jsx
│   │       └── ReportGenerator.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── EventDetailPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── UserDetailPage.jsx
│   │   ├── ProgramsPage.jsx
│   │   ├── QuestionsPage.jsx
│   │   ├── AnimatorsPage.jsx
│   │   ├── MarksPage.jsx
│   │   ├── NotificationsPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── NotAuthorizedPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useFirestore.js
│   │   ├── useEvents.js
│   │   ├── useUsers.js
│   │   ├── usePrograms.js
│   │   ├── useAnimators.js
│   │   ├── useMarks.js
│   │   └── useNotifications.js
│   ├── services/
│   │   ├── firebase.js
│   │   ├── authService.js
│   │   ├── eventService.js
│   │   ├── userService.js
│   │   ├── programService.js
│   │   ├── animatorService.js
│   │   ├── marksService.js
│   │   ├── notificationService.js
│   │   └── storageService.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── pdfGenerator.js
│   ├── styles/
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js (if using Tailwind)
└── README.md
```

---

## 🔒 Security Configuration

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: Check if user is admin
    function isAdmin() {
      return request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAdmin() || request.auth.uid == userId;
      allow delete: if isAdmin();
    }
    
    // Events collection
    match /events/{eventId} {
      allow read: if true;  // Public events readable by all
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin() || 
        resource.data.creatorId == request.auth.uid;
    }
    
    // Programs collection
    match /programs/{programId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Questions collection
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Program registrations
    match /program_registrations/{regId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAdmin() || 
        resource.data.parishUserId == request.auth.uid;
      allow delete: if isAdmin();
    }
    
    // Animator assignments
    match /animator_assignments/{animatorId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Marks collection
    match /marks/{markId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated() && 
        request.resource.data.animatorId == request.auth.uid;
      allow delete: if isAdmin();
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
        (resource.data.recipientId == request.auth.uid || 
         resource.data.recipientId == 'all' ||
         isAdmin());
      allow write: if isAdmin();
    }
    
    // Broadcasts (public)
    match /broadcasts/{broadcastId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Event images
    match /events/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Profile images
    match /profiles/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // PDF uploads
    match /pdfs/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation
- [ ] Project setup (Vite + React)
- [ ] Firebase SDK configuration
- [ ] Authentication flow (Login/Logout)
- [ ] Admin role verification
- [ ] Layout components (Sidebar, Header)
- [ ] Protected route wrapper
- [ ] Basic routing setup

### Phase 2: Dashboard
- [ ] Statistics cards with real-time data
- [ ] Recent events widget
- [ ] Recent registrations widget
- [ ] Quick action buttons
- [ ] Responsive grid layout

### Phase 3: Event Management
- [ ] Event list with DataTable
- [ ] Filtering and search
- [ ] Create event form
- [ ] Edit event form
- [ ] Publish/Unpublish toggle
- [ ] Delete with confirmation
- [ ] Image upload with compression
- [ ] Bulk actions

### Phase 4: User Management
- [ ] User list with filters
- [ ] Create user (all roles)
- [ ] Edit user details
- [ ] Change user role
- [ ] Password reset trigger
- [ ] Delete user (with cascade)
- [ ] User activity view

### Phase 5: Program Management
- [ ] Program list
- [ ] Create/Edit program
- [ ] Activate/Deactivate
- [ ] View registrations
- [ ] Registration export

### Phase 6: Question Bank
- [ ] Question list with reordering
- [ ] Create/Edit questions
- [ ] Set max marks
- [ ] Delete questions

### Phase 7: Animator System
- [ ] Animator list view
- [ ] Create animator account
- [ ] Assignment manager
- [ ] School picker (unassigned only)
- [ ] Remove assignment

### Phase 8: Marks Viewer
- [ ] Marks list with filters
- [ ] Detail dialog
- [ ] PDF report generation
- [ ] Download functionality

### Phase 9: Notifications
- [ ] Notification composer
- [ ] Audience selector
- [ ] School multi-picker
- [ ] Notification history
- [ ] Delete functionality

### Phase 10: Analytics
- [ ] Dashboard charts
- [ ] Event analytics
- [ ] Registration analytics
- [ ] Report generation
- [ ] Export options

### Phase 11: Polish
- [ ] Error handling (toast notifications)
- [ ] Loading states (skeletons)
- [ ] Empty states
- [ ] Responsive design testing
- [ ] Performance optimization
- [ ] Accessibility audit

---

## 🚀 Deployment

### Firebase Hosting Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting
# Select: Create new site or use existing
# Public directory: dist
# Single-page app: Yes
# Overwrite index.html: No

# Build and deploy
npm run build
firebase deploy --only hosting
```

### Environment Configuration
Create `.env` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### CI/CD (GitHub Actions)
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: sunday-school-8cde8
```

---

## 🎯 Success Metrics

### Admin Efficiency Metrics
| Metric | Target | Measurement |
|--------|--------|-------------|
| Event creation time | < 2 minutes | Average time to create event |
| User onboarding time | < 1 minute | Time to create new user |
| Search response time | < 500ms | Time to show search results |
| Page load time | < 2 seconds | Initial page render |
| Task completion rate | > 95% | Admin tasks completed successfully |

### System Metrics
| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Error rate | < 0.1% |
| Data sync latency | < 1 second |
| Storage efficiency | < 500KB per event image |

---

## 📝 Development Notes

### Important Considerations
1. **Handle both `schoolname` and `schoolName`** - Legacy field naming in database
2. **Image compression required** - Compress before upload (max 400KB)
3. **Use batch writes** - For bulk operations (delete by user, notifications)
4. **Real-time listeners** - Use `onSnapshot` for live data where needed
5. **Optimistic updates** - Update UI before server confirmation for better UX
6. **Error boundaries** - Wrap components for graceful error handling
7. **Mobile responsiveness** - Admin panel should work on tablets

### Data Handling Patterns
```javascript
// Always handle both field names
const schoolName = data.schoolName || data.schoolname || 'Unknown';

// Use batch for multiple writes
const batch = writeBatch(db);
schoolIds.forEach(id => {
  const ref = doc(collection(db, 'notifications'));
  batch.set(ref, { ...notificationData, recipientId: id });
});
await batch.commit();

// Real-time listener pattern
useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, 'events'),
    (snapshot) => setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
    (error) => console.error('Snapshot error:', error)
  );
  return () => unsubscribe();
}, []);
```

---

## 🏁 Conclusion

This Admin Web Panel PRD provides a comprehensive blueprint for building a powerful administration interface for the Light Suvara ecosystem. The panel will enable administrators to efficiently manage all aspects of the Sunday School application, from events and users to programs, assessments, and notifications.

**Key Success Factors:**
- ✅ Intuitive UI matching the mobile app's design language
- ✅ Real-time data synchronization with Firebase
- ✅ Comprehensive CRUD operations for all entities
- ✅ Robust security with role-based access control
- ✅ Efficient workflows with bulk actions and quick navigation
- ✅ Detailed analytics and exportable reports

---

**Document Prepared By**: GitHub Copilot  
**Date**: January 1, 2026  
**Version**: 2.0 (Admin Web Panel Focus)  
**Status**: Ready for Development  
**Review Cycle**: Per Sprint
