# IskoMarket Algorithms - Complete Reference

## Overview
This document catalogs all algorithms implemented in the IskoMarket platform, including their purpose, implementation details, and business logic.

**Last Updated:** October 27, 2025  
**Platform:** IskoMarket - Cavite State University Student Marketplace

---

## Table of Contents
1. [Credit Score Algorithm](#1-credit-score-algorithm)
2. [Notification Priority Algorithm](#2-notification-priority-algorithm)
3. [Rank/Tier System Algorithm](#3-ranktier-system-algorithm)
4. [Season Reset Algorithm](#4-season-reset-algorithm)
5. [Trust System Algorithm](#5-trust-system-algorithm)
6. [Top 5 Members Ranking Algorithm](#6-top-5-members-ranking-algorithm)
7. [Gamified Rewards Algorithm](#7-gamified-rewards-algorithm)
8. [Transaction Automation Algorithm](#8-transaction-automation-algorithm)
9. [Inactivity Detection Algorithm](#9-inactivity-detection-algorithm)
10. [Priority Buyer Detection Algorithm](#10-priority-buyer-detection-algorithm)
11. [Chat Moderation Algorithm](#11-chat-moderation-algorithm)
12. [Iskoin Lock/Unlock Algorithm](#12-iskoin-lockunlock-algorithm)

---

## 1. Credit Score Algorithm

### Purpose
Auto-managed reputation system that tracks user behavior and adjusts credit scores based on marketplace actions.

### Base Score
All verified CvSU students start at **70 points** upon registration.

### Score Range
0 - 100 points

### Positive Actions (Score Increases)
```typescript
{
  completedTransaction: +2,
  received4to5StarRating: +2,
  leftReview: +1,
  purchasedForACause: +3,
  thirtyDaysWithoutReports: +2,
  respondedWithin24Hours: +1,
  top5BuyerSellerOfMonth: +5
}
```

### Negative Actions (Score Decreases)
```typescript
{
  validReport: -10,
  inappropriateMessage: -5,
  ignoredTransaction: -3,
  twoWarningsPerMonth: -10
}
```

### Credit Score Tiers
| Range | Tier | Color | Status |
|-------|------|-------|--------|
| 100 | Elite Isko | 💎 Cyan | Maximum credibility |
| 90-99 | Trusted | 🟢 Green | Highly trusted |
| 80-89 | Reliable | 🟢 Green | Clean record |
| 70-79 | Developing | 💛 Yellow | Building reputation |
| 61-69 | Recovering | 🟠 Orange | Rebuilding trust |
| 0-60 | At Risk | 🔴 Red | Limited access |

### Cooldown System
**Trigger:** 2 warnings in a month  
**Duration:** 7 days  
**Effect:** Positive points disabled, negative still apply

### Implementation
**File:** `/CREDIT_SCORE_SYSTEM.md`  
**Components:** `CreditScoreRing.tsx`, `CreditScoreModal.tsx`, `CreditScoreBadge.tsx`

**Formula:**
```typescript
function updateCreditScore(
  currentScore: number, 
  action: Action, 
  cooldownActive: boolean
): number {
  let newScore = currentScore;
  
  if (action.type === 'positive' && !cooldownActive) {
    newScore += action.points;
  } else if (action.type === 'negative') {
    newScore -= action.points;
  }
  
  // Clamp between 0-100
  return Math.max(0, Math.min(100, newScore));
}
```

---

## 2. Notification Priority Algorithm

### Purpose
Intelligently sorts and prioritizes notifications to ensure users see the most important ones first.

### Priority Score Formula
```typescript
PriorityScore = (EventTypeWeight × UrgencyLevel) - (TimeElapsed / 10)
```

### Event Type Weights
```typescript
const typeWeights: Record<string, number> = {
  message: 10,      // Highest priority
  report: 8,        // Admin/moderation
  warning: 8,       // Important alerts
  appeal: 7,        // User appeals
  transaction: 6,   // Buy/sell activities
  system: 5,        // General announcements
};
```

### Urgency Level
```typescript
urgencyLevel = notification.urgent ? 2 : 1
```

### Time Decay Factor
```typescript
timeElapsed = (now - notification.timestamp) / (1 hour)
decayFactor = timeElapsed / 10
```

### Sorting Logic
```typescript
function calculatePriorityScore(notification: NotificationItem): number {
  const typeWeights = { message: 10, report: 8, warning: 8, appeal: 7, transaction: 6, system: 5 };
  const urgencyLevel = notification.urgent ? 2 : 1;
  const now = new Date();
  const timeElapsed = (now.getTime() - notification.timestamp.getTime()) / (1000 * 60 * 60);
  const weight = typeWeights[notification.type] || 5;
  const score = (weight * urgencyLevel) - (timeElapsed / 10);
  return score;
}

// Sort: Unread first, then by priority score
notifications.sort((a, b) => {
  if (a.read !== b.read) return a.read ? 1 : -1;
  const scoreA = calculatePriorityScore(a);
  const scoreB = calculatePriorityScore(b);
  return scoreB - scoreA;
});
```

### Examples
| Type | Urgent | Age | Weight | Urgency | Time Decay | Final Score |
|------|--------|-----|--------|---------|------------|-------------|
| Message | Yes | 1h | 10 | 2 | -0.1 | **19.9** |
| Report | No | 3h | 8 | 1 | -0.3 | **7.7** |
| System | No | 12h | 5 | 1 | -1.2 | **3.8** |

### Implementation
**File:** `/components/NotificationDropdown.tsx`  
**Documentation:** `/NOTIFICATION_SYSTEM_COMPLETE.md`

---

## 3. Rank/Tier System Algorithm

### Purpose
Visual indicator of user standing based on credit score, displayed as colored badges throughout the platform.

### Tier Calculation
```typescript
function getRankTier(creditScore: number): RankTier {
  if (creditScore === 100) {
    return {
      tier: 6,
      title: '🧠 Elite Isko Member',
      symbol: '🧠',
      color: '#06B6D4', // Cyan
      description: 'Perfect record'
    };
  }
  if (creditScore >= 90) {
    return {
      tier: 5,
      title: '💎 Trusted Isko',
      symbol: '💎',
      color: '#F59E0B', // Gold/Amber
      description: 'High reputation'
    };
  }
  if (creditScore >= 80) {
    return {
      tier: 4,
      title: '🟢 Reliable Isko',
      symbol: '🟢',
      color: '#10B981', // Green
      description: 'Clean record'
    };
  }
  if (creditScore >= 70) {
    return {
      tier: 3,
      title: '🔰 Active Isko',
      symbol: '🔰',
      color: '#F59E0B', // Yellow
      description: 'Consistent'
    };
  }
  if (creditScore >= 61) {
    return {
      tier: 2,
      title: '🪶 Trainee Isko',
      symbol: '🪶',
      color: '#CD7F32', // Bronze/Orange
      description: 'Rebuilding'
    };
  }
  return {
    tier: 1,
    title: '⚪ Unranked Isko',
    symbol: '⚪',
    color: '#9CA3AF', // Gray
    description: 'New/Under Review'
  };
}
```

### Tier Structure
| Tier | Range | Title | Symbol | Color |
|------|-------|-------|--------|-------|
| 6 | 100 | Elite Isko Member | 🧠 | Cyan |
| 5 | 90-99 | Trusted Isko | 💎 | Gold |
| 4 | 80-89 | Reliable Isko | 🟢 | Green |
| 3 | 70-79 | Active Isko | 🔰 | Yellow |
| 2 | 61-69 | Trainee Isko | 🪶 | Orange |
| 1 | 0-60 | Unranked Isko | ⚪ | Gray |

### Auto-Update Behavior
- Tier updates automatically when credit score changes
- Visual indicator changes color/icon in real-time
- No manual refresh needed

### Implementation
**File:** `/components/RankTier.tsx`  
**Documentation:** `/RANK_TIER_SYSTEM.md`, `/TIER_RANK_SYSTEM_COMPLETE.md`

---

## 4. Season Reset Algorithm

### Purpose
Bi-annual reset system to maintain fairness and engagement in the marketplace.

### Season Timing
- **Season 1:** December 1 - May 31
- **Season 2:** June 1 - November 30
- **Reset Dates:** May 31 & November 30 at 11:59 PM

### Season Reset Formula
```typescript
function calculateSeasonResetScore(previousScore: number): number {
  if (previousScore === 100) return 89;     // Elite users
  if (previousScore === 90) return 79;      // Trusted users
  if (previousScore >= 70 && previousScore <= 89) return 70;  // Mid-tier
  return previousScore;  // 69 and below unchanged
}
```

### Reset Table
| Previous Score | New Score | Description |
|---------------|-----------|-------------|
| 100 | 89 | Elite users get head start |
| 90 | 79 | Trusted users maintain good standing |
| 70-89 | 70 | Mid-tier users reset to baseline |
| ≤69 | Keep Current | Low scores unchanged |

### Rationale
- **Elite (100):** Prevents permanent elite monopoly, gives chance to others
- **High (90):** Rewards past performance with slight advantage
- **Mid (70-89):** Fresh start at baseline to prove consistency
- **Low (≤69):** No penalty, allows recovery without extra burden

### Season Naming
```
Season 1 2025  (Dec 2024 - May 2025)
Season 2 2025  (Jun 2025 - Nov 2025)
Season 1 2026  (Dec 2025 - May 2026)
```

### Implementation
**File:** `/components/SeasonResetPopup.tsx`  
**Documentation:** `/SEASON_RESET_AND_ISKOIN_SYSTEM.md`

**Current Season Detection:**
```typescript
function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  
  if (month >= 6 && month <= 11) {
    return `Season 2 ${year}`;
  } else {
    return `Season 1 ${year}`;
  }
}
```

---

## 5. Trust System Algorithm

### Purpose
Manages the Trustworthy Badge based on credit score thresholds and provides clear status indicators.

### Trustworthy Badge Rules
```typescript
function getTrustworthyStatus(creditScore: number): TrustStatus {
  if (creditScore >= 90 && creditScore <= 100) {
    return {
      badge: '✅ Trustworthy',
      color: 'green',
      access: 'full',
      description: 'Full platform access'
    };
  }
  
  if (creditScore >= 61 && creditScore <= 89) {
    return {
      badge: 'No Badge',
      color: 'neutral',
      access: 'normal',
      description: 'Normal access'
    };
  }
  
  if (creditScore <= 60) {
    return {
      badge: '🔴 Under Review – Subject to Removal',
      color: 'red',
      access: 'limited',
      restrictions: [
        'Cannot contact sellers',
        'Cannot view seller profiles',
        'Cannot post products'
      ],
      description: 'Limited access until improvement'
    };
  }
}
```

### Trust Levels
| Credit Score | Badge | Access Level | Restrictions |
|-------------|-------|--------------|--------------|
| 90-100 | ✅ Trustworthy | Full | None |
| 61-89 | ⚪ No Badge | Normal | None |
| ≤60 | 🔴 Under Review | Limited | No contact, No profile view, No posting |

### Access Control Logic
```typescript
function canAccessFeature(feature: string, creditScore: number): boolean {
  if (creditScore <= 60) {
    const restrictedFeatures = [
      'contact_seller',
      'view_seller_profile', 
      'post_product'
    ];
    return !restrictedFeatures.includes(feature);
  }
  return true; // 61+ has full access
}
```

### Implementation
**File:** `/components/TrustworthyBadge.tsx`  
**Documentation:** `/TRUSTWORTHY_BADGE_SYSTEM.md`, `/TRUST_SYSTEM_RULES_UPDATE_COMPLETE.md`

---

## 6. Top 5 Members Ranking Algorithm

### Purpose
Identifies and showcases the top 5 buyers and sellers each month to encourage engagement.

### Ranking Criteria

**For Buyers:**
```typescript
function rankBuyers(users: User[]): User[] {
  return users
    .filter(u => u.role === 'buyer' || u.role === 'both')
    .sort((a, b) => {
      // Primary: Completed transactions (descending)
      if (b.completedPurchases !== a.completedPurchases) {
        return b.completedPurchases - a.completedPurchases;
      }
      // Secondary: Average rating (descending)
      if (b.avgRating !== a.avgRating) {
        return b.avgRating - a.avgRating;
      }
      // Tertiary: Credit score (descending)
      return b.creditScore - a.creditScore;
    })
    .slice(0, 5); // Top 5
}
```

**For Sellers:**
```typescript
function rankSellers(users: User[]): User[] {
  return users
    .filter(u => u.role === 'seller' || u.role === 'both')
    .sort((a, b) => {
      // Primary: Completed sales (descending)
      if (b.completedSales !== a.completedSales) {
        return b.completedSales - a.completedSales;
      }
      // Secondary: Average rating (descending)
      if (b.avgRating !== a.avgRating) {
        return b.avgRating - a.avgRating;
      }
      // Tertiary: Credit score (descending)
      return b.creditScore - a.creditScore;
      
    })
    .slice(0, 5); // Top 5
}
```

### Ranking Weights
1. **Completed Transactions** (Primary) - 100%
2. **Average Rating** (Tiebreaker #1) - If transactions equal
3. **Credit Score** (Tiebreaker #2) - If rating equal

### Monthly Reset
- Rankings recalculated on 1st of each month
- Based on current month's activity only
- Previous month data archived for history

### Rank Badges
| Rank | Badge | Color | Emoji |
|------|-------|-------|-------|
| #1 | Gold Medal | Yellow | 🥇 |
| #2 | Silver Medal | Silver | 🥈 |
| #3 | Bronze Medal | Bronze | 🥉 |
| #4 | Blue Diamond | Blue | 🔹 |
| #5 | Star | Purple | ⭐ |

### Implementation
**File:** `/components/TopFiveMembersSection.tsx`  
**Documentation:** `/TOP_FIVE_MEMBERS_FEATURE.md`

---

## 7. Gamified Rewards Algorithm

### Purpose
Incentivize user engagement through rewards (Iskoins, profile effects, badges) earned by completing actions.

### Iskoin Rewards
```typescript
const iskoinRewards: Record<Action, number> = {
  completedTransaction: 5,
  receivedPositiveRating: 3,
  leftReview: 2,
  dailyLogin: 1,
  weeklyStreak: 10,
  topFiveAchievement: 50,
  forACausePurchase: 8
};
```

### Reward Chest System
**Spin Probability:**
```typescript
const rewardProbabilities = {
  iskoins_5: 0.30,      // 30% - 5 Iskoins
  iskoins_10: 0.25,     // 25% - 10 Iskoins
  iskoins_25: 0.15,     // 15% - 25 Iskoins
  iskoins_50: 0.10,     // 10% - 50 Iskoins
  profileFrame: 0.08,   // 8% - Profile Frame (7 days)
  glowEffect: 0.07,     // 7% - Glow Effect (7 days)
  /* customTitle scoring removed (feature deprecated) */
};

function spinRewardChest(): Reward {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [reward, probability] of Object.entries(rewardProbabilities)) {
    cumulative += probability;
    if (rand <= cumulative) {
      return createReward(reward);
    }
  }
  return createReward('iskoins_5'); // Fallback
}
```

### Daily Spin Mechanics
- **Free Spins:** 1 per day
- **Rechargeable:** 3 recharges per day using Iskoins
- **Recharge Cost:** 10 Iskoins per spin
- **Reset Time:** Midnight (00:00) server time

### Reward Duration
```typescript
const rewardDurations = {
  profileFrame: 7 * 24 * 60 * 60 * 1000,  // 7 days
  glowEffect: 7 * 24 * 60 * 60 * 1000,    // 7 days
  /* customTitle duration removed (feature deprecated) */
  iskoins: Infinity  // Permanent
};
```

### Implementation
**Files:** `/components/RewardChestModal.tsx`, `/components/DailySpinModal.tsx`  
**Documentation:** `/GAMIFIED_REWARDS_SYSTEM.md`, `/ENHANCED_REWARDS_SYSTEM_COMPLETE.md`

---

## 8. Transaction Automation Algorithm

### Purpose
Automates transaction workflow from initial contact to completion with automated credit score updates.

### Transaction State Machine
```typescript
enum TransactionStatus {
  PENDING = 'pending',           // Initial state
  SCHEDULED = 'scheduled',       // Meetup date set
  COMPLETED = 'completed',       // Both confirmed success
  UNSUCCESSFUL = 'unsuccessful'  // Deadline passed or failed
}

interface Transaction {
  meetupDate: Date | null;
  status: TransactionStatus;
  confirmedByBuyer: boolean;
  confirmedBySeller: boolean;
  buyerRated: boolean;
  sellerRated: boolean;
  daysUntilDeadline: number;
}
```

### State Transitions
```
PENDING → SCHEDULED (when meetup date set)
SCHEDULED → COMPLETED (when both confirm within 7 days)
SCHEDULED → UNSUCCESSFUL (when 7 days pass without confirmation)
```

### Deadline Calculation
```typescript
function calculateDeadline(meetupDate: Date): number {
  const deadline = new Date(meetupDate);
  deadline.setDate(deadline.getDate() + 7); // 7 days after meetup
  
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
```

### Auto-Completion Logic
```typescript
function checkTransactionCompletion(transaction: Transaction): void {
  const { confirmedByBuyer, confirmedBySeller, meetupDate, daysUntilDeadline } = transaction;
  
  // Both confirmed within deadline
  if (confirmedByBuyer && confirmedBySeller && daysUntilDeadline > 0) {
    transaction.status = 'completed';
    awardCreditScore(buyer, +2);
    awardCreditScore(seller, +2);
    unlockRatingSystem(transaction);
  }
  
  // Deadline passed without confirmation
  if (daysUntilDeadline <= 0 && (!confirmedByBuyer || !confirmedBySeller)) {
    transaction.status = 'unsuccessful';
    if (!confirmedByBuyer) penalizeCreditScore(buyer, -3);
    if (!confirmedBySeller) penalizeCreditScore(seller, -3);
  }
}
```

### Credit Score Awards/Penalties
| Event | Buyer | Seller |
|-------|-------|--------|
| Both confirm (success) | +2 | +2 |
| Buyer confirms, Seller doesn't | 0 | -3 |
| Seller confirms, Buyer doesn't | -3 | 0 |
| Neither confirms | -3 | -3 |
| 4-5 star rating received | +2 | +2 |
| 1-3 star rating received | 0 | 0 |

### Implementation
**File:** `/components/ChatModal.tsx`  
**Documentation:** `/CHAT_TRANSACTION_AUTOMATION_COMPLETE.md`

---

## 9. Inactivity Detection Algorithm

### Purpose
Detects inactive accounts and applies progressive restrictions to maintain active marketplace.

### Inactivity Thresholds
```typescript
const inactivityLevels = {
  warning: 30,      // 30 days - Warning banner
  suspended: 60,    // 60 days - Account suspended
  removed: 90       // 90 days - Account removal eligible
};
```

### Status Calculation
```typescript
function calculateInactivityStatus(lastActiveDate: Date): AccountStatus {
  const now = new Date();
  const diffTime = now.getTime() - lastActiveDate.getTime();
  const daysSinceActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysSinceActive >= 90) {
    return {
      status: 'removal_eligible',
      days: daysSinceActive,
      warning: 'Account will be removed soon',
      action: 'Log in to prevent removal'
    };
  }
  
  if (daysSinceActive >= 60) {
    return {
      status: 'suspended',
      days: daysSinceActive,
      warning: 'Account suspended due to inactivity',
      restrictions: ['Cannot post', 'Cannot message', 'Cannot trade']
    };
  }
  
  if (daysSinceActive >= 30) {
    return {
      status: 'warning',
      days: daysSinceActive,
      warning: 'Account will be suspended soon',
      action: 'Log in to maintain access'
    };
  }
  
  return {
    status: 'active',
    days: daysSinceActive
  };
}
```

### Progressive Restrictions
| Days Inactive | Status | Restrictions |
|--------------|--------|--------------|
| 0-29 | Active | None |
| 30-59 | Warning | None (banner shown) |
| 60-89 | Suspended | Cannot post, message, or trade |
| 90+ | Removal Eligible | Full account suspension |

### Activity Reset
Any of these actions reset the inactivity timer:
- Login
- Post product
- Send message
- Complete transaction
- Update profile

### Implementation
**File:** `/components/InactivityManager.tsx`  
**Documentation:** `/ADMIN_DASHBOARD_ACTIVITIES_REDESIGN_COMPLETE.md`

---

## 10. Priority Buyer Detection Algorithm

### Purpose
Identifies Top 5 Buyers of the Month and applies visual priority indicators in messaging.

### Detection Logic
```typescript
function isTopFiveBuyer(userId: number, topBuyersIds: number[] = [1, 2, 3, 4, 5]): boolean {
  return topBuyersIds.includes(userId);
}

function getTopFiveBuyersIds(): number[] {
  // In production, fetch from database
  // For now, returns IDs of current month's top 5 buyers
  return [1, 2, 3, 4, 5];
}
```

### Priority Indicator Logic
```typescript
function shouldShowPriorityBadge(message: Message): boolean {
  // Check if sender is a Top 5 Buyer
  const isPriority = message.isPriorityBuyer ?? isTopFiveBuyer(message.senderId);
  
  // Only show for buyer-to-seller messages
  const isBuyerMessage = message.senderRole === 'buyer';
  
  return isPriority && isBuyerMessage;
}
```

### Visual Priority Levels
**Unread Priority Message:**
```typescript
styling = {
  background: 'orange-gradient-strong',
  ring: '2px-orange',
  badge: 'Priority (with crown)',
  statusText: '⚡ Priority buyer - faster response expected'
}
```

**Read Priority Message:**
```typescript
styling = {
  background: 'orange-tint-subtle',
  border: 'orange',
  badge: 'Priority (with crown)',
  statusText: '⚡ Priority buyer - faster response recommended'
}
```

### Update Frequency
- Recalculated: Monthly (1st of each month)
- Real-time updates: When user completes transactions
- Cache duration: 24 hours

### Implementation
**File:** `/components/PriorityBadge.tsx`  
**Documentation:** `/PRIORITY_BUYER_SYSTEM_COMPLETE.md`

---

## 11. Chat Moderation Algorithm

### Purpose
Detects and blocks inappropriate content in real-time with automatic credit score penalties.

### Content Detection
```typescript
const inappropriatePatterns = [
  /\b(fuck|shit|damn|bitch|ass|cunt)\b/i,           // English profanity
  /\b(puta|tangina|gago|bobo|tanga)\b/i,            // Filipino profanity
  /\b(scam|fake|fraud)\b/i,                          // Suspicious words
  /(\d{11}|\d{3}-\d{3}-\d{4}|\d{3}-\d{4})/,         // Phone numbers
  /(http|www\.|\.com|\.net|\.ph)/i,                 // URLs
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i     // Email addresses
];

function moderateMessage(message: string): ModerationResult {
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(message)) {
      return {
        blocked: true,
        reason: 'Inappropriate content detected',
        penalty: -5,  // Credit score deduction
        action: 'Message blocked'
      };
    }
  }
  
  return {
    blocked: false,
    allowed: true
  };
}
```

### Moderation Actions
| Content Type | Action | Credit Penalty |
|-------------|--------|----------------|
| Profanity | Block + Warning | -5 |
| Scam Words | Block + Flag | -5 |
| Phone Number | Block + Notice | -5 |
| URL/Link | Block + Notice | -5 |
| Email Address | Block + Notice | -5 |

### Progressive Penalties
```typescript
function applyModerationPenalty(user: User, violations: number): void {
  const penalties = [
    { count: 1, action: 'warning', creditDeduct: -5 },
    { count: 2, action: 'cooldown', creditDeduct: -10, duration: '7 days' },
    { count: 3, action: 'suspension', creditDeduct: -15, duration: '14 days' },
    { count: 5, action: 'ban', creditDeduct: -20, duration: 'permanent' }
  ];
  
  const penalty = penalties.find(p => p.count === violations);
  if (penalty) {
    user.creditScore += penalty.creditDeduct;
    applyAction(user, penalty.action, penalty.duration);
  }
}
```

### Implementation
**File:** `/components/ChatModal.tsx`  
**Documentation:** `/CHAT_TRANSACTION_AUTOMATION_COMPLETE.md`

---

## 12. Iskoin Lock/Unlock Algorithm

### Purpose
Locks Iskoins for users with low credit scores to prevent exploitation and encourage improvement.

### Lock Threshold
```typescript
const ISKOIN_LOCK_THRESHOLD = 60;

function shouldLockIskoins(creditScore: number): boolean {
  return creditScore <= 60;
}
```

### Lock Rules
| Credit Score | Iskoin Status | Can Earn | Can Spend | Can Spin |
|-------------|---------------|----------|-----------|----------|
| 61-100 | Unlocked | ✅ Yes | ✅ Yes | ✅ Yes |
| ≤60 | 🔒 Locked | ❌ No | ❌ No | ❌ No |

### Lock Behavior
```typescript
function manageIskoinAccess(user: User, action: IskoinAction): ActionResult {
  const isLocked = shouldLockIskoins(user.creditScore);
  
  if (isLocked) {
    return {
      allowed: false,
      message: '🔒 Iskoins locked. Improve credit score to 61+ to unlock.',
      currentScore: user.creditScore,
      requiredScore: 61
    };
  }
  
  // Allow action if unlocked
  return {
    allowed: true,
    action: executeIskoinAction(user, action)
  };
}
```

### Unlock Process
```typescript
function checkIskoinUnlock(oldScore: number, newScore: number): UnlockEvent | null {
  const wasLocked = oldScore <= 60;
  const nowUnlocked = newScore >= 61;
  
  if (wasLocked && nowUnlocked) {
    return {
      event: 'iskoin_unlock',
      message: '🎉 Iskoins unlocked! Credit score improved to 61+',
      toast: true,
      confetti: true
    };
  }
  
  return null;
}
```

### Visual Indicators
**Locked State:**
```
🔒 Iskoins Locked
Current: 58/100 | Need: 61/100
Improve credit score to unlock
```

**Unlocked State:**
```
🪙 [Balance] Iskoins
Available to spend
```

### Implementation
**File:** `/components/IskoinWallet.tsx`  
**Documentation:** `/SEASON_RESET_AND_ISKOIN_SYSTEM.md`

---

## Algorithm Performance Metrics

### Computational Complexity

| Algorithm | Time Complexity | Space Complexity | Notes |
|-----------|----------------|------------------|-------|
| Credit Score Update | O(1) | O(1) | Simple arithmetic |
| Notification Priority | O(n log n) | O(n) | Sort operation |
| Rank/Tier Calculation | O(1) | O(1) | Direct lookup |
| Season Reset | O(1) | O(1) | Formula-based |
| Trust System | O(1) | O(1) | Conditional checks |
| Top 5 Ranking | O(n log n) | O(n) | Sort + slice |
| Gamified Rewards | O(1) | O(1) | Random selection |
| Transaction Automation | O(1) | O(1) | State machine |
| Inactivity Detection | O(1) | O(1) | Date comparison |
| Priority Buyer | O(n) | O(1) | Array lookup (n=5) |
| Chat Moderation | O(m) | O(1) | m = patterns count |
| Iskoin Lock/Unlock | O(1) | O(1) | Threshold check |

### Optimization Notes

**Well Optimized:**
- Credit Score: Direct calculation, no loops
- Tier System: Constant time lookup
- Iskoin Lock: Simple boolean check

**Could Be Optimized:**
- Notification Priority: Consider caching scores
- Top 5 Ranking: Could use heap for large datasets
- Chat Moderation: Could use Trie for pattern matching

---

## Algorithm Dependencies

### Cross-Algorithm Interactions

```
Credit Score Algorithm
    ↓
    ├─→ Rank/Tier System (displays tier based on score)
    ├─→ Trust System (determines badge/restrictions)
    ├─→ Iskoin Lock (locks below threshold)
    ├─→ Top 5 Ranking (tiebreaker criteria)
    └─→ Season Reset (determines reset value)

Transaction Automation
    ↓
    ├─→ Credit Score (awards/penalties)
    ├─→ Gamified Rewards (Iskoin awards)
    └─→ Trust System (affects rating eligibility)

Notification Priority
    ↓
    └─→ Priority Buyer (boosts message priority)

Top 5 Ranking
    ↓
    ├─→ Priority Buyer (determines priority status)
    └─→ Credit Score (bonus points award)
```

---

## Testing Recommendations

### Unit Test Coverage
- [ ] Credit Score: All action types, boundary values (0, 100)
- [ ] Notification Priority: Edge cases (very old, very new)
- [ ] Season Reset: All score ranges, boundary dates
- [ ] Trust System: All threshold boundaries (60, 61, 89, 90)
- [ ] Top 5 Ranking: Tiebreaker scenarios
- [ ] Transaction Automation: All state transitions
- [ ] Chat Moderation: All pattern types
- [ ] Iskoin Lock: Threshold boundaries

### Integration Test Scenarios
1. User completes transaction → Credit +2 → Tier updates → Iskoins +5
2. User receives 2 warnings → Credit -10 → Cooldown active → Positive points disabled
3. Season resets → Credit recalculated → Iskoins locked if ≤60
4. Top 5 achieved → Credit +5 → Priority badge activated

---

## Future Algorithm Enhancements

### Planned Algorithms

1. **Recommendation Algorithm**
   - Suggest products based on user history
   - Collaborative filtering
   - Content-based filtering

2. **Fraud Detection Algorithm**
   - Pattern recognition for suspicious behavior
   - Machine learning model
   - Anomaly detection

3. **Dynamic Pricing Algorithm**
   - Suggest optimal prices
   - Market analysis
   - Demand prediction

4. **Smart Matching Algorithm**
   - Match buyers with sellers
   - Location-based matching
   - Interest-based matching

5. **Reputation Score Algorithm**
   - More sophisticated than credit score
   - Weighted historical data
   - Decay over time

---

## Summary

IskoMarket implements **12 core algorithms** that work together to create a fair, engaging, and automated marketplace experience:

1. ✅ **Credit Score** - Reputation system
2. ✅ **Notification Priority** - Smart sorting
3. ✅ **Rank/Tier** - Visual status
4. ✅ **Season Reset** - Bi-annual fairness
5. ✅ **Trust System** - Access control
6. ✅ **Top 5 Ranking** - Monthly leaderboard
7. ✅ **Gamified Rewards** - Engagement incentive
8. ✅ **Transaction Automation** - Workflow automation
9. ✅ **Inactivity Detection** - Account management
10. ✅ **Priority Buyer** - VIP treatment
11. ✅ **Chat Moderation** - Content filtering
12. ✅ **Iskoin Lock/Unlock** - Currency control

**Total Lines of Algorithm Code:** ~2,000+ lines  
**Average Algorithm Complexity:** O(1) to O(n log n)  
**Real-time Processing:** 11 of 12 algorithms  
**Batch Processing:** 1 (Season Reset)

---

**Documentation Status:** ✅ Complete  
**Last Algorithm Added:** Priority Buyer Detection (Oct 2025)  
**Next Review:** Monthly (with system updates)
