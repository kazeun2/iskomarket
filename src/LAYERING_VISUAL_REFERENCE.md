# IskoMarket Z-Index Layering - Visual Reference

## Quick Visual Guide

This document shows exactly how all UI elements layer on top of each other in IskoMarket.

---

## Z-Index Stack Visualization

```
┌─────────────────────────────────────────────────┐
│  🔔 Toasts & Notifications (z-10000+)          │  ← Always on top
├─────────────────────────────────────────────────┤
│  🗨️  Modals & Dialogs (z-9999)                 │  ← Dialog content
├─────────────────────────────────────────────────┤
│  🌫️  Modal Backdrops (z-9998)                  │  ← Gray overlay
├─────────────────────────────────────────────────┤
│  📋 Dropdowns & Menus (z-100)                   │  ← Interactive menus
│  ├─ Select dropdowns                            │
│  ├─ DropdownMenu items                          │
│  ├─ Context menus (right-click)                 │
│  ├─ Popovers                                    │
│  ├─ Hover cards                                 │
│  ├─ Menubar dropdowns                           │
│  └─ Navigation menu dropdowns                   │
├─────────────────────────────────────────────────┤
│  💬 Tooltips (z-50)                             │  ← Below menus
├─────────────────────────────────────────────────┤
│  📱 Drawers & Sheets (z-50)                     │  ← Full-screen
├─────────────────────────────────────────────────┤
│  📄 Base Content (z-0 to z-10)                  │  ← Page content
│  ├─ Navbar                                      │
│  ├─ Marketplace grid                            │
│  ├─ Product cards                               │
│  ├─ User dashboard                              │
│  └─ All other content                           │
└─────────────────────────────────────────────────┘
```

---

## Real-World Examples

### Example 1: Category Dropdown in Marketplace

```
When you click the category selector:

┌───────────────────────────────────────┐
│  📋 Category Dropdown (z-100)         │
│  ┌─────────────────────────────────┐  │  ← Appears above everything
│  │ All Categories                  │  │
│  │ Textbooks                       │  │
│  │ Electronics                     │  │
│  │ Clothing                        │  │
│  └─────────────────────────────────┘  │
├───────────────────────────────────────┤
│  📄 Marketplace Content (z-0)         │  ← Product cards below
│  ┌────┐  ┌────┐  ┌────┐              │
│  │ 📚 │  │ 💻 │  │ 👕 │              │
│  └────┘  └────┘  └────┘              │
└───────────────────────────────────────┘
```

**Result:** Dropdown is fully visible and clickable! ✅

---

### Example 2: User Menu in Navbar

```
When you click your avatar:

┌───────────────────────────────────────┐
│  Navbar                               │
│  [Logo] [Menu] [Search] [(Avatar)]   │
│                            │          │
│                            ▼          │
│                  ┌──────────────────┐ │
│                  │ 📋 User Menu     │ │  ← z-100
│                  │ ├─ Profile       │ │
│                  │ ├─ Dashboard     │ │
│                  │ ├─ Settings      │ │
│                  │ └─ Logout        │ │
│                  └──────────────────┘ │
├───────────────────────────────────────┤
│  📄 Page Content (z-0)                │
│  Products, cards, etc.                │
└───────────────────────────────────────┘
```

**Result:** Menu appears above content, not hidden! ✅

---

### Example 3: Modal with Dropdown Inside

```
When you open a modal and use a dropdown inside it:

┌───────────────────────────────────────────────┐
│  🗨️ Modal (z-9999)                            │
│  ┌─────────────────────────────────────────┐  │
│  │ Edit Product                            │  │
│  │                                         │  │
│  │ Category: [Textbooks ▼] ← Click here  │  │
│  │           ┌──────────────────────────┐ │  │
│  │           │ 📋 Dropdown (z-100)      │ │  │  ← Still visible!
│  │           │ Textbooks                │ │  │
│  │           │ Electronics              │ │  │
│  │           └──────────────────────────┘ │  │
│  │                                         │  │
│  │ [Cancel] [Save]                         │  │
│  └─────────────────────────────────────────┘  │
├───────────────────────────────────────────────┤
│  🌫️ Modal Backdrop (z-9998)                   │
├───────────────────────────────────────────────┤
│  📄 Page Content (z-0) - Blurred/Dimmed       │
└───────────────────────────────────────────────┘
```

