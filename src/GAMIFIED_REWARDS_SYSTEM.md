# IskoMarket Gamified Rewards System Documentation

## Overview

The Gamified Rewards System is a comprehensive feature that allows IskoMarket users to earn and spend **Iskoins** on exclusive marketplace perks and enhancements. This system motivates engagement, rewards good behavior, and provides additional value to active community members.

---

## 🪙 Core Components

### 1. **Iskoin Reward Chest** (`RewardChestModal.tsx`)

A modal window displaying 10 redeemable rewards in a 2-column grid layout.

**Features:**
- Visual card-based interface with icons, descriptions, and costs
- Real-time Iskoin balance display
- Locked/unlocked states based on available Iskoins
- Hover animations and visual feedback
- Dark mode support

**Rewards Available:**

| Reward                    | Cost | Duration  | Description                          |
|---------------------------|------|-----------|--------------------------------------|
| Student Business Feature  | 5    | 3 days    | Spotlight your shop                  |
| Custom Profile Frame      | 4    | 30 days   | Apply semester theme frame           |
| Free Post Bump            | 3    | 24 hours  | Push post to top                     |
| Shout-Out Feature         | 3    | 7 days    | Feature on "Trusted of the Week"     |
| Glow Name Effect          | 4    | 30 days   | Animated glowing username            |
| Extra Product Slot        | 2    | 7 days    | +1 product slot                      |
| College Frame Badge       | 3    | 30 days   | Display your college                 |
| Speed Chat Badge          | 4    | 30 days   | "Fast Responder" label               |
| Theme Customizer          | 5    | 90 days   | Unlock additional themes             |
| Custom Title Reward       | 5    | 30 days   | Create personal title                |

---

### 2. **Active Rewards Tracker** (`ActiveRewardsTracker.tsx`)

A dashboard component that displays all active, expiring, and expired rewards.

**Features:**
- Real-time countdown timers for active rewards
- Status badges (Active, Expiring Soon, Expired)
- Extend and Renew buttons with Iskoin costs
- Automatic status updates
- Separate sections for active and expired rewards

**Functionality:**
- **Extend**: Add 50% more duration for half the original cost
- **Renew**: Restart reward for full duration at full cost
- Empty state when no rewards are active

---

### 3. **Reward Activation Popup** (`RewardActivationPopup.tsx`)

Bottom-right notification system with gamified animations.

**Features:**
- Auto-dismiss after 5 seconds
- Stacked notifications (max 3 visible)
- Confetti and sparkle animations
- Floating coin animations
- Progress bar indicator
- Click to open Active Rewards Tracker

**Notification Types:**
- ✅ **Activated**: Green theme, confetti burst
- 🔁 **Extended**: Blue theme, glow effect
- 🔄 **Renewed**: Gold theme, coin animation
- ⚠️ **Failed**: Red theme, no animation

---

### 4. **Iskoin Meter Widget** (`IskoinMeterWidget.tsx`)

A floating badge in the bottom-left corner showing current Iskoin balance.

**Features:**
- Real-time balance updates
- Glow animation on balance changes
- Change indicators (+/- Iskoins)
- Click to open Reward Chest
- Hover tooltip

---

## 💡 Integration Points

### User Dashboard (`UserDashboard.tsx`)

The rewards system is fully integrated into the User Dashboard:

1. **Rewards Tab**: New tab in main navigation
2. **State Management**: Tracks active rewards, notifications, and Iskoin balance
3. **Event Handlers**: Redeem, extend, and renew functionality
4. **Persistent Components**: Iskoin Meter Widget and Reward Popups

**Key Functions:**
```typescript
handleRedeemReward(reward)    // Activate a new reward
handleExtendReward(reward)    // Extend active reward by 50%
handleRenewReward(reward)     // Renew expired reward
```

---

## 🎮 User Flow

### Redeeming a Reward

1. User clicks **"🎁 Redeem Rewards"** button or Iskoin Meter Widget
2. Reward Chest Modal opens showing all 10 rewards
3. User selects a reward they can afford
4. System deducts Iskoins and activates reward
5. Popup notification appears with confetti/coins
6. Reward appears in Active Rewards Tracker

### Managing Active Rewards

1. User navigates to **Rewards tab** in dashboard
2. Views all active rewards with expiry timers
3. Can **Extend** (half cost) or **Renew** (full cost)
4. Expired rewards move to "Expired" section
5. Notifications confirm all actions

---

## ⚙️ Technical Details

### Reward Duration System

Durations are stored in milliseconds:

