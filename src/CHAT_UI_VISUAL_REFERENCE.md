# Chat System UI Visual Reference

## Modal Dimensions
- **Width:** 700px
- **Height:** 650px
- **Border Radius:** 16px (rounded-2xl)

## Chat Bubbles

### User's Messages (Right-aligned)
```
┌────────────────────────────────────┐
│                   ┌─────────────┐ │
│                   │ User Message│ │
│                   │ Text here...│ │
│                   └─────────────┘ │
│                       12:45 PM ✓✓ │
└────────────────────────────────────┘
```
- **Background:** #007A33 (Green)
- **Text Color:** #FFFFFF (White)
- **Border Radius:** 24px (all corners except bottom-right: 4px)
- **Padding:** 16px × 10px

### Other User's Messages (Left-aligned)
```
┌────────────────────────────────────┐
│ ┌─────────────┐                   │
│ │Other Message│                   │
│ │ Text here...│                   │
│ └─────────────┘                   │
│ 12:45 PM                          │
└────────────────────────────────────┘
```
- **Background:** #F1F1F1 (Light Gray)
- **Text Color:** #000000 (Black)
- **Border Radius:** 24px (all corners except bottom-left: 4px)
- **Padding:** 16px × 10px

## Action Buttons (Bottom Right)

### Layout
```
┌────────────────────────────────────────────────────┐
│ [Text Input Field...........................]      │
│                                                    │
│    [Choose Meet-up] [✓ Mark Done] [→ Send]        │
└────────────────────────────────────────────────────┘
```

### Button States

#### Choose Meet-up (Active)
- **Visible:** When no date set AND not marked as done
- **Icon:** Calendar
- **Color:** Primary green
- **Tooltip:** "Choose meet-up date"

