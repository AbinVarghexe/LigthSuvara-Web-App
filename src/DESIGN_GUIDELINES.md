# Light Suvara Admin Panel - Design Guidelines

## 🎨 Design System Overview

This document outlines the complete design system for the Light Suvara Admin Panel. Follow these guidelines to maintain consistency across the application.

---

## 🎯 Design Philosophy

- **Modern Enterprise Aesthetic**: Clean, professional, and trustworthy
- **User-Centric**: Intuitive navigation and clear visual hierarchy
- **Accessible**: WCAG 2.1 AA compliant where possible
- **Consistent**: Predictable patterns and interactions
- **Responsive**: Works seamlessly across desktop viewports (1440px primary)

---

## 🌈 Color Palette

### Primary Colors
```css
--primary-900: #1E40AF;        /* Primary buttons, active states */
--primary-600: #3B82F6;        /* Links, hover states, accents */
--primary-50: #EFF6FF;         /* Light backgrounds */
```

### Semantic Colors
```css
--success: #22C55E;            /* Success states, published */
--danger: #EF4444;             /* Errors, delete actions */
--warning: #F59E0B;            /* Warnings, pending states */
--info: #3B82F6;               /* Information, neutral actions */
```

### Neutral Colors
```css
--background: #F9FAFB;         /* Page background */
--surface: #FFFFFF;            /* Card/component background */
--border: #E5E7EB;             /* Borders, dividers */
--text-primary: #111827;       /* Primary text */
--text-secondary: #6B7280;     /* Secondary text, labels */
--text-disabled: #9CA3AF;      /* Disabled text */
```

### Category Colors
```css
--category-cml: #3B82F6;       /* CML category */
--category-suvara: #8B5CF6;    /* Suvara category */
--category-general: #10B981;   /* General category */
```

---

## 📝 Typography

### Font Families
```css
--font-heading: 'Poppins', sans-serif;     /* Headings (h1-h6) */
--font-body: 'Inter', sans-serif;          /* Body text, UI elements */
```

### Font Sizes
**DO NOT use Tailwind font size classes unless specifically requested by user**

Default sizes are set in `/styles/globals.css`:
- `h1`: 2.25rem (36px) - Page titles
- `h2`: 1.875rem (30px) - Section headers
- `h3`: 1.5rem (24px) - Card titles
- `h4`: 1.25rem (20px) - Subsection titles
- `body`: 1rem (16px) - Default text
- `small`: 0.875rem (14px) - Helper text, captions

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Poppins** (Headings):
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

**Inter** (Body):
- Regular: 400
- Medium: 500
- Semibold: 600

---

## 📐 Spacing & Layout

### Border Radius
```css
--radius-sm: 8px;              /* Buttons, inputs, badges */
--radius-md: 12px;             /* Cards, panels */
--radius-lg: 16px;             /* Modals, dialogs */
--radius-xl: 20px;             /* Large containers */
--radius-full: 9999px;         /* Pills, floating buttons */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Container Padding
```css
--padding-card: 24px (p-6);
--padding-section: 32px (p-8);
--padding-page: 32px (p-8);
```

### Grid & Spacing
- Use Tailwind spacing scale (4px increments)
- Standard gap between cards: `gap-6` (24px)
- Standard margin between sections: `space-y-6` or `space-y-8`

---

## 🧩 Component Guidelines

### Buttons

#### Primary Button
```tsx
<Button className="bg-[#1E40AF] hover:bg-[#1E40AF]/90 rounded-lg">
  Primary Action
</Button>
```
- Use for main actions (Save, Publish, Create)
- Background: `#1E40AF`
- Height: 44px (`h-11`) for forms, 36px (`h-9`) default
- Border radius: 8px (`rounded-lg`)

#### Secondary Button (Outline)
```tsx
<Button variant="outline">
  Secondary Action
</Button>
```
- Use for secondary actions (Cancel, Back)
- Border: 1px solid `#E5E7EB`

#### Destructive Button
```tsx
<Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
  Delete
</Button>
```
- Use for destructive actions
- Red text with red border

