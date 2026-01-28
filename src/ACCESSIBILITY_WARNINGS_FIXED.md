# Accessibility Warnings Fixed

## Issue
Radix UI Dialog components were showing accessibility warnings:
```
Warning: Missing `Description` or `aria-describedby={undefined}` for {DialogContent}.
```

## Solution
Added proper `DialogHeader` with `DialogTitle` and `DialogDescription` to all Dialog components in App.tsx.

### Implementation Pattern

For each dialog, we now use:
```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="modal-standard">
    {/* Hidden accessibility header */}
    <DialogHeader className="sr-only">
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>
        Description of what this modal does
      </DialogDescription>
    </DialogHeader>
    
    {/* Visible custom header */}
    <div className="modal-header-standard relative">
      <h2 className="text-lg">Modal Title</h2>
      <Button
        variant="ghost"
        size="icon"
        className="modal-close-button-standard h-6 w-6 rounded-full"
        onClick={() => setIsOpen(false)}
        aria-label="Close dialog"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
    
    {/* Modal content */}
    <div className="modal-content-standard">
      {/* Content goes here */}
    </div>
  </DialogContent>
</Dialog>
```

## Fixed Dialogs in App.tsx

1. **Post Product Modal**
   - Added DialogHeader with sr-only class
   - Replaced DialogTitle with h2 in visible header
   - Description: "Post a product listing to the marketplace"

2. **Post for a Cause Modal**
   - Added DialogHeader with sr-only class
   - Replaced DialogTitle with h2 and description with p tag in visible header
   - Description: "Create a fundraising listing to support your cause..."

3. **Marketing Office Info Modal**
   - Added DialogHeader with sr-only class
   - Replaced DialogTitle with h2 in visible header
   - Description: "View CvSU Marketing Office information and schedule"

4. **Moderation Modal**
   - Added DialogHeader with sr-only class
   - Converted DialogTitle wrapper to div with h2 for visible header
   - Description: "Review moderation action details"

5. **Delete Confirmation Dialog**
   - Added DialogHeader with sr-only class
   - Converted DialogTitle wrapper to div with h2 for visible header
   - Description: "Confirm deletion of product listing"

6. **Delete Reason Dialog**
   - Added DialogHeader with sr-only class
   - Replaced DialogTitle with h2 in visible header
   - Description: "Provide reason for deleting this product"

7. **Notifications Page Dialog** ✅
   - Already had proper DialogHeader implementation

## Why This Approach?

### Accessibility Benefits
- **Screen Readers**: The sr-only DialogHeader provides semantic information to assistive technologies
- **ARIA Compliance**: Satisfies Radix UI's accessibility requirements
- **Visual Design**: Custom visible headers maintain our design system while staying accessible

### Technical Benefits
- **No Breaking Changes**: Existing visual design remains unchanged
- **Standards Compliant**: Follows Radix UI accessibility guidelines
- **Future Proof**: Works with all current and future Radix UI versions

## Testing

All accessibility warnings should now be resolved. To verify:
1. Open the browser console
2. Check for any Dialog-related warnings
3. Use a screen reader to verify proper announcement of modal titles and descriptions

## Notes

- The `sr-only` class hides content visually but keeps it accessible to screen readers
- Each dialog has both a hidden DialogHeader (for accessibility) and a visible custom header (for design)
- This pattern should be used for all future dialog implementations
