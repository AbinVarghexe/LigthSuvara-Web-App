# 📖 Technical Documentation

This guide provides an in-depth look at the architecture, components, and workflows of the **Admin Dashboard** application.

## 📂 Project Structure

```bash
src/
├── components/         # Reusable UI components
│   ├── common/         # Shared specific components (e.g., StatusBadge)
│   ├── figma/          # Custom SVG/Design components
│   ├── layout/         # App shell (Sidebar, Header)
│   └── ui/             # Shadcn/ui base components
├── context/            # Global state (AuthContext, ThemeProvider)
├── features/           # Feature-specific logic
│   ├── events/         # Events services & types
│   └── users/          # User services & types
├── hooks/              # Custom React hooks
├── lib/                # Utilities (cn, firebase config)
├── pages/              # Route components
│   ├── dashboard/      # Main dashboard view
│   ├── events/         # Event list & details
│   ├── marks/          # Student marks management
│   └── users/          # User list & details
└── App.tsx             # Main application entry & routing
```

## 🛠️ Core Technologies

- **React 18**: UI Library using functional components and hooks.
- **TypeScript**: Static typing for enhanced developer experience and safety.
- **Vite**: Next-generation frontend tooling for fast builds.
- **Firebase**: Backend-as-a-Service for Auth, Firestore (Database), and Storage.
- **Tailwind CSS**: Utility-first CSS framework.
- **Shadcn/ui**: Reusable component collection built on Radix UI.

## 🔑 Key Features Implementation

### Authentication & Authorization
- Managed via `AuthContext.tsx`.
- Uses Firebase Auth for login/logout.
- **Role-Based Routing**: `ProtectedRoute` component checks user roles (`admin`, `school`, `animator`) before rendering sensitive pages.

### Dashboard
- **Location**: `src/pages/dashboard/Dashboard.tsx`
- Aggregates data from Firestore (`users` and `events` collections).
- Uses `recharts` for visualizing data (Bar charts, Radar charts).

### User Management
- **Location**: `src/pages/users/`
- **Features**:
  - List view with search and filters.
  - Detail view with "Actions" dropdown for role management.
  - CSV Bulk Upload handling via `features/users/services/userService.ts`.

### Theme System
- Implemented using `next-themes`.
- Enhanced with a custom **Circular Reveal Animation** in `mode-toggle.tsx` using the View Transitions API.

## 🎨 Styling

- **Global Styles**: Defined in `src/index.css`.
- **Theming**: Uses CSS variables for light/dark modes (e.g., `--background`, `--foreground`).
- **Icons**: `lucide-react` is used for all iconography.

## 💾 Data Layer

- **Service Pattern**: Database operations are abstracted into service files (e.g., `eventService.ts`, `userService.ts`).
- **Firestore Structure**:
  - `users`: User profiles and roles.
  - `events`: Event details, status, and creator references.

## 🚀 Deployment

The application is optimized for deployment on platforms like **Vercel** or **Netlify**.
Build command: `pnpm build`
Output directory: `dist`
