# Accessibility Fix Required - DialogDescription Missing

## Issue
Multiple Dialog components have `aria-describedby={undefined}` which suppresses accessibility warnings instead of properly fixing them. All dialogs MUST have a `DialogDescription` component for screen reader accessibility.

## Solution Pattern
Remove `aria-describedby={undefined}` from `DialogContent` and add a `DialogDescription` component inside `DialogHeader`:

### Before (INCORRECT):
```tsx
<DialogContent className="sm:max-w-[700px]" aria-describedby={undefined}>
  <DialogHeader>
    <DialogTitle>Modal Title</DialogTitle>
  </DialogHeader>
```

### After (CORRECT):
```tsx
<DialogContent className="sm:max-w-[700px]">
  <DialogHeader>
    <DialogTitle>Modal Title</DialogTitle>
    <DialogDescription className="sr-only">
      Brief description of what this modal does
    </DialogDescription>
  </DialogHeader>
```

**Note:** Use `className="sr-only"` to hide the description visually while keeping it accessible to screen readers.

## Files Requiring Fixes

### 1. `/components/AdminDashboard.tsx` (16 instances)
- Line 1071: Pending Reports Modal
- Line 1129: Today's Activity Modal  
- Line 1175: Flagged Users Modal
- Line 1255: User Profile Detail Modal
- Line 1463: Product Detail Modal
- Line 1545: Report Detail Modal
- Line 1743: Warning Modal
- Line 1824: Delete Product Modal
- Line 1887: Remove Account Modal
- Line 1934: Ready to Send Notice Modal
- Line 2044: Flagged User Suspend Confirmation Modal
- Line 2135: Marketplace Stats Modal
- Line 2339: Product Details Modal
- Line 2421: Product Delete Confirmation Modal
- Line 2481: Seller Profile Summary Modal
- Line 2582: Audit Logs Modal

### 2. `/components/CvSUMarket.tsx` (2 instances)
- Line 282: Edit Product Modal
- Line 389: Marketing Office Info Modal

### 3. `/components/InactiveAccountsPanel.tsx` (4 instances)
- Line 123: Main Panel
- Line 389: Reactivate Confirmation
- Line 433: Delete Confirmation
- Line 479: Extend Grace Period

### 4. `/components/WarningHistoryPanel.tsx` (3 instances)
- Line 142: Main Panel
- Line 298: Full Message Modal
- Line 452: Send Warning Again Modal

### 5. `/components/WarningConfirmationModal.tsx` (1 instance)
- Line 31: Confirmation Modal

## Example Descriptions by Modal Type

### Dashboard Stats Modals
```tsx
<DialogDescription className="sr-only">
  View detailed statistics and analytics
</DialogDescription>
```

### Confirmation Modals
```tsx
<DialogDescription className="sr-only">
  Confirm your action before proceeding
</DialogDescription>
```

### Edit/Form Modals
```tsx
<DialogDescription className="sr-only">
  Edit and update information
</DialogDescription>
```

### Detail View Modals
```tsx
<DialogDescription className="sr-only">
  View detailed information and manage settings
</DialogDescription>
```

## WCAG 2.1 Requirements
- **Success Criterion 1.3.1** (Level A): Information and relationships conveyed through presentation must be programmatically determined
- **Success Criterion 4.1.2** (Level A): For all user interface components, the name and role can be programmatically determined

Adding `DialogDescription` ensures screen readers can announce the purpose of each modal to users.

## Priority
**HIGH** - This affects accessibility for screen reader users and is a WCAG Level A requirement.

## Next Steps
1. Go through each file listed above
2. Remove `aria-describedby={undefined}` from DialogContent
3. Add appropriate `DialogDescription` with `className="sr-only"` inside DialogHeader
4. Test with a screen reader to verify announcements
