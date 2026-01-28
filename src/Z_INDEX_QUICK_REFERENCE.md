# Z-Index Quick Reference Guide

## 🎯 One-Page Reference for IskoMarket Z-Index System

---

## The Golden Rules

### Rule 1: Know Your Layer
```
🚨 Alerts          → z-[10500+] (Critical notifications)
🔔 Toasts          → z-[10300]  (Success/error messages)
🎮 Floating Widgets → z-[10200]  (Iskoin, Daily Spin)
🗨️  Menus/Dropdowns → z-[10100]  (ABOVE all modals) ⭐
📱 Nested Modals   → z-[10001]  (2nd level content)
🌫️  Nested Overlay  → z-[10000]  (2nd level backdrop)
💬 Modal Content   → z-[9999]   (1st level)
🌫️  Modal Backdrop  → z-[9998]   (1st level overlay)
📄 Base Content    → z-0 to z-10 (Page content)
```

### Rule 2: Use the Right Value

| If your component is... | Use this z-index |
|-------------------------|------------------|
| A dropdown menu INSIDE modal | `z-[10100]` ⭐ |
| A context menu INSIDE modal | `z-[10100]` ⭐ |
| A popover INSIDE modal | `z-[10100]` ⭐ |
| A select dropdown INSIDE modal | `z-[10100]` ⭐ |
| A hover card | `z-[10100]` |
| A menubar dropdown | `z-[10100]` |
| A tooltip | `z-50` |
| A drawer/sheet | `z-50` |
| A nested modal backdrop | `z-[10000]` |
| A nested modal | `z-[10001]` |
| A modal backdrop | `z-[9998]` |
| A modal | `z-[9999]` |
| A floating widget | `z-[10200]` |
| A toast | `z-[10300]` |
| An alert | `z-[10500]` |

### Rule 3: Critical Update - Menus Above Modals! ⭐
**ALL menus and dropdowns MUST be at z-[10100] to appear above modals**

This ensures that Select dropdowns, Context menus, and Popovers work correctly inside modals.

---

## Quick Decision Tree

```
Is it a menu/dropdown that appears on user action?
├─ YES → Use z-[10100] + shadow-xl + backdrop-blur-sm ⭐
└─ NO
   ├─ Is it a tooltip?
   │  └─ YES → Use z-50 (below menus is correct)
   │
   ├─ Is it a full-screen overlay (Drawer/Sheet)?
   │  └─ YES → Use z-50 (separate system)
   │
   ├─ Is it a nested modal (2nd level)?
   │  └─ YES → Use z-[10000] (backdrop) and z-[10001] (content)
   │
   ├─ Is it a modal (1st level)?
   │  └─ YES → Use z-[9998] (backdrop) and z-[9999] (content)
   │
   ├─ Is it a floating widget?
   │  └─ YES → Use z-[10200]
   │
   ├─ Is it a toast/notification?
   │  └─ YES → Use z-[10300]
   │
   ├─ Is it an alert?
   │  └─ YES → Use z-[10500]
   │
   └─ Is it page content?
      └─ YES → Use z-0 to z-10
```

---

## Component Checklist

### ✅ Interactive Menus (z-[10100]) ⭐ CRITICAL

**These components ALL use z-[10100]:**
```
✓ Select (dropdown)
✓ SelectContent
✓ DropdownMenu
✓ DropdownMenuContent
✓ DropdownMenuSubContent
✓ Popover
✓ PopoverContent
✓ ContextMenu
✓ ContextMenuContent
✓ ContextMenuSubContent
✓ HoverCard
✓ HoverCardContent
✓ Menubar
✓ MenubarContent
✓ MenubarSubContent
✓ NavigationMenu
✓ NavigationMenuViewport
```

**WHY z-[10100]?**
Because modals are at z-[9999] and z-[10001], menus MUST be higher to appear on top of modal overlays!

### ✅ Special Cases (z-50)

**These components use z-50 (correct):**
```
✓ Tooltip (should be below menus)
✓ TooltipContent
✓ Drawer (full-screen overlay)
✓ DrawerOverlay
✓ DrawerContent
✓ Sheet (full-screen overlay)
✓ SheetOverlay
✓ SheetContent
```

### ✅ Modals & Overlays (z-[9998+])

**Modal stacking system:**
```
✓ 1st Modal Backdrop → z-[9998]
✓ 1st Modal Content → z-[9999]
✓ 2nd Modal Backdrop → z-[10000]
✓ 2nd Modal Content → z-[10001]
✓ Each subsequent modal gets +2 z-index
```

### ✅ Top-Level UI (z-[10200+])

**Always-visible UI:**
```
✓ Floating Widgets (Iskoin, Daily Spin) → z-[10200]
✓ Toast Notifications → z-[10300]
✓ Critical Alerts → z-[10500]
```

---

## Code Templates

