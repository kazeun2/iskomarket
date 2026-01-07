# Close Button Update Script

Replace all instances of:
```
className="h-8 w-8 rounded-full hover:bg-muted transition-colors absolute right-4 top-4"
```

With:
```
className="h-8 w-8 rounded-full hover:bg-muted transition-all duration-200 absolute right-4 top-4"
```

And add `aria-label="Close dialog"` to each Button component.

Files to update:
1. AdminDashboard.tsx (10 instances)
2. SellerProfile.tsx (1 instance)
3. ConversationModal.tsx (1 instance)
4. EditListingModal.tsx (1 instance)
5. CreditScoreModal.tsx (2 instances)
6. DatePickerModal.tsx (1 instance)
7. InactiveAccountsPanel.tsx (1 instance)
8. WarningHistoryPanel.tsx (2 instances)
9. WarningConfirmationModal.tsx (1 instance)
