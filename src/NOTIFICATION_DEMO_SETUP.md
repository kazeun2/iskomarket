# Notification System - Quick Demo Setup

## Complete Working Example

This guide shows how to set up the notification system with demo data for testing.

## Step-by-Step Integration

### 1. Add to App.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { NotificationItem } from './components/NotificationDropdown';
import { notificationSystem } from './components/NotificationSystem';
import { SystemAnnouncementDetailsModal } from './components/SystemAnnouncementDetailsModal';
import { ReportWarningDetailsModal } from './components/ReportWarningDetailsModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';

function App() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = notificationSystem.subscribe(setNotifications);
    
    // Generate demo notifications on mount
    setTimeout(() => generateDemoNotifications(), 1000);
    
    return unsubscribe;
  }, []);

  // Handle notification clicks
  const handleNotificationClick = (notification: NotificationItem) => {
    const { type, actionData } = notification;

    switch (type) {
      case 'message':
        // Open chat
        console.log('Open chat:', actionData?.chatId);
        // Your chat opening logic here
        break;

      case 'system':
        // Open announcement
        setSelectedAnnouncement({
          id: actionData?.announcementId || '',
          title: notification.title.replace('📣 ', ''),
          content: notification.description + '\n\nFull announcement details would be loaded from your backend.',
          postedBy: 'Admin Team',
          postedDate: notification.timestamp,
          category: 'maintenance',
          urgent: notification.urgent
        });
        setShowAnnouncementModal(true);
        break;

      case 'report':
      case 'warning':
        // Open report details
        setSelectedReport({
          id: actionData?.reportId || '',
          type: 'warning',
          title: notification.title,
          reason: notification.description,
          details: 'Detailed explanation of the violation and recommended actions.',
          issuedDate: notification.timestamp,
          severity: notification.urgent ? 'high' : 'medium',
          canAppeal: true,
          reviewedBy: 'Admin Team'
        });
        setShowReportModal(true);
        break;

      case 'transaction':
        // Open product details
        console.log('Open product:', actionData?.productId);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        currentView="marketplace"
        setCurrentView={(view) => console.log('Navigate to:', view)}
        userType="student"
        setUserType={() => {}}
        currentUser={{ name: 'Test User', email: 'test@cvsu.edu.ph' }}
        onSignOut={() => console.log('Sign out')}
        isDarkMode={false}
        onToggleTheme={() => console.log('Toggle theme')}
        onOpenProfileSettings={() => console.log('Open profile')}
        onOpenFeedback={() => console.log('Open feedback')}
        notifications={notifications}
        onMarkAllNotificationsRead={() => notificationSystem.markAllAsRead()}
        onMarkNotificationRead={(id) => notificationSystem.markAsRead(id)}
        onNotificationClick={handleNotificationClick}
        onOpenNotifications={() => setShowNotificationSettings(true)}
      />

      {/* Your app content here */}
      <main className="container mx-auto px-4 py-8">
        <h1>IskoMarket - Notification System Demo</h1>
        <button 
          onClick={generateDemoNotifications}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Generate Demo Notifications
        </button>
      </main>

      {/* Notification Modals */}
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {selectedAnnouncement && (
        <SystemAnnouncementDetailsModal
          isOpen={showAnnouncementModal}
          onClose={() => {
            setShowAnnouncementModal(false);
            setSelectedAnnouncement(null);
          }}
          announcement={selectedAnnouncement}
        />
      )}

      {selectedReport && (
        <ReportWarningDetailsModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setSelectedReport(null);
          }}
          onAppeal={() => {
            console.log('Open appeal form');
          }}
          report={selectedReport}
        />
      )}
    </div>
  );
}

// Demo notification generator
function generateDemoNotifications() {
  // Clear existing
  notificationSystem.clearAll();

  // Add various notifications
  setTimeout(() => {
    notificationSystem.onNewMessage(
      'Anna Reyes',
      'user-123',
      'Hi! Is the textbook still available?',
      'chat-456'
    );
  }, 100);

  setTimeout(() => {
    notificationSystem.onSystemAnnouncement(
      'System Maintenance Notice',
      'Scheduled maintenance on Jan 30 from 2-4 AM',
      'announce-789',
      true
    );
  }, 200);

  setTimeout(() => {
    notificationSystem.onWarningIssued(
      'Inappropriate product description',
      'report-101'
    );
  }, 300);

  setTimeout(() => {
    notificationSystem.onTransactionCompleted(
      'Carlos Martinez',
      'Gaming Laptop - ASUS ROG',
      'product-202'
    );
  }, 400);

  setTimeout(() => {
    notificationSystem.onReceivedRating(
      'Maria Santos',
      5,
      'Introduction to Psychology Textbook'
    );
  }, 500);

  setTimeout(() => {
    notificationSystem.onIskoinEarned(
      50,
      'Completed transaction'
    );
  }, 600);

  setTimeout(() => {
    notificationSystem.onNewMessage(
      'John Doe',
      'user-789',
      'Can we meet tomorrow at 2pm?',
      'chat-999'
    );
  }, 700);

  setTimeout(() => {
    notificationSystem.onCreditScoreMilestone(
      100,
      'Trustworthy Badge unlocked!'
    );
  }, 800);

  console.log('✅ 8 demo notifications generated!');
}