### For New Dropdown/Menu Component (Inside Modal)
```tsx
function MyDropdown({ className, ...props }) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        className={cn(
          // Base styles
          "bg-popover text-popover-foreground",
          
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          
          // CRITICAL: Layering - MUST be z-[10100] for menus!
          "z-[10100]",  // ← Above all modals! ⭐
          
          // Visual polish
          "shadow-xl backdrop-blur-sm",
          
          // Layout
          "rounded-md border p-1",
          
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
```

### For Tooltip Component (Below Menus)
```tsx
function Tooltip({ className, ...props }) {
  return (
    <Primitive.Content
      className={cn(
        "bg-primary text-primary-foreground",
        "animate-in fade-in-0 zoom-in-95",
        
        // CRITICAL: Below menus
        "z-50",  // ← z-50 for tooltips (correct)
        
        "rounded-md px-3 py-1.5 text-xs",
        className,
      )}
      {...props}
    />
  );
}
```

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Using z-50 for Menus (CRITICAL ERROR!)
```tsx
// BAD - Menu hidden behind modals:
className="... z-50 ..."  // ❌ Menu invisible inside modal!

// GOOD - Menu above all modals:
className="... z-[10100] ..."  // ✅ Menu always visible!
```

### ❌ Mistake 2: Using z-[100] for Menus (OUTDATED!)
```tsx
// OUTDATED (old system):
className="... z-[100] ..."  // ❌ Too low, hidden by modals

// UPDATED (current system):
className="... z-[10100] ..."  // ✅ Above modals! ⭐
```

### ❌ Mistake 3: Wrong Layer for Component Type
```tsx
// BAD (tooltip above menus):
<Tooltip className="z-[10100]" />  // ❌ Wrong layer!

// GOOD (tooltip below menus):
<Tooltip className="z-50" />  // ✅

// BAD (menu below modals):
<DropdownMenu className="z-[100]" />  // ❌ Hidden!

// GOOD (menu above modals):
<DropdownMenu className="z-[10100]" />  // ✅ ⭐
```

---

## Global CSS Rules (styles/globals.css)

Located at **lines 228-296** in `/styles/globals.css`:

```css
/* ===== CRITICAL: Z-INDEX HIERARCHY ===== */

/* Menus/Dropdowns INSIDE Modals (10100) ⭐ */
[role="menu"],
[role="listbox"],
[data-slot="dropdown-menu"],
[data-slot="select-content"],
[data-slot="popover-content"],
[data-radix-dropdown-menu-content],
[data-radix-select-content],
[data-radix-popover-content],
[data-radix-context-menu-content] {
  z-index: 10100 !important;
}

/* Popper/Portal wrappers for dropdowns */
[data-radix-popper-content-wrapper],
[data-radix-portal] {
  z-index: 10100 !important;
}

/* Modal Backdrops (9998) */
[data-slot="dialog-overlay"] {
  z-index: 9998 !important;
}

/* Modal Content (9999) */
[data-slot="dialog-content"] {
  z-index: 9999 !important;
}

/* Toast Notifications (10300) */
[data-sonner-toaster] {
  z-index: 10300 !important;
}

/* Floating Widgets (10200) */
.floating-widget-container {
  z-index: 10200 !important;
}
```

---

## Testing Scenarios

### ✅ Scenario 1: Select Dropdown Inside Modal
```
1. Open any modal (e.g., Post Product)
2. Click a Select dropdown (e.g., Category)
3. ✅ Dropdown appears ABOVE modal overlay at z-10100
4. ✅ Options are fully visible and clickable
5. ✅ Can select an option
6. ✅ Modal remains open and functional
```

### ✅ Scenario 2: Nested Modals with Dropdown
```
1. Open Product Detail modal (z-9999)
2. Click "Report" button → Report modal opens (z-10001)
3. Click reason dropdown in Report modal
4. ✅ Dropdown appears at z-10100 (ABOVE both modals)
5. ✅ Can select a reason
6. ✅ Both modals remain functional
```

### ✅ Scenario 3: Context Menu Inside Modal
```
1. Open Admin Dashboard → User Management table
2. Right-click on user row
3. ✅ Context menu appears ABOVE modal at z-10100
4. ✅ All menu options are clickable
5. ✅ Menu closes on selection or outside click
```

### ✅ Scenario 4: Toast While Modal & Dropdown Open
```
1. Open any modal
2. Open a dropdown inside modal
3. Trigger a success toast (e.g., "Saved!")
4. ✅ Toast appears at z-10300 (ABOVE everything)
5. ✅ Dropdown still functional at z-10100
6. ✅ Modal still functional at z-9999
```

### ✅ Scenario 5: Floating Widgets with Modal
```
1. Open any modal (z-9999)
2. Check Iskoin Meter widget visibility
3. ✅ Widget visible at z-10200 (ABOVE modal)
4. ✅ Widget remains interactive
5. ✅ Can click widget to open details
```

---

## Verification Commands

### Check for correct z-index in menu components
```bash
# All menus should have z-[10100]
grep -r "z-\[10100\]" components/ui/{select,dropdown-menu,popover,context-menu}.tsx
```
**Expected:** Multiple matches ✅

