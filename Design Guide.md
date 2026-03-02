# Google Material Design 3 (M3) - Admin Panel Design Guide

## 🎨 Design System Overview
This document outlines the complete design system transition from the previous enterprise theme to a **Google Material Design 3 (M3)** inspired UI for the Admin Panel. It emphasizes expressive, adaptable, and accessible digital experiences.

---

## 🎯 Design Philosophy
- **Expressive and Adaptive**: Dynamic color schemes (baseline M3 default) with high contrast and legibility.
- **Elevation and Depth**: Flat design combined with structured elevation mapping (Level 0 to 5) using subtle shadows and surface tints.
- **Touch-Friendly & Spacious**: Larger touch targets, pill-shaped buttons, and rounded corners for a modern mobile-first but desktop-capable feel.

---

## 🌈 Color Palette (M3 Baseline)

Material Design 3 relies on tonal palettes.

### Primary Colors
```css
--md-sys-color-primary: #0B57D0;        /* Main action buttons, active states */
--md-sys-color-on-primary: #FFFFFF;     /* Text on primary buttons */
--md-sys-color-primary-container: #D3E3FD; /* Highlighted backgrounds */
--md-sys-color-on-primary-container: #041E49; /* Text on primary container */
```

### Secondary Colors
```css
--md-sys-color-secondary: #00639B;      
--md-sys-color-on-secondary: #FFFFFF;
--md-sys-color-secondary-container: #C2E7FF;
--md-sys-color-on-secondary-container: #001D35;
```

### Surface & Backgrounds
```css
--md-sys-color-background: #FDFBFF;     /* Page background */
--md-sys-color-on-background: #1A1C1E;  /* Default text */
--md-sys-color-surface: #FDFBFF;        /* Standard card background */
--md-sys-color-surface-variant: #E1E2E8; /* Dividers, dialog headers */
```

### Semantic Colors
```css
--md-sys-color-error: #B3261E;          /* Destructive actions */
--md-sys-color-error-container: #F9DEDC; 
--md-sys-color-success: #146C2E;        /* Success confirmations */
--md-sys-color-warning: #B3261E;        /* Alert messages */
```

---

## 📝 Typography

Material Design uses standard, highly readable sans-serif typefaces.

### Font Families
```css
--font-sans: 'Google Sans', 'Roboto', sans-serif;
```

### typographic Scale
- **Display**: 57px / 45px / 36px (Used for empty states or massive hero text)
- **Headline**: 32px / 28px / 24px (Page Titles, Dialog Titles)
- **Title**: 22px / 16px / 14px (Card Titles, List Items)
- **Label**: 14px / 12px / 11px (Buttons, Form Labels - ALL CAPS is no longer standard in M3)
- **Body**: 16px / 14px (Paragraphs, standard data text)

*Font weight for buttons and tabs is typically Medium (500).*

---

## 📐 Shape & Elevation

### Corner Radius (Tokens)
```css
--md-sys-shape-corner-none: 0px;
--md-sys-shape-corner-extra-small: 4px; /* Inputs, checkboxes */
--md-sys-shape-corner-small: 8px;       /* Tooltips, small badges */
--md-sys-shape-corner-medium: 12px;     /* Cards, Dropdowns */
--md-sys-shape-corner-large: 16px;      /* Dialogs */
--md-sys-shape-corner-extra-large: 28px;/* Large Modals, Sheets */
--md-sys-shape-corner-full: 9999px;     /* Buttons, FABs, Pills */
```

### Elevation (Shadows & Surface Tints)
M3 uses surface tinting alongside shadows.
- **Level 0**: Standard background (No shadow)
- **Level 1**: Cards (`box-shadow: 0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)`)
- **Level 2**: Contained Buttons (hover state)
- **Level 3**: Dialogs, Popovers (`box-shadow: 0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px 0px rgba(0,0,0,0.3)`)
- **Level 4/5**: Modals, Drawer navigations

---

## 🧩 Essential Component Redesign

### 🔘 Buttons
Buttons in M3 are fully rounded (pill-shaped) and have 5 main variants. They should have a minimum height of `40px`.