#### Ghost Button (Icon Actions)
```tsx
<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
  <Icon className="w-4 h-4" />
</Button>
```
- Use for icon-only actions in tables

#### Floating Action Button
```tsx
<Button className="fixed bottom-8 right-8 h-14 px-6 bg-[#1E40AF] rounded-full shadow-lg">
  <Plus className="w-5 h-5 mr-2" />
  Add Item
</Button>
```

### Cards

```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  {/* Card content */}
</div>
```
- Background: `#FFFFFF`
- Border: 1px solid `#E5E7EB`
- Border radius: 12px (`rounded-xl`)
- Shadow: subtle (`shadow-sm`)
- Padding: 24px (`p-6`)
- Hover state: `hover:shadow-md transition-shadow`

### Status Badges

```tsx
// Public/Success
<span className="bg-green-100 text-green-800 border-green-200">Public</span>

// Draft/Inactive
<span className="bg-gray-100 text-gray-800 border-gray-200">Draft</span>

// Admin Role
<span className="bg-blue-100 text-blue-800 border-blue-200">Admin</span>

// School Role
<span className="bg-purple-100 text-purple-800 border-purple-200">School</span>
```
- Border radius: 6px (`rounded-md`)
- Padding: `px-2.5 py-0.5`
- Border: 1px solid (matching color)

### Form Inputs

```tsx
<Input className="h-11 rounded-lg" />
```
- Height: 44px (`h-11`)
- Border radius: 8px (`rounded-lg`)
- Border: 1px solid `#E5E7EB`
- Focus state: Blue ring

### Tables

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200">
      <th className="text-left py-3 px-4 text-gray-600 font-medium">
        Column Header
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 text-gray-700">Cell content</td>
    </tr>
  </tbody>
</table>
```
- Header: Gray text, medium weight
- Border: Bottom border on rows
- Hover: Light gray background
- Cell padding: `py-3 px-4`

### Statistics Cards

```tsx
<StatCard
  title="Total Events"
  value={25}
  icon={Calendar}
  iconColor="text-blue-600"
  iconBg="bg-blue-100"
/>
```
- Icon size: 24px (`w-6 h-6`)
- Icon container: 48px (`p-3`) with rounded background
- Value: Large heading size
- Title: Small gray text

---

## 🎭 Layout Structure

### Sidebar Navigation
- Width: 256px (`w-64`)
- Background: White
- Border: Right border 1px
- Logo section: 24px padding
- Menu items: 16px padding, 8px rounded corners
- Active state: Blue background (`#1E40AF`) with white text
- Hover state: Gray background (`hover:bg-gray-100`)

### Top Header
- Height: Auto (padding-based)
- Background: White
- Border: Bottom border 1px
- Padding: 32px horizontal, 16px vertical
- Contains: Page title (left) + Profile info (right)

### Main Content Area
- Background: `#F9FAFB`
- Padding: 32px (`p-8`)
- Max width for detail pages: 1280px (`max-w-5xl mx-auto`)
- Max width for forms: 896px (`max-w-4xl mx-auto`)

---

## 🎨 Visual States

### Hover States
- Buttons: Opacity 90% or darker shade
- Cards: Increase shadow (`hover:shadow-md`)
- Table rows: Light gray background
- Links: Underline (`hover:underline`)

### Active States
- Navigation items: Blue background with white text
- Selected items: Border or background change

### Disabled States
- Opacity: 50% (`opacity-50`)
- Cursor: Not allowed (`cursor-not-allowed`)
- Pointer events: None (`pointer-events-none`)

### Loading States
- Use skeleton screens or spinner
- Gray background for loading areas

---

## 🔤 Icon Guidelines

### Icon Library
Use **Lucide React** for all icons: `lucide-react`

### Icon Sizes
```tsx
// Small (table actions)
<Icon className="w-4 h-4" />

// Medium (default)
<Icon className="w-5 h-5" />

// Large (stat cards, headers)
<Icon className="w-6 h-6" />
```