```typescript
const durations = {
  'business-feature': 3 days,
  'profile-frame': 30 days,
  'post-bump': 24 hours,
  'shout-out': 7 days,
  // ... etc
}
```

### Iskoin Cost Structure

- **Extend Cost**: `Math.ceil(originalCost / 2)`
- **Renew Cost**: Original full cost
- **Validation**: Checks balance before any transaction

### Real-Time Updates

- Active Rewards Tracker updates every second
- Status automatically changes: active → expiring → expired
- Expiring threshold: Less than 24 hours remaining

---

## 🎨 Design System

### Color Palette

**Light Mode:**
- Primary: `#006400` (CvSU Green)
- Background: `#f7f6f2` (Off-white)
- Gold Accents: Amber/Yellow gradients
- Status Colors: Green, Blue, Red

**Dark Mode:**
- Primary: `#4ade80`, `#1e6b1e`
- Background: `#1a1a1a`, `#0d0d0d`
- Gold Accents: Enhanced contrast
- Status Colors: Brighter variations

### Animations

- **Entry**: Zoom-in + fade (400ms)
- **Hover**: Scale 1.05 + shadow pulse
- **Coins**: Float-up animation (2000ms)
- **Confetti**: Sparkle burst (1500ms)
- **Progress Bar**: Width shrink (5000ms)

---

## 📊 Data Structure

### Active Reward

```typescript
interface ActiveReward {
  id: string;              // Unique identifier
  rewardId: string;        // Reward type ID
  emoji: string;           // Display emoji
  title: string;           // Reward name
  activatedAt: Date;       // Activation timestamp
  expiresAt: Date;         // Expiry timestamp
  status: 'active' | 'expiring' | 'expired';
}
```

### Reward Notification

```typescript
interface RewardNotification {
  id: string;
  type: 'activated' | 'extended' | 'renewed' | 'failed';
  emoji: string;
  title: string;
  description: string;
  iskoinCost: number;
  expiryText: string;
}
```

---

## 🔗 Related Systems

### Iskoin Wallet System
- Users earn Iskoins by maintaining 100 credit score
- Season resets affect Iskoin earning (see `SEASON_RESET_AND_ISKOIN_SYSTEM.md`)
- Locked at credit scores below 100

### Rank Tier System
- Rewards complement the rank tier progression
- Higher-tier users may have more Iskoins to spend
- See `RANK_TIER_SYSTEM.md` for details

### Credit Score System
- Credit score determines Iskoin earning eligibility
- 100 score = 1 Iskoin per season
- See `CREDIT_SCORE_SYSTEM.md` for details

---

## 🚀 Future Enhancements

### Potential Additions

1. **Limited-Time Rewards**: Seasonal or event-exclusive perks
2. **Bundle Deals**: Discount packages for multiple rewards
3. **Leaderboard Integration**: *Removed* — rewards tied to public leaderboards were deprecated on 2025-12-20; any rewards logic depending on leaderboards has been disabled or migrated to internal processes.
4. **Achievement Rewards**: Special perks for milestones
5. **Gift System**: Send rewards to other users
6. **Reward History**: Analytics and usage tracking
7. **Custom Reward Builder**: Let users design their own rewards

---

## 📝 Component Files

- `/components/RewardChestModal.tsx` - Main redemption interface
- `/components/ActiveRewardsTracker.tsx` - Reward management dashboard
- `/components/RewardActivationPopup.tsx` - Notification system
- `/components/IskoinMeterWidget.tsx` - Floating balance widget
- `/components/UserDashboard.tsx` - Integration point

---

## 🎯 Design Goals Achieved

✅ **Cohesive Experience**: All components share consistent theming and animations  
✅ **Gamified Feedback**: Confetti, coins, sparkles create excitement  
✅ **User-Friendly**: Clear costs, descriptions, and visual states  
✅ **Responsive**: Works across desktop and mobile  
✅ **Accessible**: ARIA labels, keyboard navigation, color contrast  
✅ **Performance**: Optimized animations and state management  

---

## 🧪 Testing Checklist

- [ ] Redeem reward with sufficient Iskoins
- [ ] Attempt redemption with insufficient Iskoins
- [ ] Extend active reward
- [ ] Renew expired reward
- [ ] Verify timer countdown accuracy
- [ ] Test notification stacking (3+ notifications)
- [ ] Confirm Iskoin balance updates correctly
- [ ] Check dark mode rendering
- [ ] Test responsive layout on mobile
- [ ] Verify animation performance

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete and Integrated
