# Notification Cards - Visual Reference

## Card Structure & Components

### Basic Card Anatomy
```
┌─────────────────────────────────────────────────────────────┐
│  [Icon]  Title Text                              Timestamp  │
│          Description/Preview text that can                 │
│          span multiple lines                               │
│          [🟢 New]                                          │
└─────────────────────────────────────────────────────────────┘
```

## Notification Types & Their Cards

### 1. Message Notification ✉️

**Icon**: ✉️ (Envelope emoji + MessageCircle icon)  
**Color**: #3A9DF9 (Blue)  
**Click Action**: Opens ChatModal with that user

```
┌─────────────────────────────────────────────────────────────┐
│  ✉️  New Message from Anna Reyes                     3m ago │
│      "Hi! Is the textbook still available?"                │
│      🟢 New                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Example Code**:
```typescript
notificationSystem.onNewMessage(
  'Anna Reyes',
  'user-123',
  'Hi! Is the textbook still available?',
  'chat-456'
);
```

### 2. System Announcement 📣

**Icon**: 📣 (Megaphone emoji + Megaphone icon)  
**Color**: #3BAE5C (Green)  
**Click Action**: Opens SystemAnnouncementDetailsModal

```
┌─────────────────────────────────────────────────────────────┐
│  📣  System Maintenance Notice                        2h ago │
│      Scheduled maintenance on Jan 30 from 2-4 AM           │
│      🟢 New                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Example Code**:
```typescript
notificationSystem.onSystemAnnouncement(
  'System Maintenance Notice',
  'Scheduled maintenance on Jan 30 from 2-4 AM',
  'announce-789',
  false // urgent
);
```

### 3. Warning Issued ⚠️

**Icon**: ⚠️ (Warning emoji + AlertTriangle icon)  
**Color**: #FFA733 (Orange/Yellow)  
**Click Action**: Opens ReportWarningDetailsModal with appeal option

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Warning Issued                      [URGENT]     1d ago │
│      Inappropriate product description                     │
│      🟢 New                                                 │
└─────────────────────────────────────────────────────────────┘
```

**Example Code**:
```typescript
notificationSystem.onWarningIssued(
  'Inappropriate product description',
  'report-101'
);
```

### 4. Transaction Completed 🧾

**Icon**: 🧾 (Receipt emoji + CheckCircle icon)  
**Color**: #3BAE5C (Green)  
**Click Action**: Opens ProductDetail or transaction page

```
┌─────────────────────────────────────────────────────────────┐
│  ✅  Transaction Completed                            5d ago │
│      Transaction with Carlos Martinez for "Gaming          │
│      Laptop" was confirmed successful                      │
└─────────────────────────────────────────────────────────────┘
```

**Example Code**:
```typescript
notificationSystem.onTransactionCompleted(
  'Carlos Martinez',
  'Gaming Laptop - ASUS ROG',
  'product-202'
);
```

### 5. Appeal Response 📩

**Icon**: 📩 (Incoming envelope emoji + FileText icon)  
**Color**: #9B59B6 (Purple)  
**Click Action**: Opens ReportWarningDetailsModal with result

```
┌─────────────────────────────────────────────────────────────┐
│  📩  Appeal Response Received                         3d ago │
│      Your appeal was approved. Your evidence was           │
│      reviewed and found valid.                             │
└─────────────────────────────────────────────────────────────┘
```

**Example Code**:
```typescript
notificationSystem.onAppealReviewed(
  'approved', // or 'rejected'
  'appeal-303',
  'Your evidence was reviewed and found valid.'
);
```

### 6. Rating Received ⭐

**Icon**: ⭐ (Star emoji + CheckCircle icon)  
**Color**: #3BAE5C (Green)  
**Click Action**: Opens user profile or rating details

```
┌─────────────────────────────────────────────────────────────┐
│  ⭐  New Rating Received                              2d ago │
│      Maria Santos rated you 5 stars for "Gaming Laptop"   │
└─────────────────────────────────────────────────────────────┘
```

**Example Code**:
```typescript
notificationSystem.onReceivedRating(
  'Maria Santos',
  5,
  'Gaming Laptop - ASUS ROG'
);
```

## Card States

### Unread State
- **Background**: Light green tint (rgba(59, 174, 92, 0.05) light / 0.1 dark)
- **Indicator**: 🟢 Green dot + "New" badge
- **Font Weight**: 600 (semibold) for title
- **Opacity**: 100%

```
┌─────────────────────────────────────────────────────────────┐
│ [Background: Light green tint]                              │
│  ✉️  New Message from Anna Reyes                     3m ago │
│      "Hi! Is the textbook still available?"                │
│      🟢 New                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Read State
- **Background**: Transparent
- **Indicator**: No dot or badge
- **Font Weight**: 500 (medium) for title
- **Opacity**: 80%