**How it works:**
- Modal creates its own stacking context at z-9999
- Dropdown inherits this context
- Radix UI Portal ensures dropdown renders correctly
- Dropdown appears above modal content, below modal overlay

**Result:** Dropdown works perfectly inside modals! ✅

---

### Example 4: Context Menu (Right-Click)

```
When you right-click on a product card:

┌───────────────────────────────────────┐
│  📄 Marketplace (z-0)                 │
│  ┌────────┐  ┌────────┐              │
│  │Product │  │Product │              │
│  │  📚    │  │  💻    │              │
│  └────────┘  └────────┘              │
│       │ (right-click)                 │
│       ▼                               │
│  ┌──────────────────┐                 │
│  │ 📋 Context Menu  │ ← z-100         │
│  │ ├─ View Details  │                 │
│  │ ├─ Edit          │                 │
│  │ ├─ Delete        │                 │
│  │ └─ Share         │                 │
│  └──────────────────┘                 │
└───────────────────────────────────────┘
```

**Result:** Context menu appears above cards! ✅

---

### Example 5: Tooltip vs Dropdown

```
Hovering over a button with tooltip while dropdown is open:

┌───────────────────────────────────────┐
│  📋 Dropdown Menu (z-100)             │  ← Appears on top
│  ┌─────────────────────────────────┐  │
│  │ Menu Item 1                     │  │
│  │ Menu Item 2                     │  │
│  └─────────────────────────────────┘  │
├───────────────────────────────────────┤
│  💬 Tooltip (z-50)                    │  ← Below dropdown
│  ┌──────────────┐                     │
│  │ Edit product │ ← Hidden if overlap │
│  └──────────────┘                     │
├───────────────────────────────────────┤
│  📄 Content (z-0)                     │
│  [Button]                             │
└───────────────────────────────────────┘
```

**Why:** Tooltips should NOT appear above active menus.  
**Result:** Correct behavior! ✅

---

## Component Checklist

### ✅ Components at z-[100] (Interactive Menus)

| Component | Z-Index | Shadow | Blur | Status |
|-----------|---------|--------|------|--------|
| Select | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| DropdownMenu | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| DropdownMenuSub | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| Popover | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| ContextMenu | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| ContextMenuSub | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| HoverCard | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| Menubar | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| MenubarSub | `z-[100]` | `shadow-xl` | `backdrop-blur-sm` | ✅ |
| NavigationMenu | `z-[100]` | N/A | N/A | ✅ |

### ✅ Components at z-50 (Special Cases)

| Component | Z-Index | Reason | Status |
|-----------|---------|--------|--------|
| Tooltip | `z-50` | Should be below menus | ✅ Correct |
| Drawer Overlay | `z-50` | Full-screen component | ✅ Correct |
| Drawer Content | `z-50` | Full-screen component | ✅ Correct |
| Sheet Overlay | `z-50` | Full-screen component | ✅ Correct |
| Sheet Content | `z-50` | Full-screen component | ✅ Correct |

### ✅ Components at z-[9998+] (Modals)

| Component | Z-Index | Purpose | Status |
|-----------|---------|---------|--------|
| Modal Backdrop | `z-[9998]` | Gray overlay | ✅ |
| Modal Content | `z-[9999]` | Dialog window | ✅ |
| Toast/Notification | `z-[10000]` | Always visible | ✅ |

---

## Animation Examples

### Smooth Open Animation

```
Dropdown Opening:
  
  Frame 1 (0ms):       Frame 2 (50ms):      Frame 3 (100ms):
  ┌─────┐             ┌─────┐              ┌─────┐
  │     │             │     │              │     │
  └─────┘             ├─────┤              ├─────┤
   (hidden)           │░░░░░│ (fading in) │█████│ (visible)
                      └─────┘              │█████│
                       Scale: 95%          │█████│
                       Opacity: 50%        └─────┘
                                            Scale: 100%
                                            Opacity: 100%
```