#### 1. Filled Button (Primary Actions - Save, Create, Submit)
```tsx
<Button className="bg-[#0B57D0] hover:bg-[#0B57D0]/90 text-white rounded-full px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all">
  Save Action
</Button>
```

#### 2. Tonal Button (Secondary Actions)
```tsx
<Button className="bg-[#D3E3FD] hover:bg-[#D3E3FD]/80 text-[#041E49] rounded-full px-6 py-2.5 text-sm font-medium transition-colors">
  Secondary Action
</Button>
```

#### 3. Outlined Button (Alternative/Cancel)
```tsx
<Button variant="outline" className="border-[#74777F] text-[#0B57D0] hover:bg-[#D3E3FD]/20 rounded-full px-6 py-2.5 text-sm font-medium">
  Cancel
</Button>
```

#### 4. Text Button (Tertiary/Low Priority)
```tsx
<Button variant="ghost" className="text-[#0B57D0] hover:bg-[#D3E3FD]/30 rounded-full px-4 py-2 text-sm font-medium">
  Learn More
</Button>
```

#### 5. FAB (Floating Action Button)
- Square-ish with heavily rounded corners (`rounded-2xl`) or fully circular.
- Background: Primary Container (`#D3E3FD`).
- Icon: Primary Color (`#041E49`).
- Placement: Bottom right frame.

### 🔲 Dialog Boxes (Modals)
Dialogs interrupt the user to provide critical information or ask for a decision. M3 dialogs are curvier and more spacious.

#### Dialog Anatomy
- **Backdrop**: Dimmed screen (`bg-black/50`).
- **Container**: `bg-[#FDFBFF]`, `rounded-[28px]`, Elevation 3 shadow.
- **Padding**: `p-6` or `p-8`.
- **Icon (Optional)**: Centered at the top, primary color.
- **Title**: `text-[24px]` (Headline Small), text-gray-900, usually left-aligned or centered based on icon.
- **Description**: `text-[14px]` or `text-[16px]` (Body Medium), text-gray-600.
- **Actions**: Aligned to the bottom right. Text Buttons are preferred for actions to minimize visual clutter, unless it's a high-priority destructive/save action.

#### Code Implementation Guideline
```tsx
<Dialog>
  <DialogContent className="sm:max-w-[400px] bg-[#FDFBFF] rounded-[28px] p-6 shadow-xl border-0">
    <DialogHeader className="space-y-3">
      <DialogTitle className="text-2xl font-normal text-gray-900">
        Discard draft?
      </DialogTitle>
      <DialogDescription className="text-base text-gray-600">
        This will permanently delete your current progress. You cannot undo this action.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter className="mt-8 flex justify-end gap-2 pt-0 sm:space-x-0">
      <Button variant="ghost" className="rounded-full text-[#0B57D0] hover:bg-[#0B57D0]/10 px-4">
        Cancel
      </Button>
      <Button className="rounded-full bg-[#0B57D0] text-white hover:bg-[#0842A0] px-5 shadow-sm">
        Discard
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 🃏 Cards
- **Elevated Card**: White background, `rounded-xl` or `rounded-2xl`, subtle drop shadow.
- **Outlined Card**: White background, `rounded-xl`, 1px gray border (`border-[#C4C6D0]`), no shadow.
- **Filled Card**: Soft colored background (e.g., `#F0F4F9`), `rounded-xl`, no shadow.

### 📝 Text Inputs / Forms
- **Variant**: Outlined or Filled. Google mostly utilizes Filled inputs (`bg-[#F0F4F9]` with a bottom border) or rounded Outlined inputs (`rounded-sm` or `rounded-md` with strict label spacing).
- **Label**: Floats inside or stays strictly on top with a smaller font.

## 🛠 Next Steps for Implementation
To transition the current codebase to this Google Design pattern:
1. Update `index.css` and Tailwind config with the M3 color variables.
2. Modify `src/components/ui/button.tsx` to use `rounded-full` as default and adjust padding/sizing.
3. Modify `src/components/ui/dialog.tsx` to match the `rounded-[28px]` radius and update backdrop/shadow opacity.
4. Replace `Inter`/`Poppins` font dependencies with `Google Sans` (or adapt `Roboto`).
5. Incrementally update Cards across all Features (Pages).