```
┌─────────────────────────────────────────────────────────────┐
│ [Background: Transparent]                                   │
│  ✉️  New Message from Anna Reyes                     3m ago │
│      "Hi! Is the textbook still available?"                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Urgent State
- **Badge**: Red "Urgent" badge next to timestamp
- **Priority**: Appears at top of list
- **Background**: Slightly more prominent

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Warning Issued                      [URGENT]     1d ago │
│      Inappropriate product description                     │
│      🟢 New                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Hover Effects

### Before Hover
```css
background: transparent (if read) or light green (if unread)
cursor: default
```

### On Hover
```css
background: rgba(59, 174, 92, 0.08) light / 0.15 dark
cursor: pointer
transition: all 200ms
```

## Timestamp Formats

| Time Elapsed | Format |
|-------------|--------|
| < 1 minute | "Just now" |
| < 60 minutes | "3m ago", "45m ago" |
| < 24 hours | "2h ago", "23h ago" |
| < 7 days | "1d ago", "6d ago" |
| ≥ 7 days | "Jan 24", "Dec 15" |

## Icon Mapping

| Notification Type | Emoji | Lucide Icon | Color |
|------------------|-------|-------------|--------|
| Message | ✉️ | MessageCircle | #3A9DF9 (Blue) |
| System | 📣 | Megaphone | #3BAE5C (Green) |
| Warning | ⚠️ | AlertTriangle | #FFA733 (Orange) |
| Report | ⚠️ | AlertTriangle | #FFA733 (Orange) |
| Transaction | 🧾 | CheckCircle | #3BAE5C (Green) |
| Appeal | 📩 | FileText | #9B59B6 (Purple) |

## Priority Sorting Algorithm

Cards are sorted by:

1. **Read Status**: Unread first
2. **Priority Score**: High to low
3. **Timestamp**: Recent first

```
Priority Score = (Type Weight × Urgency) - (Time Elapsed / 10)

Type Weights:
- Message: 10
- Report/Warning: 8
- Appeal: 7
- Transaction: 6
- System: 5

Urgency:
- Normal: 1
- Urgent: 2
```

## Tab Filtering

### All Tab
Shows all notifications (no filter)

### Unread Tab
```typescript
notifications.filter(n => !n.read)
```

### Read Tab
```typescript
notifications.filter(n => n.read)
```

### Messages Tab
```typescript
notifications.filter(n => n.category === 'message')
```

### System Tab
```typescript
notifications.filter(n => n.category === 'system')
```

### Reports Tab
```typescript
notifications.filter(n => n.category === 'report')
```

## Empty States

### All Tab Empty
```
        📭
  You're all caught up!
No new notifications right now.
```

### Unread Tab Empty
```
        📭
  You're all caught up!
   No unread notifications.
```

### Messages Tab Empty
```
        📭
  You're all caught up!
  No message notifications.
```

### System Tab Empty
```
        📭
  You're all caught up!
   No system notifications.
```

### Reports Tab Empty
```
        📭
  You're all caught up!
   No report notifications.
