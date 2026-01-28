# Modal Standardization Guide for IskoMarket

## ✅ Completed Standardization

### Global CSS Classes (in `/styles/globals.css`)

Created standardized modal classes:

- `.modal-standard` - 600px width, 80vh max height, 12px border radius, scale-in animation
- `.modal-header-standard` - Fixed header, bold 18px title, 24px padding
- `.modal-content-standard` - Scrollable body, calc(80vh - 120px) max height, hidden scrollbars, fade effects
- `.modal-footer-standard` - Fixed footer, right-aligned buttons, 8px gap
- `.modal-close-button-standard` - Fixed at top-right (20px from edges)

### Standardized Modals in `/App.tsx`

1. **Post Product Modal** - 600px width
2. **Post for a Cause Modal** - 600px with description
3. **Marketing Office Info Modal** - 400px width (smaller)
4. **Moderation Modal** - 500px width
5. **Delete Confirmation Dialog** - 500px width
6. **Delete Reason Dialog** - 500px width
7. **Notifications Page Dialog** - 850px width (larger for filters)

### Standardized Modals in `/components/AnnouncementModal.tsx`

1. **Main Announcement Modal** - 740px width
2. **Remove Confirmation Dialog** - 450px width
3. **Delete Permanently Dialog** - 450px width
4. **View Details Dialog** - 550px width

## 📋 Remaining Modals to Standardize

### AdminDashboard.tsx (19 modals)
- Total Users Modal - Line 794
- Active Users Modal - Line 938
- Active Products Modal - Line 995
- Pending Reports Modal - Line 1058
- Today's Activity Modal - Line 1116
- Flagged Users Modal - Line 1162
- User Profile Detail Modal - Line 1242
- Product Detail Modal - Line 1450
- Report Detail Modal - Line 1532
- Warning Modal - Line 1665
- Delete Product Modal - Line 1746
- Remove Account Modal - Line 1817
- Ban Confirmation - Line 1864
- Flagged User Suspend Confirmation - Line 1974
- Marketplace Stats Modal - Line 2065
- Product Details Modal - Line 2269
- Product Delete Confirmation - Line 2347
- Seller Profile Summary - Line 2407
- Audit Logs Modal - Line 2465

### Other Components
- **AuthPage.tsx** - Password Reset Success Modal (Line 1143)
- **SellerProfile.tsx** - Report User Modal (Line 133)
- **ConversationModal.tsx** - Conversation Modal (Line 78)
- **EditListingModal.tsx** - Edit Listing Modal (Line 109)
- **CvSUMarket.tsx** - Edit Product Modal (Line 271), Marketing Office Info Modal (Line 378)
- **CreditScoreModal.tsx** - Credit Score Modal (Line 73), Transaction Detail Modal (Line 239)
- **DatePickerModal.tsx** - Date Picker Modal (Line 33)
- **DashboardStatsModals.tsx** - 4 stat modals (Lines 71, 159, 259, 348)
- **InactiveAccountsPanel.tsx** - Main Panel (Line 123), Reactivate Confirmation (Line 389), Delete Confirmation (Line 433), Extend Grace Period (Line 479)
- **WarningHistoryPanel.tsx** - Main Panel (Line 138), Full Message Modal (Line 303)
- **WarningConfirmationModal.tsx** - Warning Confirmation (Line 31)
- **PreviewListingModal.tsx** - Preview Listing Modal (Line 44)

## 🔧 Standardization Instructions

### Step 1: Update DialogContent

Replace:
```tsx
<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden">
```

With:
```tsx
<DialogContent className="modal-standard">
```

For custom widths, add `!w-[XXXpx]`:
```tsx
<DialogContent className="modal-standard !w-[740px]">
```

### Step 2: Update DialogHeader

Replace:
```tsx
<DialogHeader>
  <div className="flex items-center justify-between">
    <DialogTitle>Title</DialogTitle>
    <Button onClick={onClose}>
      <X />
    </Button>
  </div>
</DialogHeader>
```

With:
```tsx
<DialogHeader className="modal-header-standard">
  <DialogTitle>Title</DialogTitle>
  <Button 
    className="modal-close-button-standard h-8 w-8 rounded-full hover:bg-muted transition-all duration-200"
    onClick={onClose}
  >
    <X className="h-4 w-4" />
  </Button>
</DialogHeader>
```

### Step 3: Update Scrollable Content

Replace:
```tsx
<div className="overflow-y-auto max-h-[calc(90vh-200px)]">
  {/* content */}
</div>
```

With:
```tsx
<div className="modal-content-standard">
  {/* content */}
</div>
```

For custom max heights:
```tsx
<div className="modal-content-standard !max-h-[400px]">
```

### Step 4: Update Footer (if applicable)

Replace:
```tsx
<div className="flex justify-end gap-3 mt-4">
  <Button>Cancel</Button>
  <Button>Confirm</Button>
</div>
```

With:
```tsx
<div className="modal-footer-standard">
  <Button>Cancel</Button>
  <Button>Confirm</Button>
</div>
```

## 🎨 Design Specifications

### Fixed Modal Size
- **Desktop Width:** 600px (default), can override with !w-[XXXpx]
- **Max Height:** 80vh
- **Border Radius:** 12px
- **Padding:** 24px inside content
- **Shadow:** 0 4px 24px rgba(0,0,0,0.2)
- **Animation:** scale(0.95 → 1.0) over 0.15s

### Mobile Responsive
- **Width:** 90vw
- **Max Height:** 90vh
- **Padding:** 16px inside content (20px header/footer)

### Scroll Behavior
- Only content body scrolls
- Header and footer remain fixed
- Subtle fade effects at top/bottom of scrollable area
- Hidden scrollbars

### Visual Consistency
- **Headers:** Bold 18px text, left-aligned
- **Close Button:** Top-right corner (20px from edges)
- **Footer Buttons:** Right-aligned, 8px gap
- **CvSU Green:** Primary accent color

## 📊 Progress

- **Completed:** 11 modals (App.tsx + AnnouncementModal.tsx)
- **Remaining:** ~50 modals across 16 components
- **Estimated Time:** 2-3 hours for complete standardization

## 🔗 Related Files

- `/styles/globals.css` - Modal CSS classes
- `/App.tsx` - Main app modals (completed)
- `/components/AnnouncementModal.tsx` - Announcement modals (completed)
- All other component files listed above (pending)

---

**Last Updated:** October 15, 2025  
**Status:** Phase 1 Complete (Core modals standardized)
