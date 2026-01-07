# Quick Actions Update Instructions

## Changes Required in AdminDashboard.tsx

### 1. Add SystemAlertModal Component at the End (After line 2976)

Add this code after the `<FullSeasonStatsModal />` component and before the closing `</div>`:

```tsx
      {/* System Alert Modal */}
      <SystemAlertModal
        isOpen={showSystemAlert}
        onClose={() => setShowSystemAlert(false)}\n      />
```

### 2. Add Button to Quick Actions Card (After line 764)

Add this code after the "Season Summary" button and before `</CardContent>`:

```tsx

                <Button 
                  className="w-full justify-start quick-action-button system-alert" 
                  data-quick-action="system-alert"
                  onClick={() => setShowSystemAlert(true)}
                >
                  <AlertOctagon className="h-4 w-4 mr-2" />
                  System Alert & Maintenance Notification
                </Button>
```

## Notes
- The `showSystemAlert` state variable already exists (line 54)
- The `SystemAlertModal` component is already imported (line 3)
- The `AlertOctagon` icon is already imported (line 2)
- These changes will make the "System Alert & Maintenance Notification" button visible in the Quick Actions panel