```

## Modal Layout (Centered)

```
┌─────────────────────────────────────────────────────────────┐
│                     [Full Screen Backdrop]                  │
│                     Semi-transparent Black                  │
│                                                             │
│        ┌─────────────────────────────────────┐             │
│        │ [Header - Dark Green #004E2B]       │             │
│        │  Notifications     [5]  Mark All ⚙️ │             │
│        ├─────────────────────────────────────┤             │
│        │ All│Unread│Read│Msg│Sys│Report      │             │
│        ├─────────────────────────────────────┤             │
│        │                                     │             │
│        │  [Notification Card 1]              │             │
│        │  [Notification Card 2]              │             │
│        │  [Notification Card 3]              │             │
│        │  [Notification Card 4]              │             │
│        │       ...scrollable...              │             │
│        │                                     │             │
│        └─────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Click Action Flow Diagram

```
User clicks notification card
         │
         ├─ Type: Message
         │    └─> Open ChatModal with user/product
         │
         ├─ Type: System
         │    └─> Open SystemAnnouncementDetailsModal
         │
         ├─ Type: Report/Warning
         │    └─> Open ReportWarningDetailsModal
         │         └─ If appealable: Show "Submit Appeal" button
         │
         ├─ Type: Appeal
         │    └─> Open ReportWarningDetailsModal (result view)
         │         └─ Show approved/rejected status
         │
         └─ Type: Transaction
              └─> Open ProductDetail or transaction page
```

## Responsive Behavior

### Desktop (≥ 768px)
- Modal width: 600px
- Modal height: 450px max
- Tab labels: Full text
- All features visible

### Tablet (≥ 640px < 768px)
- Modal width: 90vw
- Modal height: 80vh max
- Tab labels: Full text
- Scrollable content

### Mobile (< 640px)
- Modal width: 95vw
- Modal height: 90vh max
- Tab labels: Icons only
- Larger tap targets (44px min)
- Swipe to close (optional)

## Accessibility Features

- **Keyboard Navigation**: Tab through cards, Enter to open
- **Screen Reader**: Announces notification count and content
- **ARIA Labels**: All interactive elements labeled
- **Focus Indicators**: Visible focus rings
- **Color Contrast**: WCAG AA compliant
- **Reduced Motion**: Respects prefers-reduced-motion

## Animation Timing

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Modal entrance | Zoom + Fade | 200ms | ease-out |
| Card hover | Background | 200ms | ease |
| Tab switch | Content fade | 200ms | ease |
| Badge pulse | Scale | 2s | ease-in-out |

## Example: Full Notification Flow

1. **User receives new message**
   ```typescript
   notificationSystem.onNewMessage('Anna', 'user-123', 'Hi!', 'chat-456');
   ```

2. **Notification appears in dropdown**
   - Bell icon shows green dot + badge (1)
   - Card appears at top of "All" and "Unread" tabs
   - Card has green background tint

3. **User clicks notification card**
   - Mark as read automatically
   - ChatModal opens with Anna
   - Green dot disappears from bell
   - Card moves to "Read" tab

4. **Visual feedback**
   - Card opacity changes to 80%
   - Background becomes transparent
   - Green dot and "New" badge removed
   - Font weight changes from 600 to 500

## Best Practices

✅ **Do**:
- Keep titles concise (< 50 characters)
- Provide meaningful descriptions
- Use appropriate icons for types
- Show timestamps consistently
- Sort by priority and recency
- Mark as read on click
- Group similar notifications

❌ **Don't**:
- Use generic titles like "Notification"
- Omit timestamps
- Mix up icon types
- Show expired notifications (> 30 days)
- Spam with too many notifications
- Hide important warnings
- Make cards un-clickable

## Performance Considerations

- Limit to 100 notifications in memory
- Virtualize lists with 50+ items
- Debounce notification creation (500ms)
- Cache read status locally
- Lazy load notification details
- Optimize re-renders with useMemo

## Testing Checklist

- [ ] All notification types render correctly
- [ ] Icons display properly (emoji + Lucide)
- [ ] Timestamps format correctly
- [ ] Click actions route to correct modals
- [ ] Read/unread states work
- [ ] Tab filtering works for all tabs
- [ ] Empty states show correctly
- [ ] Hover effects work smoothly
- [ ] Modal centers on screen
- [ ] Backdrop closes modal
- [ ] Urgent badges display
- [ ] Badge counts update
- [ ] Mark all as read works
- [ ] Settings modal opens
- [ ] Responsive on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader announces
