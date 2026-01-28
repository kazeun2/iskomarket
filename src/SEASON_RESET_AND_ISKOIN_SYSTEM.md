# Season Reset & Iskoin System - Complete Implementation

## 🎮 Overview
IskoMarket features a dynamic Season Reset system that runs every 6 months to ensure fairness and maintain marketplace engagement. Along with this, the Iskoin currency system rewards consistent high-performance users with a gamified currency.

## 📅 Season Reset System

### Season Timing
**Resets occur twice per year:**
- **Season 1:** December 1 - May 31
- **Season 2:** June 1 - November 30

**Reset Dates:**
- May 31 at 11:59 PM
- November 30 at 11:59 PM

### Season Naming Convention
```
Season 1 2025  (Dec 2024 - May 2025)
Season 2 2025  (Jun 2025 - Nov 2025)
Season 1 2026  (Dec 2025 - May 2026)
...and so on
```

## 🔄 Credit Score Reset Formula

When a season resets, user credit scores are adjusted based on their previous score:

| Previous Score | New Score | Description |
|---------------|-----------|-------------|
| **100** | **89** | Elite users get a head start |
| **90** | **79** | Trusted users maintain good standing |
| **70-89** | **70** | Mid-tier users reset to baseline |
| **≤69** | **Keep Current** | Low scores remain unchanged |

### Reset Logic
```typescript
export function calculateSeasonResetScore(previousScore: number): number {
  if (previousScore === 100) return 89;
  if (previousScore === 90) return 79;
  if (previousScore >= 70 && previousScore <= 89) return 70;
  // 69 and below retain current points
  return previousScore;
}
```

## 🎉 Season Reset Popup

### Trigger Conditions
The popup displays **once** after a user's first login following a season reset.

### Popup Features
1. **🏆 Animated Header** - Trophy icon with gradient background
2. **Score Transition Display** - Shows previous → new score
3. **Iskoin Lock Notice** - Alerts users if Iskoins are locked
4. **Two Action Buttons:**
   - **🟢 Got It!** - Acknowledges and closes
   - **🔍 View Season Summary** - *Previously opened the leaderboard; this action was removed on 2025-12-20 when leaderboards were deprecated.*

### Popup Content Structure

```tsx
<SeasonResetPopup
  isOpen={true}
  onClose={() => setShowSeasonResetPopup(false)}
  previousScore={100}
  newScore={89}
  season="Season 2 2025"
  iskoinsLocked={true}
  totalIskoins={12}
/>
```

**Header:**
```
🎉 A New Season Has Arrived!
Welcome to Season 2 2025
```

**Body Message:**
```
Your progress has been refreshed for the new season to keep things 
fair and exciting for everyone.

Credit Score Adjusted
[Previous: 100] → [New Score: 89]

💰 12 Iskoins Locked
Your Iskoins remain visible but are locked until you regain 
100 Credit Points through active participation.
```

**Footer:**
```
Good luck in the new season! 🚀
```

## 🪙 Iskoin Currency System

### What are Iskoins?
Iskoins are a special currency earned by maintaining perfect credit scores (100 points). They serve as a status symbol and reward for consistent excellence.

### Earning Iskoins

**Method 1: First Time Achievement**
- Reach 100 credit score for the first time in current season
- Award: **+1 Iskoin**
- One-time only per season

**Method 2: Weekly Maintenance**
- Maintain 100 credit score for full 7 consecutive days
- Award: **+1 Iskoin per week**
- Repeatable every week

**Earning Logic:**
```typescript
export function checkIskoinEarning(
  creditScore: number,
  daysAt100: number,
  hasReached100ThisSeason: boolean,
  currentIskoins: number
): {
  earnedIskoins: number;
  reason: string;
  newTotal: number;
} {
  let earned = 0;
  let reason = '';

  // First time reaching 100 this season
  if (creditScore === 100 && !hasReached100ThisSeason) {
    earned += 1;
    reason = 'First time reaching 100 this season!';
  }

  // Maintaining 100 for a full week
  if (creditScore === 100 && daysAt100 >= 7 && daysAt100 % 7 === 0) {
    earned += 1;
    reason = earned > 1 
      ? 'First 100 + maintained for 1 week!' 
      : 'Maintained 100 credits for 1 week!';
  }

  return {
    earnedIskoins: earned,
    reason,
    newTotal: currentIskoins + earned
  };
}
```

### Iskoin Locking Mechanism

**Iskoins Lock When:**
- Credit score drops below 100
- User can see their balance but cannot earn new ones
- Displayed with strikethrough and lock icon

**Iskoins Unlock When:**
- Credit score reaches 100 again
- User can resume earning Iskoins
- Full access restored

**Lock Check:**
```typescript
export function shouldLockIskoins(creditScore: number): boolean {
  return creditScore < 100;
}
```

