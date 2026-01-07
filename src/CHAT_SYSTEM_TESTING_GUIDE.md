# Chat System Testing Guide

## Overview
This guide provides step-by-step instructions to test all features of the Message & Chat System with transaction automation.

## Prerequisites
- IskoMarket app running
- Two user accounts (Buyer and Seller)
- Sample product posted by seller
- Access to browser dev console for credit score tracking

## Test Scenarios

### 1. Basic Chat Functionality

#### Test 1.1: Open Chat Modal
**Steps:**
1. Navigate to marketplace
2. Click on any product
3. Click "Message Seller" button
4. Verify modal opens with 700×650 dimensions

**Expected:**
- ✓ Modal appears centered
- ✓ Seller's avatar and name visible in header
- ✓ Product card shown below header
- ✓ Initial messages loaded
- ✓ Input area visible at bottom

#### Test 1.2: Send Message
**Steps:**
1. Type a message in textarea
2. Click send button (or press Enter)
3. Observe message appears

**Expected:**
- ✓ Message appears right-aligned (green bubble)
- ✓ 24px border radius applied
- ✓ Timestamp shown below
- ✓ Status icons appear (✓ → ✓✓ → ✓✓ green)
- ✓ Textarea clears after send

#### Test 1.3: Multiline Message
**Steps:**
1. Type text
2. Press Shift+Enter multiple times
3. Observe textarea expansion

**Expected:**
- ✓ Textarea grows with content
- ✓ Maximum 6 lines (144px)
- ✓ Scrollbar appears if needed
- ✓ Resets to 44px after sending

---

### 2. Chat Moderation System

#### Test 2.1: Inappropriate Content (English)
**Steps:**
1. Type message: "This is a fucking scam"
2. Try to send

**Expected:**
- ✓ Message blocked (not sent)
- ✓ Toast: "Message blocked - Inappropriate content detected"
- ✓ Description: "-5 credit deducted"
- ✓ Console log shows credit deduction
- ✓ Textarea NOT cleared

#### Test 2.2: Inappropriate Content (Filipino)
**Steps:**
1. Type message: "Tangina gago ka"
2. Try to send

**Expected:**
- ✓ Message blocked
- ✓ Same toast notification
- ✓ -5 credit deduction logged

#### Test 2.3: Scam Keywords
**Steps:**
1. Type message: "This is fake and fraud"
2. Try to send

**Expected:**
- ✓ Message blocked
- ✓ Moderation alert shown
- ✓ Credit penalty applied

#### Test 2.4: Clean Message
**Steps:**
1. Type message: "The product looks great!"
2. Send message

**Expected:**
- ✓ Message sent successfully
- ✓ No moderation warnings
- ✓ No credit penalties

---

### 3. Meet-up Scheduling

#### Test 3.1: Choose Meet-up Date
**Steps:**
1. In chat, click "Choose Meet-up" button
2. DatePicker modal opens
3. Select future date
4. Confirm selection

**Expected:**
- ✓ "Choose Meet-up" button visible initially
- ✓ DatePicker modal appears (z-index higher than chat)
- ✓ Date selection works
- ✓ Banner appears: "📅 Scheduled Meet-up: [date]"
- ✓ Banner auto-dismisses after 5 seconds
- ✓ "Choose Meet-up" button now hidden
- ✓ Toast: "Meet-up date proposed!"

#### Test 3.2: Prevent Duplicate Date Selection
**Steps:**
1. After date is set, check for "Choose Meet-up" button
2. Try to access date picker again

**Expected:**
- ✓ Button remains hidden
- ✓ No way to change date
- ✓ Persistent banner shows scheduled date

#### Test 3.3: Meet-up When Marked as Done
**Steps:**
1. Before setting date, click "Mark as Done" (✓ icon)
2. Try to click "Choose Meet-up"

**Expected:**
- ✓ "Choose Meet-up" button disabled/hidden
- ✓ Toast error if attempting to access
- ✓ Banner: "Meet-up scheduling disabled"

