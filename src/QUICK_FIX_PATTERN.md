# Quick Fix Pattern for Accessibility Errors

## Find and Replace Pattern

For each dialog in the affected files, perform these two steps:

### Step 1: Remove aria-describedby
**Find:** `aria-describedby={undefined}`  
**Replace with:** (empty string - delete it)

### Step 2: Add DialogDescription  
After each `<DialogTitle>` tag, add:
```tsx
<DialogDescription className="sr-only">
  [Appropriate description based on modal purpose]
</DialogDescription>
```

## Suggested Descriptions by Modal

### AdminDashboard.tsx Modals

```tsx
// Pending Reports Modal (line 1071)
<DialogDescription className="sr-only">
  View and manage all pending product and user reports
</DialogDescription>

// Today's Activity Modal (line 1129)
<DialogDescription className="sr-only">
  View today's marketplace activity and recent actions
</DialogDescription>

// Flagged Users Modal (line 1175)
<DialogDescription className="sr-only">
  View and manage users flagged for policy violations
</DialogDescription>

// User Profile Detail Modal (line 1255)
<DialogDescription className="sr-only">
  View detailed user profile information and activity history
</DialogDescription>

// Product Detail Modal (line 1463)
<DialogDescription className="sr-only">
  View product details and manage product listing
</DialogDescription>

// Report Detail Modal (line 1545)
<DialogDescription className="sr-only">
  View comprehensive report details and take action
</DialogDescription>

// Warning Modal (line 1743)
<DialogDescription className="sr-only">
  Send a warning notification to the user
</DialogDescription>

// Delete Product Modal (line 1824)
<DialogDescription className="sr-only">
  Confirm product deletion and provide reason
</DialogDescription>

// Remove Account Modal (line 1887)
<DialogDescription className="sr-only">
  Permanently remove user account from the system
</DialogDescription>

// Ready to Send Notice Modal (line 1934)
<DialogDescription className="sr-only">
  Review and confirm warning or suspension notice
</DialogDescription>

// Flagged User Suspend Confirmation Modal (line 2044)
<DialogDescription className="sr-only">
  Confirm account suspension and review details
</DialogDescription>

// Marketplace Stats Modal (line 2135)
<DialogDescription className="sr-only">
  View comprehensive marketplace statistics and analytics
</DialogDescription>

// Product Details Modal (line 2339)
<DialogDescription className="sr-only">
  View reported product details and take action
</DialogDescription>

// Product Delete Confirmation Modal (line 2421)
<DialogDescription className="sr-only">
  Confirm product deletion with notification to seller
</DialogDescription>

// Seller Profile Summary Modal (line 2481)
<DialogDescription className="sr-only">
  View seller profile and all their product listings
</DialogDescription>

// Audit Logs Modal (line 2582)
<DialogDescription className="sr-only">
  View admin audit logs and system activity history
</DialogDescription>
```

### CvSUMarket.tsx Modals

```tsx
// Edit Product Modal (line 282)
<DialogDescription className="sr-only">
  Edit product details for CvSU official merchandise
</DialogDescription>

// Marketing Office Info Modal (line 389)
<DialogDescription className="sr-only">
  View CvSU Marketing Office hours and location
</DialogDescription>
```

### InactiveAccountsPanel.tsx Modals

```tsx
// Main Panel (line 123)
<DialogDescription className="sr-only">
  Manage inactive user accounts and grace periods
</DialogDescription>

// Reactivate Confirmation (line 389)
<DialogDescription className="sr-only">
  Confirm account reactivation and restore access
</DialogDescription>

// Delete Confirmation (line 433)
<DialogDescription className="sr-only">
  Confirm permanent deletion of inactive account
</DialogDescription>

// Extend Grace Period (line 479)
<DialogDescription className="sr-only">
  Extend grace period for inactive account
</DialogDescription>
```

### WarningHistoryPanel.tsx Modals

```tsx
// Main Panel (line 142)
<DialogDescription className="sr-only">
  View complete warning history for all users
</DialogDescription>

// Full Message Modal (line 298)
<DialogDescription className="sr-only">
  View complete warning message details
</DialogDescription>

// Send Warning Again Modal (line 452)
<DialogDescription className="sr-only">
  Resend warning notification to user
</DialogDescription>
```

### WarningConfirmationModal.tsx

```tsx
// Confirmation Modal (line 31)
<DialogDescription className="sr-only">
  Review and confirm warning details before sending
</DialogDescription>
```

## Implementation Order (Priority)

1. **HIGH**: AdminDashboard.tsx (most modals, core functionality)
2. **MEDIUM**: InactiveAccountsPanel.tsx, WarningHistoryPanel.tsx, WarningConfirmationModal.tsx
3. **LOW**: CvSUMarket.tsx

## Testing Checklist

After making changes:
- [ ] No console warnings about missing DialogDescription
- [ ] All modals open and close properly
- [ ] Screen reader announces modal purpose when opened
- [ ] Visual appearance unchanged (sr-only class hides description)
