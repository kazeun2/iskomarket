# 🎨 IskoMarket - Complete Background Colors Reference

## 📋 **TABLE OF CONTENTS**
1. [Global Base Backgrounds](#global-base-backgrounds)
2. [App.tsx Main Pages](#apptsx-main-pages)
3. [ChatModal Backgrounds](#chatmodal-backgrounds)
4. [ProductDetail Modal](#productdetail-modal)
5. [Navigation Component](#navigation-component)
6. [UserDashboard Backgrounds](#userdashboard-backgrounds)
7. [ProductGrid Component](#productgrid-component)
8. [UI Components](#ui-components)
9. [Quick Fix Guide](#quick-fix-guide)

---

## 🌐 **GLOBAL BASE BACKGROUNDS**

### **File:** `/styles/globals.css`

#### **Root Variables (Lines 5-147)**

```css
:root {
  /* Light Mode Base */
  --background: #f7f8f5;              /* Soft mint off-white */
  --foreground: #003300;              /* Dark green text */
  --card: #ffffff;                    /* White cards */
  --popover: #ffffff;                 /* White popovers */
  --muted: #f7f8f5;                   /* Same as background */
  
  /* Primary Colors */
  --primary: #006400;                 /* Dark green */
  --secondary: #228b22;               /* Forest green */
  --accent: #32cd32;                  /* Lime green */
}
```

#### **Dark Mode Variables (Lines 149-196)**

```css
.dark {
  /* Dark Mode Base */
  --background: #0f172a;              /* Dark slate blue */
  --foreground: #ffffff;              /* White text */
  --card: #1e3a2e;                    /* Dark green card */
  --popover: #1e3a2e;                 /* Dark green popover */
  --muted: #2d5a2d;                   /* Medium dark green */
  
  /* Primary Colors */
  --primary: #1a5a1a;                 /* Dark green */
  --secondary: #155815;               /* Darker green */
  --accent: #1e6b1e;                  /* Medium green */
}
```

#### **Body Background (Lines 255-277)**

```css
body {
  @apply bg-background text-foreground;
  /* Light: #f7f8f5 */
  /* Dark: #0f172a */
}
```

---

## 📱 **APP.TSX MAIN PAGES**

### **File:** `/App.tsx`

#### **1. Main Container Background**

```tsx
// Line 1094-1097
<div className="flex flex-col min-h-screen bg-background">
  {/* Light: #f7f8f5 (soft mint) */}
  {/* Dark: #0f172a (dark slate) */}
</div>
```

---

#### **2. Header Banner (User Type)**

```tsx
// Line 1130
<div className={`bg-gradient-to-r ${
  userType === "admin" 
    ? "from-orange-600 via-primary to-orange-600"  // Admin: Orange gradient
    : "from-primary to-accent"                      // Student: Green gradient
} rounded-lg p-3 sm:p-4`}>

/* ADMIN MODE:
   Light: from-orange-600 (#ea580c) via-primary (#006400) to-orange-600
   Dark: Same
   
   STUDENT MODE:
   Light: from-primary (#006400) to-accent (#32cd32)
   Dark: from-primary (#1a5a1a) to-accent (#1e6b1e)
*/
```

---

#### **3. Search Bar Background**

```tsx
// Line 1273
className="... dark:bg-[#00C87D]/20 bg-[#0A6E3A]/10"

/* Light: bg-[#0A6E3A]/10 (dark green 10% opacity) */
/* Dark: dark:bg-[#00C87D]/20 (teal 20% opacity) */
```

---

#### **4. Category Filter Buttons**

```tsx
// Line 1306
className={`... ${
  category === "For a Cause"
    ? "bg-primary text-primary-foreground"     // Active: green
    : "hover:bg-[#e6f4ea] dark:hover:bg-[#193821]"  // Hover states
}`}

/* ACTIVE:
   Light: bg-primary (#006400) 
   Dark: bg-primary (#1a5a1a)
   
   HOVER (inactive):
   Light: hover:bg-[#e6f4ea] (light mint green)
   Dark: dark:hover:bg-[#193821] (dark green)
*/
```

---

#### **5. Post Product Button**

```tsx
// Line 1351
className="... dark:bg-gradient-to-r dark:from-[#003920] dark:to-[#00C47A] 
bg-gradient-to-r from-[#EFFEF4] to-[#D8FEE7]"

/* Light: Gradient from-[#EFFEF4] to-[#D8FEE7] (light mint gradients) */
/* Dark: Gradient dark:from-[#003920] dark:to-[#00C47A] (dark green to teal) */
```

---

#### **6. Admin Dashboard Card**

```tsx
// Line 1364
className="... bg-gradient-to-br from-white/85 via-white/75 to-[#F1F8F4]/70 
dark:from-[#0c251b]/95 dark:via-[#092017]/90 dark:to-[#0a1f14]/85 
backdrop-blur-[12px] dark:backdrop-blur-[18px]"

/* Light: 
   - from-white/85 (white 85% opacity)
   - via-white/75 (white 75% opacity) 
   - to-[#F1F8F4]/70 (mint 70% opacity)
   + backdrop-blur-[12px]
   
   Dark:
   - dark:from-[#0c251b]/95 (very dark green 95%)
   - dark:via-[#092017]/90 (very dark green 90%)
   - dark:to-[#0a1f14]/85 (very dark green 85%)
   + dark:backdrop-blur-[18px]
*/
```

---

#### **7. Overview Cards (CVSU Verification / For a Cause)**

```tsx
// Lines 1438, 1545
className="bg-gradient-to-b from-white/92 to-[#f6fcf7] 
dark:bg-gradient-to-b dark:from-[#003726]/90 dark:to-[#021223]"

/* Light: 
   - from-white/92 (white 92% opacity)
   - to-[#f6fcf7] (very light mint)
   
   Dark:
   - dark:from-[#003726]/90 (dark teal 90%)
   - dark:to-[#021223] (very dark blue-black)
*/
```

---

#### **8. Product Cards in Overview**

```tsx
// Lines 1497, 1620, 1755
className="bg-white/75 dark:bg-[#0F2820]/60"

/* Light: bg-white/75 (white 75% opacity) */
/* Dark: dark:bg-[#0F2820]/60 (dark green 60% opacity) */
```

---

#### **9. Progress Bar Background**

```tsx
// Line 1707
className="bg-gray-200 dark:bg-[rgba(20,184,166,0.25)]"

/* Light: bg-gray-200 (#e5e7eb) */
/* Dark: dark:bg-[rgba(20,184,166,0.25)] (teal 25% opacity) */
```

---

#### **10. Progress Bar Fill**

```tsx
// Line 1715
className="bg-gradient-to-r from-[#FFB300] to-[#F57C00] 
dark:from-emerald-400 dark:to-teal-500"

/* Light: from-[#FFB300] (orange) to-[#F57C00] (dark orange) */
/* Dark: dark:from-emerald-400 dark:to-teal-500 (green-teal gradient) */
```

---

## 💬 **CHATMODAL BACKGROUNDS**

### **File:** `/components/ChatModal.tsx`

#### **1. Modal Container**

```tsx
// Line 1048
className="w-full max-w-[700px] h-[650px] flex flex-col p-0 rounded-2xl shadow-elev-3 gap-0 overflow-hidden [&]:!p-0"
style={{ padding: 0 }}

/* Uses DialogContent default background:
   Light: bg-white (from dialog.tsx)
   Dark: bg-card (#1e3a2e)
*/
```

---

#### **2. Header (Green Banner)**

```tsx
// Line 1058
className="px-4 py-4 flex-shrink-0 bg-gradient-to-r from-green-600 to-green-700 
dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]"

/* Light: 
   - from-green-600 (#16a34a)
   - to-green-700 (#15803d)
   
   Dark:
   - dark:from-[#003726] (dark teal)
   - dark:to-[#021223] (very dark blue-black)
*/
```

---

#### **3. Product Info Box**

```tsx
// Line 1126
className="px-4 py-3 bg-white dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] 
border-b border-gray-200 dark:border-[#14b8a6]/20"

/* Light: bg-white (#ffffff) */
/* Dark: dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] */
```

---

#### **4. Status Banners**

```tsx
// Lines 1160, 1201, 1238, 1268
// PROPOSED STATUS - Yellow
className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"

// CONFIRMED STATUS - Blue
className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300"

// COMPLETED STATUS - Green  
className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"

// CANCELLED/APPEALED - Red
className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
```

---

#### **5. Messages Area (Main Chat)**

```tsx
// Line 1300
className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 min-h-0 
bg-gray-50 dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]"

/* Light: bg-gray-50 (#f9fafb) */
/* Dark: dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] */
```

---

#### **6. Message Bubbles**

```tsx
// Lines 1317-1326
// SENT (User's message) - Green
className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"

// RECEIVED (Other user) - White/Dark
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
border border-gray-200 dark:border-gray-700"

/* SENT:
   Light & Dark: from-emerald-500 to-emerald-600 (green gradient)
   
   RECEIVED:
   Light: bg-white (#ffffff)
   Dark: dark:bg-gray-800 (#1f2937)
*/
```

---

#### **7. Input Section**

```tsx
// Line 1500
className="flex-shrink-0 border-t border-gray-200 dark:border-[#14b8a6]/20 
bg-white dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]"

/* Light: bg-white (#ffffff) */
/* Dark: dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223] */
```

---

#### **8. Message Input Textarea**

```tsx
// Line 1539
className="flex-1 resize-none rounded-[20px] px-3 py-3 
bg-[#F3F7F5] dark:bg-[#1E1E1E]"

/* Light: bg-[#F3F7F5] (very light mint) */
/* Dark: dark:bg-[#1E1E1E] (very dark gray) */
```

---

#### **9. Send Button**

```tsx
// Line 1552
className="h-10 w-10 rounded-full 
bg-gradient-to-br from-emerald-500 to-emerald-600 
hover:from-emerald-600 hover:to-emerald-700"

/* Light & Dark: 
   Normal: from-emerald-500 to-emerald-600
   Hover: hover:from-emerald-600 hover:to-emerald-700
*/
```

---

## 🏷️ **PRODUCTDETAIL MODAL**

### **File:** `/components/ProductDetail.tsx`

#### **1. Modal Container (Glassmorphism)**

```tsx
// Line 212
className="relative w-full max-w-3xl max-h-[92vh] rounded-[32px] 
bg-white/75 dark:bg-[#0a120e]/65 
border-[1.5px] border-[rgba(0,120,60,0.18)] dark:border-[rgba(0,255,180,0.12)] 
backdrop-blur-xl"

/* Light: 
   - bg-white/75 (white 75% opacity)
   - border-[rgba(0,120,60,0.18)] (green 18%)
   + backdrop-blur-xl
   
   Dark:
   - dark:bg-[#0a120e]/65 (very dark green 65%)
   - dark:border-[rgba(0,255,180,0.12)] (bright teal 12%)
   + backdrop-blur-xl
*/
```

---

#### **2. Close Button**

```tsx
// Line 223
className="h-10 w-10 rounded-full 
bg-white/80 dark:bg-gray-900/80 
backdrop-blur-md 
border border-gray-200/50 dark:border-gray-700/50"

/* Light: bg-white/80 (white 80%) */
/* Dark: dark:bg-gray-900/80 (very dark gray 80%) */
```

---

#### **3. Product Image Section**

```tsx
// Line 234
<div className="relative -mx-10 -mt-10 mb-8">
  {/* No background - transparent */}
</div>
```

---

#### **4. Condition Badge**

```tsx
// Line 248
className={`${getConditionColor(product.condition)} 
text-xs px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm border`}

/* Dynamic colors from getConditionColor() function:
   Brand New: bg-emerald-100 dark:bg-emerald-900/40
   Like New: bg-blue-100 dark:bg-blue-900/40
   Good: bg-amber-100 dark:bg-amber-900/40
   Fair: bg-orange-100 dark:bg-orange-900/40
*/
```

---

#### **5. Category Badge**

```tsx
// Line 251
className="bg-white/95 dark:bg-gray-900/95 
text-gray-700 dark:text-gray-300 
border-gray-200 dark:border-gray-700"

/* Light: bg-white/95 (white 95%) */
/* Dark: dark:bg-gray-900/95 (very dark gray 95%) */
```

---

#### **6. Seller Card**

```tsx
// Line 345
className="bg-white/60 dark:bg-gray-900/30 
border border-gray-200/70 dark:border-gray-700/50 
rounded-[20px] p-5"

/* Light: bg-white/60 (white 60%) */
/* Dark: dark:bg-gray-900/30 (very dark gray 30%) */
```

---

#### **7. Review Cards**

```tsx
// Line 417
className="bg-white/40 dark:bg-gray-900/20 
border border-gray-200/50 dark:border-gray-700/30 
rounded-2xl p-4"

/* Light: bg-white/40 (white 40%) */
/* Dark: dark:bg-gray-900/20 (very dark gray 20%) */
```

---

#### **8. Bottom Action Bar**

```tsx
// Line 441
className="absolute bottom-0 left-0 right-0 
bg-white/90 dark:bg-[#0a120e]/90 
backdrop-blur-xl 
border-t border-gray-200/50 dark:border-gray-700/50"

/* Light: bg-white/90 (white 90%) + backdrop-blur-xl */
/* Dark: dark:bg-[#0a120e]/90 (very dark green 90%) + backdrop-blur-xl */
```

---

## 🧭 **NAVIGATION COMPONENT**

### **File:** `/components/Navigation.tsx`

#### **1. Main Navigation Bar**

```tsx
// Line 196
className="sticky top-0 z-50 w-full border-b backdrop-blur 
supports-[backdrop-filter]:bg-background/90"

/* Light: bg-background/90 (#f7f8f5 at 90% opacity) */
/* Dark: bg-background/90 (#0f172a at 90% opacity) */
```

---

#### **2. Navigation Links (Active)**

```tsx
// Line 236
className="bg-[#E9F7EE] dark:bg-[rgba(20,184,166,0.15)] 
text-[#1A8E3F] dark:text-[#14B8A6]"

/* Light: bg-[#E9F7EE] (very light green) */
/* Dark: dark:bg-[rgba(20,184,166,0.15)] (teal 15%) */
```

---

#### **3. Navigation Links (Hover)**

```tsx
// Line 237
className="hover:bg-[rgba(26,142,63,0.08)] dark:hover:bg-[rgba(20,184,166,0.1)]"

/* Light: hover:bg-[rgba(26,142,63,0.08)] (green 8%) */
/* Dark: dark:hover:bg-[rgba(20,184,166,0.1)] (teal 10%) */
```

---

#### **4. Profile Dropdown Menu**

```tsx
// Line 401
className={`${isDarkMode 
  ? 'bg-gradient-to-br from-[#003726]/95 to-[#021223]/95 border-[#14b8a6]/20 backdrop-blur-xl' 
  : 'bg-white/95 border-[#cfe8ce]'
}`}

/* Light: bg-white/95 (white 95%) */
/* Dark: 
   - from-[#003726]/95 (dark teal 95%)
   - to-[#021223]/95 (dark blue-black 95%)
   + backdrop-blur-xl
*/
```

---

#### **5. Mobile Navigation**

```tsx
// Line 517
className="fixed top-16 left-0 right-0 
bg-[#FFFFFF] dark:bg-[#1A1A1A] 
border-b border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]"

/* Light: bg-[#FFFFFF] (pure white) */
/* Dark: dark:bg-[#1A1A1A] (very dark gray) */
```

---

#### **6. Notification Modal**

```tsx
// Line 605
className={`${isDarkMode 
  ? 'bg-gradient-to-br from-[#003726] to-[#021223] border-[#14b8a6]/20' 
  : 'bg-white border-[#cfe8ce]'
}`}

/* Light: bg-white (#ffffff) */
/* Dark: from-[#003726] to-[#021223] (dark teal to dark blue-black) */
```

---

#### **7. Notification Search Input**

```tsx
// Line 746
className={`${isDarkMode 
  ? 'bg-[#0a2f1f]/40 border-[#14b8a6]/20' 
  : 'bg-white border-[#cfe8ce]'
}`}

/* Light: bg-white (#ffffff) */
/* Dark: bg-[#0a2f1f]/40 (dark green 40%) */
```

---

## 📊 **USERDASHBOARD BACKGROUNDS**

### **File:** `/components/UserDashboard.tsx`

#### **1. Stats Cards**

```tsx
// Lines 494, 504, 514, 524
className="bg-gradient-to-br from-white to-gray-50 
dark:from-[#003726]/40 dark:to-[#021223]/60 
border border-gray-200/50 dark:border-[#14b8a6]/20 
backdrop-blur-sm"

/* Light: from-white to-gray-50 (#f9fafb) */
/* Dark: dark:from-[#003726]/40 dark:to-[#021223]/60 (teal to dark blue) */
```

---

#### **2. Tabs List**

```tsx
// Line 565
className="bg-gradient-to-br from-white to-gray-50 
dark:from-[#003726]/30 dark:to-[#021223]/50 
border border-gray-200/50 dark:border-[#14b8a6]/20 
backdrop-blur-sm"

/* Light: from-white to-gray-50 */
/* Dark: dark:from-[#003726]/30 dark:to-[#021223]/50 */
```

---

#### **3. Product/Transaction Cards**

```tsx
// Lines 625, 723, 726, 816
className="bg-gradient-to-br from-white to-gray-50 
dark:from-[#003726]/40 dark:to-[#021223]/60 
border border-gray-200/50 dark:border-[#14b8a6]/20 
backdrop-blur-sm"

/* Light: from-white to-gray-50 */
/* Dark: dark:from-[#003726]/40 dark:to-[#021223]/60 */
```

---

#### **4. Priority Transaction Highlight**

```tsx
// Line 722-723
className="ring-2 ring-orange-400 dark:ring-orange-600 
bg-gradient-to-br from-orange-50/50 to-orange-100/50 
dark:from-orange-950/20 dark:to-orange-900/20"

/* Light: from-orange-50/50 to-orange-100/50 */
/* Dark: dark:from-orange-950/20 dark:to-orange-900/20 */
```

---

## 🗂️ **PRODUCTGRID COMPONENT**

### **File:** `/components/ProductGrid.tsx`

#### **1. Product Card Overlay**

```tsx
// Line 281
className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-40"

/* Light & Dark: from-black/30 (black 30% opacity) */
```

---

## 🔧 **UI COMPONENTS**

### **Dialog Overlay**

**File:** `/components/ui/dialog.tsx` (Line 93)

```tsx
className="bg-[#00000066] backdrop-blur-sm"

/* Light & Dark: bg-[#00000066] (black 40% opacity) + backdrop-blur */
```

---

### **Alert Dialog Overlay**

**File:** `/components/ui/alert-dialog.tsx` (Line 39)

```tsx
className="bg-[#00000066] backdrop-blur-sm"

/* Light & Dark: bg-[#00000066] (black 40% opacity) + backdrop-blur */
```

---

## 🚨 **QUICK FIX GUIDE**

### **If your deployed site has color errors, check these:**

#### **1. CSS Variables Not Loading**

**Problem:** Colors appear wrong or default
**Fix:** Ensure `/styles/globals.css` is imported in your build

```tsx
// In App.tsx or main entry file
import './styles/globals.css';
```

---

#### **2. Dark Mode Not Working**

**Problem:** Dark mode colors don't apply
**Fix:** Check if `.dark` class is added to `<html>` or `<body>`

```javascript
// Verify dark mode is active
console.log(document.documentElement.classList.contains('dark'));
// Should return true when dark mode is on
```

---

#### **3. Tailwind Not Processing Custom Colors**

**Problem:** Custom hex colors like `bg-[#003726]` not working
**Fix:** Ensure Tailwind v4 is configured properly

```javascript
// Check if custom classes are in the build
// Look for these in your compiled CSS:
bg-\[#003726\]
dark\:bg-\[#021223\]
```

---

#### **4. Gradient Backgrounds Not Showing**

**Problem:** Gradients appear as solid colors
**Fix:** Check if `bg-gradient-*` classes are being applied

```tsx
// Verify in browser DevTools:
className="bg-gradient-to-br from-[#003726] to-[#021223]"

// Should show in Computed styles:
background-image: linear-gradient(to bottom right, #003726, #021223);
```

---

#### **5. Opacity/Alpha Values Not Working**

**Problem:** `/60`, `/40` opacity not applying
**Fix:** Ensure Tailwind is processing opacity values

```tsx
// These should work:
bg-white/75    // 75% opacity
bg-[#003726]/90    // 90% opacity

// If not working, use rgba:
bg-[rgba(0,55,38,0.90)]
```

---

## 📋 **COMPLETE BACKGROUND COLOR PALETTE**

### **Light Mode**

| Element | Background | Hex |
|---------|------------|-----|
| **Body** | `bg-background` | `#f7f8f5` |
| **Cards** | `bg-white` | `#ffffff` |
| **Hover** | `bg-[#e6f4ea]` | `#e6f4ea` |
| **Active** | `bg-primary` | `#006400` |
| **Input** | `bg-white` | `#ffffff` |
| **Gray Area** | `bg-gray-50` | `#f9fafb` |

---

### **Dark Mode**

| Element | Background | Hex |
|---------|------------|-----|
| **Body** | `bg-background` | `#0f172a` |
| **Cards** | `dark:bg-[#003726]` + `dark:to-[#021223]` | Gradient |
| **Hover** | `dark:bg-[#193821]` | `#193821` |
| **Active** | `dark:bg-primary` | `#1a5a1a` |
| **Input** | `dark:bg-[#1E1E1E]` | `#1E1E1E` |
| **Gray Area** | `dark:bg-gradient-to-br from-[#003726] to-[#021223]` | Gradient |

---

## 🎨 **SIGNATURE GRADIENTS**

### **Dark Mode Signature**

```tsx
// Used in: ChatModal, ProductDetail, UserDashboard, Navigation
dark:bg-gradient-to-br dark:from-[#003726] dark:to-[#021223]

/* From: #003726 (dark teal)
   To: #021223 (very dark blue-black) */
```

### **Light Mode Cards**

```tsx
// Used in: Overview cards, Stats
bg-gradient-to-br from-white to-gray-50

/* From: #ffffff (white)
   To: #f9fafb (light gray) */
```

### **Green Header Gradient**

```tsx
// Used in: ChatModal header
bg-gradient-to-r from-green-600 to-green-700

/* Light Mode:
   From: #16a34a (green-600)
   To: #15803d (green-700) */
```

---

## ✅ **VERIFICATION CHECKLIST**

Use this to verify all backgrounds are working:

- [ ] Body background is soft mint `#f7f8f5` (light) or `#0f172a` (dark)
- [ ] ChatModal header is green gradient
- [ ] ChatModal messages area is `bg-gray-50` (light) or teal gradient (dark)
- [ ] ProductDetail modal has glassmorphism effect
- [ ] Navigation bar has backdrop blur
- [ ] Cards use white-to-gray gradient (light) or teal gradient (dark)
- [ ] Hover states show green tints
- [ ] Message bubbles: green (sent), white/gray (received)
- [ ] Input fields have visible backgrounds
- [ ] Dark mode uses `#003726` to `#021223` gradient consistently

---

**This document covers ALL background colors used across the entire IskoMarket platform!** 🎨