---

### 4. Mark as Done / Cancel Done

#### Test 4.1: Mark Conversation as Done
**Steps:**
1. In active chat, click checkmark (✓) button
2. Observe changes

**Expected:**
- ✓ Button changes from ✓ to ✕ icon
- ✓ Banner appears: "🗂️ Conversation Marked as Done"
- ✓ Banner color: #EAECEE (gray)
- ✓ Banner visible for 5 seconds
- ✓ Toast: "Conversation marked as done"
- ✓ "Choose Meet-up" button hidden (if visible)
- ✓ Transaction banners hidden
- ✓ Chat still functional

#### Test 4.2: Cancel Done Status
**Steps:**
1. After marking as done, click ✕ button
2. Observe restoration

**Expected:**
- ✓ Button changes from ✕ to ✓
- ✓ Banner: "🔄 Conversation restored to active state"
- ✓ Banner color: #D5F5E3 (green)
- ✓ Banner visible for 5 seconds
- ✓ Toast: "Conversation restored"
- ✓ "Choose Meet-up" button reappears (if no date set)
- ✓ Transaction features re-enabled

#### Test 4.3: Chat Active While Marked as Done
**Steps:**
1. Mark conversation as done
2. Send a normal message
3. Try to send inappropriate message

**Expected:**
- ✓ Normal messages send successfully
- ✓ Inappropriate messages still blocked
- ✓ Moderation remains active
- ✓ Credit penalties still apply

---

### 5. Transaction Confirmation Flow

#### Test 5.1: Countdown Timer After Meetup
**Steps:**
1. Set meet-up date to yesterday (use dev console to modify)
2. Observe countdown banner

**Expected:**
- ✓ Banner: "⏳ X days left to confirm transaction result"
- ✓ Color changes: Amber (>2 days) → Red (≤2 days)
- ✓ Warning text shown
- ✓ Confirmation button appears

#### Test 5.2: Single Party Confirmation
**Steps:**
1. With countdown active, click "Confirm Success" button
2. Observe status

**Expected:**
- ✓ Banner: "⏳ Waiting for other party to confirm"
- ✓ Button disappears
- ✓ Toast: "Confirmation recorded!"
- ✓ Transaction status remains "scheduled"

#### Test 5.3: Both Parties Confirm
**Steps:**
1. First user confirms
2. Simulate other user confirming (dev console)
3. Observe completion

