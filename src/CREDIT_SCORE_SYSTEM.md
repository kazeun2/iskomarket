# Credit Score System - Auto-Managed Implementation Complete

## Overview
The Credit Score System is a comprehensive auto-managed reputation system for IskoMarket that tracks user behavior and automatically adjusts credit scores based on marketplace actions. All verified CvSU students begin at **70 points** on registration.

## 🎯 Credit Score Tiers & Visual UI

### Range-Based Tier System

| Range | Color | Emoji | Tier Name | Meaning | Ring Color |
|-------|-------|-------|-----------|---------|------------|
| **100** | 💎 **Cyan** | 💎 | **Elite Isko** | Maximum credibility achieved! | Cyan gradient with pulse animation |
| **80-99** | 🟢 **Green** | 🟢 | **Trusted** | Highly trusted member | Green gradient |
| **70-79** | 💛 **Yellow** | 💛 | **Developing** | Building reputation | Yellow gradient |
| **61-69** | 🟠 **Orange** | 🟠 | **Recovering** | Rebuilding trust | Orange gradient |
| **0-60** | 🔴 **Red** | 🔴 | **At Risk** | Limited access | Red gradient |

### Circular Progress Ring UI
The dynamic credit ring displays in the user profile card with:
- **Animated progress circle** that fills based on score
- **Color-coded outer ring** matching tier
- **Center icon** representing tier status
- **Numeric score display** (e.g., "83/100")
- **Tier label** below score
- **Smooth animations** when score updates
- **Pulse effect** for Elite (100 score) tier
- **Glow effect** matching tier color

## ✅ Positive Actions (Green)

| Action | Effect | Description | Emoji |
|--------|--------|-------------|-------|
| **Completed Transaction** | **+2** | Encourages engagement | ✅ |
| **Received 4-5 Star Rating** | **+2** | Reflects reliability | ⭐ |
| **Left a Review** | **+1** | Builds feedback culture | 💬 |
| **Purchased from "For a Cause"** | **+3** | Promotes empathy | ❤️ |
| **30 Days Without Reports** | **+2** | Rewards clean record | 🛡️ |
| **Responded Within 24 Hours** | **+1** | Promotes responsiveness | ⚡ |
| **Top 5 Buyer/Seller of Month** | **+5** | Rewards excellence | 🏆 |

## ⚠️ Negative Actions (Red)

| Action | Effect | Description | Emoji |
|--------|--------|-------------|-------|
| **Valid Report** | **-10** | Penalizes violations | ⚠️ |
| **Inappropriate Message** | **-5** | Discourages toxicity | 🚫 |
| **Ignored Transaction** | **-3** | Discourages irresponsibility | ⏰ |
| **Two Warnings / Month** | **-10** | Triggers cooldown | 🔴 |

## ⏳ Cooldown System

### Trigger
After receiving **2 warnings in a month**, a 7-day cooldown is activated.

### Effects
- ❄️ **Positive points are disabled** for 7 days
- Negative actions still apply normally
- User can still use the marketplace
- Cooldown indicator shown in credit score modal
- Toast notification alerts user of cooldown activation

### Anti-Abuse Measure
Prevents users from gaming the system by alternating between violations and positive actions.

### Cooldown Reset
- Automatically expires after 7 days
- Monthly warning counter resets
- Admin can manually reset cooldown

## 📊 Component Architecture

### 1. CreditScoreRing Component
**Location:** `/components/CreditScoreRing.tsx`

**Props:**
```typescript
interface CreditScoreRingProps {
  score: number;                // Credit score (0-100)
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Ring size
  showAnimation?: boolean;      // Enable animations
  showIcon?: boolean;           // Show tier icon
  className?: string;           // Additional classes
}
```

**Features:**
- Animated SVG circular progress bar
- Motion/React animations
- Color-coded by tier
- Interactive tooltips with tier info
- Pulse effect for Elite tier
- Responsive sizing

**Usage:**
```tsx
<CreditScoreRing 
  score={85}
  size="lg"
  showAnimation={true}
  showIcon={true}
/>
```

### 2. CreditScoreSystem
**Location:** `/components/CreditScoreSystem.tsx`

**Exports:**
- `CreditScoreManager` - Static class for score management
- `CREDIT_SCORE_ACTIONS` - Action definitions
- `useCreditScore` - React hook for score state
- Type definitions for actions and history

**CreditScoreManager Methods:**
```typescript
// Apply an action to user's score
CreditScoreManager.applyAction(
  userId: number,
  currentScore: number,
  actionId: string,
  cooldownStatus: CooldownStatus,
  showToast: boolean = true
): {
  newScore: number;
  historyEntry: CreditScoreHistoryEntry;
  newCooldownStatus: CooldownStatus;
}

// Get starting score for new users
CreditScoreManager.getStartingScore(): number

// Get tier information
CreditScoreManager.getTierInfo(score: number)

// Reset cooldown (monthly or admin)
CreditScoreManager.resetCooldown(): CooldownStatus

// Check if cooldown expired
CreditScoreManager.checkCooldownExpiry(cooldownStatus: CooldownStatus)
```