## 🎨 Iskoin Wallet UI Component

### Display Variants

#### 1. **Card Variant** (Full Display)
```tsx
<IskoinWallet
  iskoins={12}
  isLocked={false}
  size="md"
  variant="card"
  showAnimation={true}
/>
```

**Features:**
- Animated rotating coin with glow effect
- Current balance display
- Lock status indicator
- Earning information tooltip
- Status: "Active and earning" or "Locked until 100 points"

#### 2. **Badge Variant** (Compact)
```tsx
<IskoinWalletCompact
  iskoins={12}
  isLocked={false}
/>
```

**Features:**
- Rounded badge with coin icon
- Compact text display
- Tooltip with full information
- Perfect for headers/navbars

#### 3. **Inline Variant** (Minimal)
```tsx
<IskoinWalletInline
  iskoins={12}
  isLocked={false}
/>
```

**Features:**
- Icon + number only
- Minimal space usage
- Tooltip for details

### Visual Design

**Unlocked State:**
```
┌─────────────────────────────┐
│ 🪙  Iskoin Wallet      ℹ️   │
│                             │
│     ✨ 12 Iskoins           │
│     🟢 Active and earning   │
│                             │
│ Keep 100 credits for 1 week │
│ = +1 Iskoin                 │
└─────────────────────────────┘
```

**Locked State:**
```
┌─────────────────────────────┐
│ 🪙  Iskoin Wallet      ℹ️   │
│     🔒                      │
│                             │
│     12̶ Iskoins (grayed)     │
│     🔒 Locked until 100     │
│                             │
└─────────────────────────────┘
```

### Animation Features

**1. Coin Glow (Unlocked)**
```typescript
animate={{
  scale: [1, 1.2, 1],
  opacity: [0.3, 0.6, 0.3],
}}
transition={{
  duration: 2,
  repeat: Infinity,
}}
```

**2. Coin Rotation**
```typescript
animate={{
  rotateY: [0, 360],
}}
transition={{
  duration: 3,
  repeat: Infinity,
  ease: "linear"
}}
```

**3. Earning Animation**
```tsx
<IskoinEarnAnimation 
  onComplete={() => {
    // Celebration complete
  }}
/>
```

Shows a full-screen celebration with:
- Coin flying up
- "+1 Iskoin!" message
- "Keep up the great work!" encouragement

## 📍 Component Placements

### User Dashboard
**Location:** Top-right, above Credit Score Ring

```tsx
<div className="flex flex-col items-end gap-3">
  {/* Iskoin Wallet */}
  <IskoinWalletCompact
    iskoins={userIskoins}
    isLocked={iskoinsLocked}
  />
  
  {/* Credit Score Ring */}
  <CreditScoreRing score={creditScore} />
</div>
```

### Profile Settings
**Location:** Below user info, next to Credit Score display

```tsx
<div className="profile-stats flex gap-4">
  <CreditScoreRing score={100} size="lg" />
  <IskoinWallet iskoins={12} isLocked={false} variant="card" />
</div>
```

### Navigation Bar (Future)
**Location:** Top-right corner next to notifications

```tsx
<IskoinWalletInline iskoins={12} isLocked={false} />
```

## 🔧 Implementation Checklist

### Season Reset System
- [x] SeasonResetPopup component
- [x] getCurrentSeason() helper
- [x] getNextSeasonResetDate() helper
- [x] calculateSeasonResetScore() formula
- [x] shouldShowSeasonResetPopup() checker
- [x] localStorage acknowledgment tracking
- [x] Integration with UserDashboard
- [x] Animated transitions and effects
- [x] Season Summary Modal connection

### Iskoin System
- [x] IskoinWallet component
- [x] IskoinWalletCompact variant
- [x] IskoinWalletInline variant
- [x] checkIskoinEarning() logic
- [x] shouldLockIskoins() checker
- [x] IskoinEarnAnimation celebration
- [x] Tooltip with earning info
- [x] Lock/unlock visual states
- [x] Integration with UserDashboard
- [x] Mock data in App.tsx

### Additional Features
- [ ] Backend API for Iskoin tracking
- [ ] Database schema for season data
- [ ] Iskoin earning automation (cron jobs)
- [ ] Iskoin spending/redemption system
- [ ] Iskoin leaderboard
- [ ] Season history archive
- [ ] Push notifications for earning Iskoins
- [ ] Email notifications for season reset

## 🎯 User Experience Flow

### Scenario 1: Season Reset for Elite User
```
User: john_doe
Previous Score: 100
Previous Iskoins: 24
Season: Ending Season 1 2025

1. Season resets on May 31, 11:59 PM
2. User's score → 89
3. Iskoins lock (24 locked but visible)
4. First login after reset (June 1)
5. Popup appears: "🎉 A New Season Has Arrived!"
6. Shows: 100 → 89
7. Shows: 💰 24 Iskoins Locked
8. User clicks "Got It!"
9. Dashboard displays:
   - Credit Score: 89
   - Iskoin Wallet: 🔒 2̶4̶ Iskoins
   - Rank: 💎 Trusted Isko (drops from Elite)
```