**Expected:**
- ✓ Banner: "✅ Transaction Completed"
- ✓ Banner color: Green (#D5F5E3)
- ✓ Toast: "Transaction confirmed successfully!"
- ✓ Rating modal auto-opens after 1 second
- ✓ +2 credit awarded to both parties

#### Test 5.4: Transaction Marked Unsuccessful
**Steps:**
1. Set meetup date to 8 days ago (dev console)
2. Don't confirm
3. Wait for auto-update

**Expected:**
- ✓ Status changes to "unsuccessful"
- ✓ Banner: "⚠️ Transaction Marked as Unsuccessful"
- ✓ Banner color: Red (#F9EBEA)
- ✓ "Appeal" button appears
- ✓ Credit penalties may apply

---

### 6. Rating System

#### Test 6.1: Rating After Completed Transaction
**Steps:**
1. Complete transaction (both confirm)
2. Click "Rate User" button in banner
3. Or wait for auto-open

**Expected:**
- ✓ RateThisUserModal opens
- ✓ Star rating interface shown
- ✓ Review textarea available
- ✓ Submit button active

#### Test 6.2: Rating Restriction - No Transaction
**Steps:**
1. In chat with no transaction, try to access rating
2. Look for rating button

**Expected:**
- ✓ No "Rate User" button visible
- ✓ If accessed via dev console, error toast shown
- ✓ Error: "Rating unavailable - complete transaction first"

#### Test 6.3: Rating Restriction - Incomplete Transaction
**Steps:**
1. Schedule meetup but don't confirm
2. Try to access rating

**Expected:**
- ✓ Rating button not shown
- ✓ Error if forced to open
- ✓ Message: "Both parties must confirm first"

#### Test 6.4: Submit Rating
**Steps:**
1. Open rating modal
2. Select 5 stars
3. Write review: "Great seller!"
4. Submit

**Expected:**
- ✓ Rating submitted successfully
- ✓ Toast: "Review submitted successfully!"
- ✓ Description: "+1 credit point earned"
- ✓ Rated user gets +2 credit (4-5 stars)
- ✓ Modal closes
- ✓ "Rate User" button disappears
- ✓ Banner: "Thank you for your review!"

#### Test 6.5: Rating Already Submitted
**Steps:**
1. After submitting rating, check for rating option
2. Try to rate again

**Expected:**
- ✓ "Rate User" button not shown
- ✓ Banner shows "Thank you for your review!"
- ✓ No way to re-rate

---

### 7. Banner Timing & Display

#### Test 7.1: 5-Second Banner Duration
**Steps:**
1. Mark as done
2. Start timer when banner appears
3. Observe dismissal

**Expected:**
- ✓ Banner appears immediately
- ✓ Banner visible for exactly 5 seconds
- ✓ Smooth fade-out animation (300ms)
- ✓ Banner completely removed after fade

#### Test 7.2: Multiple Banner Triggers
**Steps:**
1. Mark as done (banner 1)
2. Immediately cancel done (banner 2)
3. Observe behavior

**Expected:**
- ✓ First banner replaced by second
- ✓ Timer resets to 5 seconds
- ✓ Only one banner visible at a time
- ✓ Smooth transition

#### Test 7.3: Persistent vs Temporary Banners
**Steps:**
1. Schedule meetup (persistent banner)
2. Mark as done (temporary banner)
3. Wait 5 seconds

**Expected:**
- ✓ Temporary banner appears above persistent
- ✓ Temporary banner dismisses after 5s
- ✓ Persistent banner remains
- ✓ No layout shift

---

### 8. UI/UX Verification

#### Test 8.1: Modal Dimensions
**Steps:**
1. Open chat
2. Use browser dev tools to measure
3. Check dimensions

**Expected:**
- ✓ Width: 700px
- ✓ Height: 650px
- ✓ Properly centered on screen
- ✓ Responsive on smaller screens

#### Test 8.2: Chat Bubble Styling
**Steps:**
1. Send messages from both users
2. Inspect bubble elements
3. Verify styles

**Expected:**
- ✓ Border radius: 24px
- ✓ User bubbles: Bottom-right 4px
- ✓ Other bubbles: Bottom-left 4px
- ✓ Background colors match spec
- ✓ Proper padding and spacing

#### Test 8.3: Button Transitions
**Steps:**
1. Hover over each button
2. Click each button
3. Observe animations

**Expected:**
- ✓ All transitions: 0.3s duration
- ✓ Hover effects smooth
- ✓ No scale transformations
- ✓ Color changes smooth
- ✓ Icon changes smooth

#### Test 8.4: Dark Mode Compatibility
**Steps:**
1. Enable dark mode
2. Open chat
3. Check all elements

**Expected:**
- ✓ All text readable
- ✓ Banners adapt colors
- ✓ Buttons maintain contrast
- ✓ Borders visible
- ✓ No white flashes

---

### 9. Edge Cases

#### Test 9.1: Very Long Message
**Steps:**
1. Type 1000+ character message
2. Send

**Expected:**
- ✓ Textarea scrolls before max height
- ✓ Message sends successfully
- ✓ Bubble wraps text properly
- ✓ No overflow issues

#### Test 9.2: Rapid Button Clicking
**Steps:**
1. Click "Mark as Done" 5 times quickly
2. Observe state

**Expected:**
- ✓ State changes only once
- ✓ No duplicate banners
- ✓ No state confusion
- ✓ Button disabled during transition

#### Test 9.3: Close Modal During Banner
**Steps:**
1. Trigger 5-second banner
2. Close modal after 2 seconds
3. Reopen modal

**Expected:**
- ✓ Modal closes cleanly
- ✓ No lingering banners
- ✓ State preserved on reopen
- ✓ No memory leaks

#### Test 9.4: Network Delay Simulation
**Steps:**
1. Throttle network in dev tools
2. Send message
3. Observe status icons

**Expected:**
- ✓ Message shows "sent" (✓)
- ✓ Changes to "delivered" (✓✓ gray)
- ✓ Changes to "read" (✓✓ green)
- ✓ Timing appropriate for network speed

---

### 10. Integration Testing

#### Test 10.1: Notification System Integration
**Steps:**
1. Complete transaction
2. Check notification center
3. Submit rating

**Expected:**
- ✓ Transaction confirmation notification
- ✓ Rating received notification
- ✓ Notifications clickable
- ✓ Navigate to appropriate modal

#### Test 10.2: Credit Score Integration
**Steps:**
1. Check current credit score
2. Send inappropriate message (-5)
3. Complete transaction (+2)
4. Submit rating (+1)
5. Receive 5-star rating (+2)
6. Check final credit score

**Expected:**
- ✓ All changes logged
- ✓ Math adds up correctly
- ✓ Credit badge updates
- ✓ Admin dashboard reflects changes

#### Test 10.3: Admin Dashboard Monitoring
**Steps:**
1. Trigger moderation violation
2. Mark transaction unsuccessful
3. Submit appeal
4. Check admin panel

**Expected:**
- ✓ Violations appear in moderation queue
- ✓ Failed transactions listed
- ✓ Appeals reviewable
- ✓ User activity tracked

---

## Automated Testing Checklist

### Unit Tests
- [ ] Chat moderation regex patterns
- [ ] Credit score calculations
- [ ] Banner timing logic
- [ ] Transaction state machine
- [ ] Rating restriction logic

### Integration Tests
- [ ] Full transaction flow (schedule → confirm → rate)
- [ ] Mark as done → cancel done cycle
- [ ] Moderation → credit deduction
- [ ] Notification generation
- [ ] Multi-user interactions

### E2E Tests
- [ ] Complete buyer-seller transaction
- [ ] Inappropriate content handling
- [ ] Appeal submission process
- [ ] Admin intervention scenarios
- [ ] Edge case handling

---

## Performance Benchmarks

### Target Metrics
- Modal open time: <200ms
- Message send latency: <500ms
- Banner display: 5000ms ±50ms
- Transition animations: 300ms
- Memory usage: <50MB for 100 messages

### Monitoring
- Use React DevTools Profiler
- Chrome Performance tab
- Network tab for API calls
- Memory snapshots for leaks

---

## Bug Reporting Template

```markdown
### Bug Title
[Brief description]

### Severity
[ ] Critical - Blocks functionality
[ ] Major - Impacts user experience
[ ] Minor - Cosmetic or edge case

### Steps to Reproduce
1. 
2. 
3. 

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Console Errors
[Attach here]

### Environment
- Browser: 
- Screen size: 
- Dark mode: Yes/No
- User role: Buyer/Seller/Admin
```

---

## Test Results Tracker

| Test ID | Feature | Status | Notes |
|---------|---------|--------|-------|
| 1.1 | Open modal | ⏳ | |
| 1.2 | Send message | ⏳ | |
| 2.1 | Moderation (EN) | ⏳ | |
| 2.2 | Moderation (FIL) | ⏳ | |
| 3.1 | Choose meetup | ⏳ | |
| 4.1 | Mark as done | ⏳ | |
| 4.2 | Cancel done | ⏳ | |
| 5.3 | Both confirm | ⏳ | |
| 6.1 | Submit rating | ⏳ | |
| ... | ... | ... | |

**Legend:**
- ⏳ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Needs review