**Duration:** ~150-200ms  
**Easing:** ease-in-out  
**Properties:** opacity, scale, position

### Smooth Close Animation

```
Dropdown Closing:

  Frame 1 (0ms):       Frame 2 (50ms):      Frame 3 (100ms):
  ┌─────┐             ┌─────┐              
  │     │             │     │              (hidden)
  ├─────┤             ├─────┤              
  │█████│ (visible)   │░░░░░│ (fading out)
  │█████│             └─────┘
  │█████│              Scale: 95%
  └─────┘              Opacity: 50%
   Scale: 100%
   Opacity: 100%
```

**Duration:** ~150-200ms  
**Easing:** ease-in-out  
**Properties:** opacity, scale, position

---

## Click Outside Behavior

```
Scenario: Dropdown is open, user clicks elsewhere

┌───────────────────────────────────────────────┐
│  📋 Dropdown (z-100) - Currently Open         │
│  ┌─────────────────┐                          │
│  │ Item 1          │                          │
│  │ Item 2          │                          │
│  │ Item 3          │                          │
│  └─────────────────┘                          │
│         ▲                                     │
│         │                                     │
│         │ Click anywhere here ───────────────►│ ← Closes dropdown
│         │                                     │
│  📄 Page Content                              │
└───────────────────────────────────────────────┘

Result: Dropdown automatically closes ✅
Powered by: Radix UI's built-in Portal + Event Handling
```

---

## Escape Key Behavior

```
Scenario: Dropdown open, user presses Escape

┌───────────────────────────────────────────────┐
│  📋 Dropdown (z-100) - Currently Open         │
│  ┌─────────────────┐                          │
│  │ Item 1          │  Press ESC ───────────►  │ Closes
│  │ Item 2          │                          │
│  │ Item 3          │                          │
│  └─────────────────┘                          │
│                                               │
│  📄 Page Content                              │
└───────────────────────────────────────────────┘

Result: Dropdown automatically closes ✅
Powered by: Radix UI's keyboard handling
```

---

## Backdrop Blur Visual

```
Without Backdrop Blur:
┌───────────────────────┐
│  📋 Dropdown          │
│  ┌─────────────────┐  │
│  │ Clear boundary  │  │  ← Hard edge
│  │ Sharp text      │  │
│  └─────────────────┘  │
├───────────────────────┤
│  📄 Content below     │
│  Fully visible        │
└───────────────────────┘


With Backdrop Blur (backdrop-blur-sm):
┌───────────────────────┐
│  📋 Dropdown          │
│  ┌─────────────────┐  │
│  │ Soft boundary   │  │  ← Blurred edge
│  │ Enhanced text   │  │
│  └─────────────────┘  │
├~~~~~~~~~~~~~~~~~~~────┤  ← Blur transition
│  📄 Content below     │
│  Slightly blurred     │  ← Glassmorphism effect
└───────────────────────┘
```

**Effect:** Modern, premium appearance ✨

---

## Shadow Depth Comparison

```
shadow-md (Old):
┌─────────────────────┐
│  Dropdown           │
│                     │ ← Subtle shadow (4px)
└─────────────────────┘
  └─ Small shadow


shadow-xl (New):
┌─────────────────────┐
│  Dropdown           │
│                     │ ← Strong shadow (25px)
└─────────────────────┘
  └───── Large shadow
```

**Benefit:** Better depth perception, clearer layering 📏

---

## Responsive Behavior

### Desktop (>768px)
```
┌────────────────────────────────────┐
│  [Category ▼]                      │
│     │                              │
│     ▼                              │
│  ┌────────────────┐                │
│  │ Full dropdown  │ ← z-100        │
│  │ All items      │                │
│  │ visible        │                │
│  └────────────────┘                │
│                                    │
│  Product Grid (3-4 columns)       │
└────────────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────┐
│ [Category ▼] │
│    │         │
│    ▼         │
│ ┌──────────┐ │
│ │ Dropdown │ │ ← z-100
│ │ Scrolls  │ │
│ │ if long  │ │
│ └──────────┘ │
│              │
│ Product Grid │
│ (1 column)   │
└──────────────┘
```