### Check for outdated z-[100] (should be none)
```bash
# Old z-[100] should NOT exist in menus
grep -r "z-\[100\]" components/ui/{select,dropdown-menu,popover,context-menu}.tsx
```
**Expected:** No results ✅

### Check for backdrop-blur in menus
```bash
grep -r "backdrop-blur-sm" components/ui/{select,dropdown-menu,popover}.tsx
```
**Expected:** Multiple matches ✅

---

## Troubleshooting

### Menu Hidden Behind Modal?
**Solution:**
1. Check if z-index is `z-[10100]` (not z-[100] or z-50)
2. Verify component uses `<Portal>` or `<Primitive.Portal>`
3. Check DevTools: Menu should render outside modal DOM
4. Inspect computed z-index value in browser

### Dropdown Not Working Inside Modal?
**Solution:**
1. Ensure modal has proper Portal setup
2. Check for parent elements with `overflow: hidden`
3. Verify z-index: Menu z-10100 > Modal z-9999
4. Test with browser DevTools Elements panel

### Multiple Modals Stacking Issue?
**Solution:**
1. Dialog component auto-manages z-index
2. Each modal gets +2 z-index (10000, 10002, 10004...)
3. Menus always at z-10100 regardless of modal count
4. Check `openDialogCount` in Dialog component state

---

## File Locations

| Component File | Z-Index | Status |
|----------------|---------|--------|
| `/components/ui/select.tsx` | z-[10100] | ✅ |
| `/components/ui/dropdown-menu.tsx` | z-[10100] | ✅ |
| `/components/ui/popover.tsx` | z-[10100] | ✅ |
| `/components/ui/context-menu.tsx` | z-[10100] | ✅ |
| `/components/ui/hover-card.tsx` | z-[10100] | ✅ |
| `/components/ui/menubar.tsx` | z-[10100] | ✅ |
| `/components/ui/navigation-menu.tsx` | z-[10100] | ✅ |
| `/components/ui/tooltip.tsx` | z-50 | ✅ |
| `/components/ui/drawer.tsx` | z-50 | ✅ |
| `/components/ui/sheet.tsx` | z-50 | ✅ |
| `/components/ui/dialog.tsx` | z-[9998-10001] | ✅ |
| `/styles/globals.css` | Rules | ✅ |

---

## When to Use Each Layer

### Use z-[10100] when: ⭐ CRITICAL FOR MENUS
- ✅ It's a dropdown that appears on click **inside a modal**
- ✅ It's a context menu (right-click) **anywhere**
- ✅ It's a popover with interactive content
- ✅ It's a select dropdown **especially in modals**
- ✅ It's a hover card with actions
- ✅ It needs to appear **above modal overlays**
- ✅ It should work correctly **in any context**

### Use z-50 when:
- ✅ It's a tooltip (non-interactive hint)
- ✅ It's a full-screen drawer/sheet
- ✅ It should appear below menus but above content

### Use z-[9998-10001] when:
- ✅ It's a modal backdrop (9998 for 1st, 10000 for 2nd)
- ✅ It's a modal dialog (9999 for 1st, 10001 for 2nd)
- ✅ Nested modals need to stack properly

### Use z-[10200+] when:
- ✅ It's a floating widget (Iskoin, Daily Spin)
- ✅ It's a toast notification (10300)
- ✅ It's a critical alert (10500)

### Use z-0 to z-10 when:
- ✅ It's regular page content
- ✅ It's a card component
- ✅ It's a navbar
- ✅ It's a footer

---

## Summary

**THE HIERARCHY (Highest to Lowest):**
```
🚨 z-[10500]  Critical Alerts
🔔 z-[10300]  Toast Notifications
🎮 z-[10200]  Floating Widgets
🗨️  z-[10100]  Menus/Dropdowns ⭐ ABOVE MODALS
📱 z-[10001]  2nd Level Modal Content
🌫️  z-[10000]  2nd Level Modal Backdrop
💬 z-[9999]   1st Level Modal Content
🌫️  z-[9998]   1st Level Modal Backdrop
📄 z-0-10     Base Page Content
```

**THE GOLDEN FORMULA FOR MENUS:**
```tsx
z-[10100] + shadow-xl + backdrop-blur-sm = Perfect Menu Inside Modals ✨
```

**KEY TAKEAWAY:**
> All interactive menus MUST use z-[10100] to ensure they appear above modal overlays. This is non-negotiable for proper functionality inside modals!

---

## Related Documentation

- [MENU_MODAL_LAYERING_FIXED.md](/MENU_MODAL_LAYERING_FIXED.md) - Detailed explanation of the layering fix
- [MODAL_LAYERING_FIXED.md](/MODAL_LAYERING_FIXED.md) - Modal-specific z-index management
- [styles/globals.css](/styles/globals.css) - Global CSS z-index rules

---

**Date Updated:** January 2025  
**Status:** ✅ CURRENT & ACCURATE  
**Version:** 2.0 (Updated for z-10100 menu system)  
**Critical:** ⭐ Menus MUST be z-[10100] to work inside modals!