### 3. useCreditScore Hook
**Usage:**
```tsx
const {
  score,              // Current credit score
  history,            // Action history
  cooldownStatus,     // Cooldown state
  applyAction,        // Apply action function
  checkCooldown,      // Check cooldown expiry
  tierInfo            // Current tier information
} = useCreditScore(userId, initialScore);

// Apply an action
applyAction('COMPLETED_TRANSACTION', true);
```

## 🎨 Implementation Examples

### Example 1: Applying Actions

```tsx
import CreditScoreManager, { CREDIT_SCORE_ACTIONS } from './CreditScoreSystem';

// When transaction completes
const handleTransactionComplete = (userId: number, currentScore: number, cooldownStatus: CooldownStatus) => {
  const result = CreditScoreManager.applyAction(
    userId,
    currentScore,
    'COMPLETED_TRANSACTION',
    cooldownStatus,
    true // Show toast
  );
  
  // Update user's score in database
  updateUserScore(userId, result.newScore);
  
  // Store history entry
  addCreditHistory(result.historyEntry);
  
  // Update cooldown status
  updateCooldownStatus(userId, result.newCooldownStatus);
};
```

### Example 2: User Profile Display

```tsx
import { CreditScoreRing } from './CreditScoreRing';

function UserProfile({ user }) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex-1">
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
      
      <CreditScoreRing 
        score={user.creditScore}
        size="lg"
        showAnimation={true}
        showIcon={true}
      />
    </div>
  );
}
```

### Example 3: React Hook Usage

```tsx
import { useCreditScore } from './CreditScoreSystem';

function UserDashboard({ userId }) {
  const {
    score,
    history,
    cooldownStatus,
    applyAction,
    tierInfo
  } = useCreditScore(userId, 70);
  
  const handleReview = () => {
    applyAction('LEFT_REVIEW', true);
  };
  
  return (
    <div>
      <CreditScoreRing score={score} size="xl" />
      <p>{tierInfo.description}</p>
      {cooldownStatus.isActive && (
        <Alert>Cooldown active until {cooldownStatus.endDate}</Alert>
      )}
    </div>
  );
}
```

### Example 4: Admin Applying Penalty

```tsx
const handleApplyPenalty = (userId: number, penaltyType: string) => {
  const user = getUser(userId);
  
  const result = CreditScoreManager.applyAction(
    userId,
    user.creditScore,
    penaltyType, // e.g., 'VALID_REPORT'
    user.cooldownStatus,
    false // Don't show toast for admin actions
  );
  
  // Admin notification
  toast.success(`Penalty applied: ${result.historyEntry.actionName}`, {
    description: `User score: ${result.previousScore} → ${result.newScore}`
  });
};
```

## 🔄 Automated Triggers

### When to Apply Actions

#### Completed Transaction (+2)
- Trigger when both buyer and seller confirm transaction completion
- Applied to both parties
- Requires meetup confirmation

#### Received 4-5 Star Rating (+2)
- Trigger when user receives a rating of 4 or 5 stars
- Only counts verified transactions
- One rating per transaction

#### Left a Review (+1)
- Trigger when user submits a review for a transaction
- Encourages participation in feedback system
- Limited to one review per transaction

#### Purchased from "For a Cause" (+3)
- Trigger on successful purchase from For a Cause section
- Higher reward to promote charitable giving
- Applied to buyer only

#### 30 Days Without Reports (+2)
- Automatic monthly check
- Applied if user has zero valid reports in past 30 days
- Batch processed monthly

#### Responded Within 24 Hours (+1)
- Trigger when user responds to message within 24 hours
- Tracks first response time
- Promotes responsiveness

#### Top 5 Buyer/Seller of Month (+5)
- Applied at month end to top 5 in each category
- Based on completed transaction count
- Prestigious reward

#### Valid Report (-10)
- Trigger when admin marks a report as valid
- Significant penalty to discourage violations
- May trigger cooldown if repeated

#### Inappropriate Message (-5)
- Trigger when message is flagged and validated
- Moderate penalty for toxic behavior
- Contributes to warning count

#### Ignored Transaction (-3)
- Trigger when user doesn't respond to confirmed meetup
- After 48 hours of no response
- Minor penalty for irresponsibility

#### Two Warnings / Month (-10)
- Automatic trigger on second warning
- Activates 7-day cooldown
- Prevents positive point gains

## 📈 Integration Points

### Components Updated