**Result:** Works perfectly on all devices! 📱💻

---

## Testing Scenarios

### ✅ Scenario 1: Dropdown in Dense UI
```
Problem: Dropdown hidden behind product cards

Fix Applied:
┌───────────────────────────────────┐
│  📋 Category Dropdown (z-100)     │ ← NOW VISIBLE!
│  ┌─────────────────────────────┐  │
│  │ Textbooks                   │  │
│  │ Electronics                 │  │
│  └─────────────────────────────┘  │
├───────────────────────────────────┤
│  📄 Product Cards (z-0)           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │📚  │ │💻  │ │👕  │ │🎮  │     │
│  └────┘ └────┘ └────┘ └────┘     │
└───────────────────────────────────┘

Result: ✅ Dropdown appears above all products
```

### ✅ Scenario 2: Menu in Modal
```
Problem: Dropdown in Edit Product modal not clickable

Fix Applied:
┌─────────────────────────────────────────┐
│  🗨️ Edit Product Modal (z-9999)         │
│  ┌───────────────────────────────────┐  │
│  │ Category: [Select ▼]             │  │
│  │          ┌─────────────────────┐ │  │
│  │          │ 📋 (z-100 in modal) │ │  │ ← Visible!
│  │          │ Textbooks           │ │  │
│  │          │ Electronics         │ │  │
│  │          └─────────────────────┘ │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

Result: ✅ Dropdown works inside modals
```

### ✅ Scenario 3: Nested Menus
```
Problem: Submenu hidden behind parent menu

Fix Applied:
┌───────────────────────────────────┐
│  📋 Main Menu (z-100)             │
│  ┌─────────────────┐              │
│  │ Edit         ► ┌──────────────┐│
│  │ View           │📋 Submenu    ││ ← z-100
│  │ Delete         │ Edit Name    ││
│  └────────────────│ Edit Price   ││
│                   │ Edit Desc.   ││
│                   └──────────────┘│
└───────────────────────────────────┘

Result: ✅ Submenu appears correctly
```

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| z-index: 100 | ✅ | ✅ | ✅ | ✅ |
| backdrop-blur | ✅ | ✅ | ✅ | ✅ |
| shadow-xl | ✅ | ✅ | ✅ | ✅ |
| Transitions | ✅ | ✅ | ✅ | ✅ |
| Portal rendering | ✅ | ✅ | ✅ | ✅ |

**All modern browsers fully supported!** 🌐

---

## Quick Reference

### For Developers

**Adding a new dropdown/menu component?**

```tsx
// ✅ DO THIS:
className="... z-[100] shadow-xl backdrop-blur-sm ..."

// ❌ DON'T DO THIS:
className="... z-50 shadow-md ..."
```

**Is it a menu/dropdown or full-screen?**

| Type | Z-Index | Examples |
|------|---------|----------|
| Menu/Dropdown | `z-[100]` | Select, DropdownMenu, Popover, ContextMenu |
| Full-Screen | `z-50` | Drawer, Sheet |
| Tooltip | `z-50` | Tooltip (below menus intentionally) |
| Modal | `z-[9998+]` | Dialog, Modal |

---

## Summary

**Every interactive menu/dropdown now:**
- ✅ Appears at `z-[100]`
- ✅ Shows above all page content
- ✅ Stays below modals (correct)
- ✅ Closes on click outside
- ✅ Closes on Escape key
- ✅ Has smooth animations
- ✅ Includes backdrop blur
- ✅ Has enhanced shadows
- ✅ Works on mobile
- ✅ Works in modals

**Result: Perfect layering system!** 🎨✨

---

**Visual Reference Complete!**  
See `/MENU_DROPDOWN_LAYERING_FIXED.md` for technical details.