export default App;
```

## Bell Icon Positioning Reference

The notification dropdown appears at:
- **Position**: Fixed, top-right corner
- **Right**: 16px from edge
- **Top**: 72px from top (below navbar)
- **Width**: 420px
- **Max Height**: 580px

```
┌────────────────────────────────────────────┐
│ [Logo] IskoMarket    [Home][Shop][🔔][👤] │ ← Navbar (64px)
│                                   ▲        │
│                                   │        │
│                      ┌────────────┴──────┐ │
│                      │ Notifications  ⚙️ │ │ ← Dropdown starts at 72px
│                      ├──────────────────┤ │
│                      │ [All][Unread]... │ │
│                      ├──────────────────┤ │
│                      │ 📧 Message       │ │
│                      │    3m ago •      │ │
│                      ├──────────────────┤ │
│                      │ 📣 System        │ │
│                      │    2h ago        │ │
│                      └──────────────────┘ │
│                                            │
│ [Your app content here]                   │
└────────────────────────────────────────────┘
```

## Notification Types & Click Actions

| Type | Icon | Click Action | Modal Opened |
|------|------|--------------|--------------|
| Message | ✉️ | Open chat | ChatModal |
| System | 📣 | Show announcement | SystemAnnouncementDetailsModal |
| Warning | ⚠️ | Show warning details | ReportWarningDetailsModal |
| Transaction | 🧾 | Open product | ProductDetail |
| Appeal | 📩 | Show appeal result | ReportWarningDetailsModal |

## Testing the System

### 1. Click Bell Icon
- Should toggle dropdown open/closed
- Badge shows unread count
- Green dot visible if unread exists

### 2. View Notifications
- All tab: Shows all notifications
- Unread tab: Shows only unread
- Messages tab: Shows only messages
- System tab: Shows system notifications
- Reports tab: Shows warnings/reports

### 3. Click a Notification
- Automatically marks as read
- Opens appropriate modal
- Closes dropdown
- Badge count decreases

### 4. Settings Icon
- Opens NotificationSettingsModal
- Configure preferences per category
- Save settings

### 5. Mark All Read
- Button appears when unread exist
- Marks all as read instantly
- Badge disappears
- Unread tab becomes empty

## Customization

### Change Dropdown Position

```typescript
// In NotificationDropdown.tsx
className="fixed right-4 top-[72px] ..."

// Move to left side:
className="fixed left-4 top-[72px] ..."

// Adjust top position:
className="fixed right-4 top-[80px] ..." // More gap
```

### Change Dropdown Width

```typescript
// Current: 420px
className="... w-[420px] ..."

// Wider:
className="... w-[500px] ..."

// Narrower:
className="... w-[360px] ..."
```

### Change Max Height

```typescript
// Current: 580px
style={{ maxHeight: '580px' }}

// Taller:
style={{ maxHeight: '700px' }}

// Shorter:
style={{ maxHeight: '400px' }}
```

## Advanced Features

### Auto-refresh Notifications

```typescript
useEffect(() => {
  // Poll for new notifications every 30 seconds
  const interval = setInterval(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        // Add new notifications
        data.forEach((notif: any) => {
          notificationSystem.onNewMessage(
            notif.fromUser,
            notif.userId,
            notif.message,
            notif.chatId
          );
        });
      });
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

### Real-time with WebSocket

```typescript
useEffect(() => {
  const ws = new WebSocket('wss://your-api.com/notifications');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case 'new_message':
        notificationSystem.onNewMessage(
          data.fromUser,
          data.userId,
          data.message,
          data.chatId
        );
        break;
      
      case 'announcement':
        notificationSystem.onSystemAnnouncement(
          data.title,
          data.content,
          data.id,
          data.urgent
        );
        break;
    }
  };

  return () => ws.close();
}, []);
```

### Persist Notifications

```typescript
// Save to localStorage
useEffect(() => {
  const notifications = notificationSystem.getNotifications();
  localStorage.setItem('notifications', JSON.stringify(notifications));
}, [notifications]);

// Load from localStorage
useEffect(() => {
  const saved = localStorage.getItem('notifications');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Restore notifications
  }
}, []);
```

## Troubleshooting

### Dropdown not appearing
1. Check `isOpen` state in Navigation
2. Verify bell icon has `data-notification-trigger` attribute
3. Check z-index (should be 100)
4. Inspect console for errors

### Dropdown in wrong position
1. Check navbar height (default 64px)
2. Verify `top` value (72px = navbar + gap)
3. Test on different screen sizes
4. Check for CSS conflicts

### Click actions not working
1. Verify `onNotificationClick` is passed to Navigation
2. Check notification has `actionData`
3. Ensure modals are imported and have state
4. Check switch statement cases

### Notifications not updating
1. Verify `notificationSystem.subscribe()` is called
2. Check if notifications are being created
3. Test with `generateDemoNotifications()`
4. Check browser console for errors

## Performance Tips

1. **Limit notifications**: Keep max 100 in state
2. **Virtual scrolling**: Use for 50+ notifications
3. **Debounce updates**: Batch notification creation
4. **Lazy load modals**: Code-split detail modals
5. **Optimize re-renders**: Use React.memo for cards

## Next Steps

- [ ] Add notification sound effects
- [ ] Implement push notifications
- [ ] Add notification grouping
- [ ] Create notification history page
- [ ] Add notification search
- [ ] Implement notification filters
- [ ] Add batch actions
- [ ] Create notification analytics