#### Mark as Done (✓)
- **Visible:** When not marked as done
- **Icon:** Check (green)
- **Tooltip:** "Mark conversation as done"
- **Hover:** Light green background (#D5F5E3)

#### Cancel Done (✕)
- **Visible:** When marked as done
- **Icon:** XCircle (red)
- **Tooltip:** "Cancel done status"
- **Hover:** Light red background (#F9EBEA)

#### Send Message (→)
- **Always Visible**
- **Icon:** Send arrow
- **Color:** #007A33 (active) / #CCCCCC (disabled)
- **State:** Disabled when input is empty

## Status Banners

### Banner Types

#### 1. Scheduled Meet-up Banner (Persistent)
```
┌────────────────────────────────────────────────────┐
│ 📅 Scheduled Meet-up: October 25, 2025            │
│    Location: Main Gate, Cavite State University   │
│    Awaiting confirmation from other user...       │
└────────────────────────────────────────────────────┘
```
- **Background:** rgba(0, 122, 51, 0.1) - Light green
- **Border:** rgba(0, 122, 51, 0.3)
- **Icon Color:** Primary green

#### 2. Mark as Done Banner (5 seconds)
```
┌────────────────────────────────────────────────────┐
│ 🗂️ Conversation Marked as Done – Meet-up         │
│    scheduling disabled.                            │
└────────────────────────────────────────────────────┘
```
- **Background:** #EAECEE (Gray)
- **Border:** #D0D3D6
- **Duration:** 5 seconds
- **Animation:** Fade in/out

#### 3. Conversation Restored Banner (5 seconds)
```
┌────────────────────────────────────────────────────┐
│ 🔄 Conversation restored to active state.         │
└────────────────────────────────────────────────────┘
```
- **Background:** #D5F5E3 (Light green)
- **Border:** #A8E6CF
- **Duration:** 5 seconds
- **Animation:** Fade in/out

#### 4. Countdown Timer Banner (Persistent until deadline)
```
┌────────────────────────────────────────────────────┐
│ ⏳ 5 days left to confirm transaction result      │
│    Both parties must confirm completion before    │
│    deadline                                        │
└────────────────────────────────────────────────────┘
```
- **Background:** Amber (#FEF3C7) or Red (#FEE2E2) if ≤2 days
- **Border:** Amber/Red based on urgency
- **Icon Color:** Amber-600 or Red-600

#### 5. Transaction Completed Banner
```
┌────────────────────────────────────────────────────┐
│ ✅ Transaction Completed                          │
│    Please rate your experience with this user     │
│                                     [Rate User]    │
└────────────────────────────────────────────────────┘
```
- **Background:** #D5F5E3 (Light green)
- **Border:** #A8E6CF
- **Button:** Outline style with green border

#### 6. Unsuccessful Transaction Banner
```
┌────────────────────────────────────────────────────┐
│ ⚠️ Transaction Marked as Unsuccessful             │
│    7 days passed without confirmation from both   │
│    parties                          [Appeal]       │
└────────────────────────────────────────────────────┘
```
- **Background:** #F9EBEA (Light red)
- **Border:** #F5C6CB
- **Button:** Red outline style

## Input Area

### Layout
```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ Type a message...                            │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│     [Choose Meet-up]  [✓]  [→]                    │
└────────────────────────────────────────────────────┘
```

- **Textarea:**
  - Min height: 44px
  - Max height: 144px (6 lines)
  - Border radius: 24px (rounded-3xl)
  - Background: Muted (light gray)
  - Padding: 12px × 16px

- **Buttons Row:**
  - Gap: 8px between buttons
  - Aligned to right of textarea
  - Height: 40px (h-10)

## Color Palette

### Active States
- **Primary Green:** #007A33
- **Success Green:** #D5F5E3
- **Success Border:** #A8E6CF

### Disabled/Inactive States
- **Disabled Gray:** #EAECEE
- **Border Gray:** #D0D3D6
- **Button Disabled:** #CCCCCC

### Warning/Error States
- **Error Red:** #F9EBEA
- **Error Border:** #F5C6CB
- **Warning Amber:** #FEF3C7
- **Warning Border:** #FDE68A

### Text Colors
- **Primary Text:** #000000 (light mode) / #FFFFFF (dark mode)
- **Secondary Text:** #6B7280 (gray-500)
- **Muted Text:** #9CA3AF (gray-400)

## Animations

### Transition Timing
- **All state changes:** 0.3s ease
- **Banner fade in/out:** 0.3s ease
- **Button hover:** 0.2s ease
- **Message appear:** 0.3s fade + slide

### Banner Timing
- **Display Duration:** 5000ms (5 seconds)
- **Fade In:** 300ms
- **Fade Out:** 300ms

### Button Effects
- **Hover Scale:** None (removed as per guidelines)
- **Hover Background:** 20% opacity overlay
- **Active State:** Solid color change

## Responsive Behavior

### Desktop (≥1024px)
- Full 700px width
- All features visible
- Side-by-side button layout

### Tablet (768px - 1023px)
- Reduced to 90% viewport width
- Buttons remain horizontal
- Text wraps in banners

### Mobile (<768px)
- Full width with padding
- Buttons stack vertically if needed
- Smaller font sizes in banners

## Accessibility

### ARIA Labels
- Close button: "Close dialog"
- Choose meet-up: "Choose meet-up date"
- Mark as done: "Mark conversation as done"
- Cancel done: "Cancel done status"
- Send message: "Send message"

### Keyboard Navigation
- **Tab:** Navigate between buttons
- **Enter:** Send message (without Shift)
- **Shift+Enter:** New line in textarea
- **Escape:** Close modal

### Screen Reader Announcements
- Banner changes announced via aria-live
- Message sent confirmation
- Transaction status updates

## Tooltips

### Timing
- **Appear Delay:** 500ms
- **Disappear:** Instant on mouse leave

### Content
- Choose Meet-up: "Choose meet-up date"
- Mark as Done: "Mark conversation as done - Disables transaction automations"
- Cancel Done: "Cancel done status - Restores transaction automations"

### Position
- Above button (default)
- Adjust if near viewport edge