### Scenario 2: Earning First Iskoin
```
User: new_student
Current Score: 95
Current Iskoins: 0
Has Reached 100 This Season: false

1. User completes 3 successful transactions (+6 points)
2. Score reaches 100
3. System checks: hasReached100ThisSeason = false
4. IskoinEarnAnimation appears: "+1 Iskoin!"
5. User's Iskoins: 0 → 1
6. hasReached100ThisSeason = true
7. Dashboard updates with glowing coin
```

### Scenario 3: Weekly Iskoin Earning
```
User: active_seller
Current Score: 100 (maintained for 7 days)
Current Iskoins: 1
Days at 100: 7

1. System checks daily: daysAt100 = 7
2. Checks: daysAt100 % 7 === 0 (true)
3. IskoinEarnAnimation: "+1 Iskoin!"
4. User's Iskoins: 1 → 2
5. Counter resets or continues to 14 days
6. Repeatable every 7 days
```

### Scenario 4: Iskoin Lock After Violation
```
User: careless_user
Current Score: 100
Current Iskoins: 5

1. User receives valid report (-10 points)
2. Score drops: 100 → 90
3. Iskoin wallet immediately locks
4. Display changes:
   - Coin becomes gray
   - Number shows strikethrough: 5̶
   - Lock icon appears: 🔒
   - Status: "Locked until 100 points"
5. User can still see balance but can't earn new ones
```

## 📊 Season Statistics

### Expected Patterns

**Iskoin Distribution (Healthy Marketplace):**
```
0 Iskoins:       ~70% of users (Most users)
1-5 Iskoins:     ~20% of users (Occasional 100 achievers)
6-15 Iskoins:    ~8% of users (Consistent high performers)
16-25 Iskoins:   ~1.5% of users (Elite members)
26+ Iskoins:     ~0.5% of users (Top performers)
```

**Score Distribution After Reset:**
```
89 points:       ~2-5% (Previous 100 scorers)
79 points:       ~10-15% (Previous 90 scorers)
70 points:       ~60-70% (Previous 70-89 scorers)
<70 points:      ~15-20% (Previous low scorers)
```

### Season Leaderboards
Track and display:
- Most Iskoins earned this season
- Highest maintained credit score streak
- Most transactions completed
- Top sellers and buyers
- Community contributors

## 💡 Design Philosophy

### Fairness Through Reset
- **Prevents Score Inflation:** Old scores don't dominate forever
- **Fresh Starts:** New users have chance to compete
- **Encourages Activity:** Must maintain behavior, not coast on past performance
- **Seasonal Competition:** Creates mini-competitions every 6 months

### Iskoin as Status Symbol
- **Visible Achievement:** Others can see Iskoin count
- **Earned, Not Bought:** Can't purchase, must maintain excellence
- **Locked When Unearned:** Must maintain 100 to access
- **Mobile Legends-Style:** Familiar gamification for students

## 🎨 Color Scheme

### Iskoin Colors
**Unlocked (Active):**
- Coin gradient: `from-amber-400 to-amber-600`
- Background: `bg-amber-50 dark:bg-amber-950/30`
- Text: `text-amber-700 dark:text-amber-300`
- Border: `border-amber-300 dark:border-amber-700`

**Locked (Inactive):**
- Coin gradient: `from-gray-300 to-gray-500`
- Background: `bg-gray-100 dark:bg-gray-800`
- Text: `text-muted-foreground` (with strikethrough)
- Border: `border-gray-300 dark:border-gray-700`

### Season Reset Popup
- Header: `bg-gradient-to-r from-primary to-accent`
- Content: `bg-gradient-to-br from-primary/5 to-accent/5`
- Border: `border-2 border-primary/20`

## 🔮 Future Enhancements

### Iskoin Marketplace (Phase 2)
- Spend Iskoins for:
  - Featured product listings
  - Profile customization
  - Special badges
  - Priority customer support
  - Exclusive marketplace features

### Season Rewards (Phase 3)
- Top 10 Iskoin earners get special recognition
- Season champion badge
- Hall of Fame display
- Certificates of achievement

### Integration Ideas
- Iskoin donations to "For a Cause" items
- Iskoin gifting between users
- Iskoin tournaments/competitions
- Iskoin redemption for real rewards (scholarships, discounts)

---

**System Status:** ✅ Fully Implemented
**Version:** 1.0
**Last Updated:** January 2025
**Components Created:** 2 (SeasonResetPopup, IskoinWallet)
**Completion:** 100% Core Features, 0% Advanced Features
