# ⚡ Quick Start

Follow this guide to get the **Admin Dashboard** up and running on your local machine.

## Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (preferred) or npm/yarn
- **Git**

## 1. Clone the Repository

```bash
git clone https://github.com/AbinVarghexe/Admindashboarduidesign.git
cd Admindashboarduidesign
```

## 2. Install Dependencies

Install the required packages using pnpm:

```bash
pnpm install
```

> If you don't have pnpm installed, run `npm install -g pnpm` first.

## 3. Environment Setup

Create a `.env` file in the root directory and configure your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 4. Run the Development Server

Start the local development server:

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173`.

## 5. Build for Production

To create a production-ready build:

```bash
pnpm run build
```

The output will be in the `dist` directory.