### Common Icons
- **Dashboard**: `Home`
- **Events**: `Calendar`
- **Users**: `Users`
- **Notifications**: `Bell`
- **Reports**: `BarChart3`
- **Settings**: `Settings`
- **Logout**: `LogOut`
- **Edit**: `Edit`
- **Delete**: `Trash2`
- **View**: `Eye`
- **Add**: `Plus`
- **Search**: `Search`
- **Download**: `Download`
- **Upload**: `Upload`

---

## 📱 Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

Primary design: **1440px desktop**

### Grid Layouts
```tsx
// 1 column mobile, 2 tablet, 3+ desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Statistics cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
```

---

## ✅ Component Checklist

When creating new components, ensure:

- [ ] Uses correct color palette
- [ ] Uses Poppins for headings, Inter for body
- [ ] **Does NOT use Tailwind font size/weight classes** (unless user requests)
- [ ] Has correct border radius (8px, 12px, or 16px)
- [ ] Includes hover/active states
- [ ] Is keyboard accessible
- [ ] Has proper spacing (p-6 or p-8 for cards)
- [ ] Uses Lucide icons at correct size
- [ ] Follows existing component patterns
- [ ] Has consistent shadow application

---

## 🚨 Common Patterns

### Modal/Dialog Structure
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Page Header Pattern
```tsx
<Link to="/back" className="text-[#3B82F6] hover:underline inline-flex items-center gap-2">
  ← Back to List
</Link>
```

### Filter Section
```tsx
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Filters */}
  </div>
</div>
```

### Empty State
```tsx
<div className="text-center py-12">
  <p className="text-gray-500">No items found</p>
  <Button className="mt-4">Create New</Button>
</div>
```

---

## 🎯 Best Practices

### DO ✅
- Use existing ShadCN components from `/components/ui`
- Follow the established color palette
- Use semantic HTML elements
- Add loading and error states
- Include toast notifications for user feedback
- Use descriptive variable names
- Keep components small and focused
- Add proper TypeScript types

### DON'T ❌
- Don't use inline styles (use Tailwind)
- Don't create custom font size classes
- Don't mix different icon libraries
- Don't use arbitrary colors outside the palette
- Don't skip hover/focus states
- Don't forget to handle empty states
- Don't use hardcoded values (use Tailwind scale)
- Don't override default typography unless required

---

## 📦 File Structure

```
/
├── components/
│   ├── ui/              # ShadCN components (don't modify)
│   ├── Layout.tsx       # Main layout wrapper
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── Header.tsx       # Top header
│   ├── StatCard.tsx     # Statistics card
│   └── StatusBadge.tsx  # Status badge component
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Events.tsx
│   ├── EventDetail.tsx
│   ├── EventForm.tsx
│   ├── Users.tsx
│   ├── UserDetail.tsx
│   ├── Notifications.tsx
│   ├── Reports.tsx
│   └── Settings.tsx
├── data/
│   └── mockData.ts      # Mock data and types
├── utils/
│   └── routes.ts        # React Router configuration
├── styles/
│   └── globals.css      # Global styles and typography
└── App.tsx              # Root component
```

---

## 🎨 Quick Reference

### Most Used Classes

**Containers:**
```css
bg-white rounded-xl shadow-sm border border-gray-100 p-6
```

**Primary Button:**
```css
bg-[#1E40AF] hover:bg-[#1E40AF]/90 rounded-lg h-11 px-6
```

**Input Field:**
```css
h-11 rounded-lg
```

**Table Row:**
```css
border-b border-gray-100 hover:bg-gray-50
```

**Link:**
```css
text-[#3B82F6] hover:underline
```

---

## 📞 Questions?

When implementing new features:
1. Check this guideline first
2. Reference existing components in `/pages` and `/components`
3. Use the color palette exactly as specified
4. Maintain consistent spacing and sizing
5. Test hover/active/disabled states

**Remember:** Consistency is key! When in doubt, copy patterns from existing components.

---

*Last Updated: November 26, 2025*
*Version: 1.0.0*