1. ✅ **UserDashboard** - Shows CreditScoreRing in profile card
2. ✅ **CreditScoreModal** - Displays ring, history, and cooldown status
3. **PostProduct** - Check cooldown before allowing posts
4. **ChatModal** - Apply quick response bonus
5. **ProductDetail** - Track transaction confirmations
6. **AdminDashboard** - Apply penalties and manage scores
7. **TransactionConfirmation** - Apply completed transaction bonus
8. **ReviewSystem** - Apply review and rating bonuses
9. **ForACauseCheckout** - Apply charitable purchase bonus
10. **MonthlyJobs** - Apply 30-day clean record bonus

### Database Schema (Recommended)

```typescript
interface User {
  id: number;
  creditScore: number; // Default: 70
  cooldownStatus: {
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
    warningsThisMonth: number;
  };
  // ... other fields
}

interface CreditHistory {
  id: string;
  userId: number;
  actionId: string;
  actionName: string;
  pointsChange: number;
  previousScore: number;
  newScore: number;
  timestamp: string;
  description: string;
  emoji: string;
}
```

## 🎯 User Experience Flow

### New User Journey
1. **Registration** → Start with 70 points (Developing tier)
2. **First transaction** → +2 points → 72 points
3. **Leave review** → +1 point → 73 points
4. **Get 5-star rating** → +2 points → 75 points
5. **30 days clean** → +2 points → 77 points
6. **Continue positive actions** → Reach 80+ (Trusted tier)
7. **Consistent excellence** → Reach 100 (Elite Isko)

### Warning & Recovery
1. **User at 85 points (Trusted)**
2. **Gets valid report** → -10 points → 75 points
3. **Gets inappropriate message penalty** → -5 points → 70 points
4. **Second warning triggers cooldown** → -10 points → 60 points (At Risk)
5. **Cooldown active for 7 days** → Can't earn positive points
6. **After cooldown** → Can rebuild through positive actions
7. **30 days clean** → +2 points → 62 points (Recovering)
8. **Continue good behavior** → Return to Trusted tier

## 🎨 Visual Specifications

### Color Palette
- **Elite (100):** Cyan `#06B6D4` with glow
- **Trusted (80-99):** Green `#10B981`
- **Developing (70-79):** Yellow `#F59E0B`
- **Recovering (61-69):** Orange `#F97316`
- **At Risk (0-60):** Red `#EF4444`

### Animation Details
- **Ring fill animation:** 1.5s ease-out
- **Icon scale:** 0.3s with 0.3s delay
- **Score fade-in:** 0.3s with 0.5s delay
- **Label fade-in:** 0.3s with 0.7s delay
- **Elite pulse:** 2s infinite loop

### Sizes
- **sm:** 80px diameter, 3px stroke
- **md:** 112px diameter, 4px stroke
- **lg:** 144px diameter, 5px stroke
- **xl:** 176px diameter, 6px stroke

## 🔧 Testing Checklist

- [ ] New user starts at 70 points
- [ ] All positive actions increase score correctly
- [ ] All negative actions decrease score correctly
- [ ] Score stays between 0-100 (min/max clamping)
- [ ] Cooldown activates after 2 warnings
- [ ] Positive actions blocked during cooldown
- [ ] Negative actions work during cooldown
- [ ] Cooldown expires after 7 days
- [ ] Toast notifications appear for actions
- [ ] Ring animates smoothly
- [ ] Colors match tier correctly
- [ ] Elite tier shows pulse animation
- [ ] Tooltips display correct information
- [ ] History entries are created
- [ ] Modal shows cooldown warning when active

## 📝 Best Practices

### For Developers
1. **Always pass cooldown status** when applying actions
2. **Update database** immediately after score changes
3. **Store history entries** for audit trail
4. **Show toast notifications** for user feedback (unless admin action)
5. **Check cooldown** before allowing point-earning actions
6. **Use action IDs** from `CREDIT_SCORE_ACTIONS` constant

### For Admins
1. Review reports carefully before applying penalties
2. Use manual cooldown reset sparingly
3. Monitor users in At Risk tier
4. Provide clear communication about violations
5. Track cooldown patterns to identify serial violators

### For Users
1. Complete all transactions to earn points
2. Be responsive to messages
3. Leave reviews to help community
4. Avoid violations to maintain good standing
5. Support For a Cause to earn bonus points
6. Check credit history regularly

## 🚀 Future Enhancements

### Potential Additions
1. **Streak bonuses** - Extra points for consecutive days of activity
2. **Achievement badges** - Special badges at score milestones
3. **Leaderboard** - *Removed* (public leaderboard display deprecated on 2025-12-20). Credit scoring remains in place for other features.
4. **Score prediction** - Show how many points needed for next tier
5. **Weekly reports** - Email summary of credit score changes
6. **Custom actions** - Admin-defined bonus/penalty actions
7. **Appeal system** - Users can contest penalties
8. **Score insurance** - Protection against first offense

---

**System Status:** ✅ Fully Implemented and Ready for Integration
**Version:** 1.0
**Last Updated:** January 2025
