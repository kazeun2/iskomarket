# Credit Score System - Quick Reference Guide

## 🚀 Quick Start

### Import What You Need

```tsx
// For displaying the score ring
import { CreditScoreRing } from './components/CreditScoreRing';

// For managing scores
import CreditScoreManager, { 
  CREDIT_SCORE_ACTIONS,
  CreditScoreHistoryEntry,
  CooldownStatus 
} from './components/CreditScoreSystem';

// For React components
import { useCreditScore } from './components/CreditScoreSystem';
```

## 📊 Display Score Ring

### Basic Usage
```tsx
<CreditScoreRing 
  score={75} 
  size="md"
/>
```

### Full Options
```tsx
<CreditScoreRing 
  score={currentUser.creditScore}
  size="lg"              // sm, md, lg, xl
  showAnimation={true}   // Animate on mount
  showIcon={true}        // Show tier icon
  className="my-custom-class"
/>
```

### Common Placements
```tsx
// User Profile Card
<div className="flex items-center gap-6">
  <Avatar />
  <UserInfo />
  <CreditScoreRing score={user.creditScore} size="lg" />
</div>

// Compact Display
<CreditScoreRing score={85} size="sm" showAnimation={false} />

// Hero Section
<CreditScoreRing score={100} size="xl" />
```

## ⚡ Apply Credit Actions

### Transaction Completed
```tsx
const handleTransactionComplete = () => {
  const result = CreditScoreManager.applyAction(
    userId,
    currentScore,
    'COMPLETED_TRANSACTION',
    cooldownStatus,
    true // Show toast
  );
  
  // Update state/database
  setScore(result.newScore);
  setCooldownStatus(result.newCooldownStatus);
};
```

### Received Rating
```tsx
// When user receives 4 or 5 star rating
if (rating >= 4) {
  CreditScoreManager.applyAction(
    sellerId,
    seller.creditScore,
    'RECEIVED_HIGH_RATING',
    seller.cooldownStatus
  );
}
```

### Left Review
```tsx
const handleReviewSubmit = () => {
  // After review is saved
  CreditScoreManager.applyAction(
    currentUserId,
    currentUser.creditScore,
    'LEFT_REVIEW',
    currentUser.cooldownStatus
  );
};
```

### For a Cause Purchase
```tsx
const handleCausePurchase = () => {
  CreditScoreManager.applyAction(
    buyerId,
    buyer.creditScore,
    'PURCHASED_FOR_CAUSE',
    buyer.cooldownStatus
  );
};
```

### Quick Response
```tsx
const handleMessageSent = (responseTime: number) => {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  if (responseTime < TWENTY_FOUR_HOURS) {
    CreditScoreManager.applyAction(
      userId,
      user.creditScore,
      'QUICK_RESPONSE',
      user.cooldownStatus
    );
  }
};
```

### Admin Penalties
```tsx
// Valid Report
const handleValidReport = () => {
  const result = CreditScoreManager.applyAction(
    reportedUserId,
    reportedUser.creditScore,
    'VALID_REPORT',
    reportedUser.cooldownStatus,
    false // Don't show toast for admin actions
  );
  
  // Admin notification
  toast.success(`Penalty applied to ${reportedUser.name}`);
};

// Inappropriate Message
CreditScoreManager.applyAction(
  userId,
  user.creditScore,
  'INAPPROPRIATE_MESSAGE',
  user.cooldownStatus
);

// Ignored Transaction
CreditScoreManager.applyAction(
  userId,
  user.creditScore,
  'IGNORED_TRANSACTION',
  user.cooldownStatus
);
```

## 🎣 Use React Hook

### Basic Setup
```tsx
function UserProfile({ userId }) {
  const {
    score,
    history,
    cooldownStatus,
    applyAction,
    checkCooldown,
    tierInfo
  } = useCreditScore(userId, 70);
  
  return (
    <div>
      <CreditScoreRing score={score} size="lg" />
      <p>{tierInfo.description}</p>
      <Button onClick={() => applyAction('LEFT_REVIEW')}>
        Submit Review
      </Button>
    </div>
  );
}
```

### With Cooldown Check
```tsx
const {
  score,
  cooldownStatus,
  applyAction
} = useCreditScore(userId, initialScore);

const handleAction = () => {
  if (cooldownStatus.isActive) {
    toast.warning('Cooldown active - positive points disabled');
    return;
  }
  
  applyAction('COMPLETED_TRANSACTION');
};
```

## 🔍 Check Tier Information

```tsx
const tierInfo = CreditScoreManager.getTierInfo(85);

console.log(tierInfo);
// {
//   tier: 'Trusted',
//   color: 'green',
//   emoji: '🟢',
//   description: 'Highly trusted member'
// }
```

## ⏳ Manage Cooldown

### Check if Expired
```tsx
const updatedCooldown = CreditScoreManager.checkCooldownExpiry(
  currentCooldownStatus
);

if (!updatedCooldown.isActive && currentCooldownStatus.isActive) {
  toast.success('Cooldown expired! You can now earn points again.');
}
```

### Reset Cooldown (Admin)
```tsx
const newCooldownStatus = CreditScoreManager.resetCooldown();
updateUserCooldown(userId, newCooldownStatus);
```

### Display Cooldown Status
```tsx
{cooldownStatus.isActive && (
  <Alert variant="warning">
    <Snowflake className="h-4 w-4" />
    <AlertTitle>Cooldown Active</AlertTitle>
    <AlertDescription>
      Positive points disabled until {new Date(cooldownStatus.endDate).toLocaleDateString()}
    </AlertDescription>
  </Alert>
)}
```

## 📋 Action IDs Reference

### Positive Actions
```tsx
'COMPLETED_TRANSACTION'     // +2
'RECEIVED_HIGH_RATING'      // +2
'LEFT_REVIEW'               // +1
'PURCHASED_FOR_CAUSE'       // +3
'NO_REPORTS_30_DAYS'        // +2
'QUICK_RESPONSE'            // +1
'TOP_5_MONTHLY'             // +5
```

### Negative Actions
```tsx
'VALID_REPORT'              // -10
'INAPPROPRIATE_MESSAGE'     // -5
'IGNORED_TRANSACTION'       // -3
'TWO_WARNINGS_MONTH'        // -10 + cooldown
```

## 🎨 Color Reference

```tsx
const colors = {
  100: '#06B6D4',      // Cyan (Elite)
  '80-99': '#10B981',  // Green (Trusted)
  '70-79': '#F59E0B',  // Yellow (Developing)
  '61-69': '#F97316',  // Orange (Recovering)
  '0-60': '#EF4444'    // Red (At Risk)
};
```

## 💾 Type Definitions

### CreditScoreHistoryEntry
```typescript
interface CreditScoreHistoryEntry {
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

### CooldownStatus
```typescript
interface CooldownStatus {
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  warningsThisMonth: number;
}
```

### CreditScoreAction
```typescript
interface CreditScoreAction {
  id: string;
  type: 'positive' | 'negative';
  name: string;
  points: number;
  description: string;
  emoji: string;
}
```

## 🔄 Common Patterns

### Update Score After Transaction
```tsx
const completeTransaction = async (transactionId: number) => {
  // 1. Mark transaction as complete
  await updateTransaction(transactionId, { status: 'completed' });
  
  // 2. Apply points to buyer
  const buyerResult = CreditScoreManager.applyAction(
    transaction.buyerId,
    transaction.buyer.creditScore,
    'COMPLETED_TRANSACTION',
    transaction.buyer.cooldownStatus
  );
  
  // 3. Apply points to seller
  const sellerResult = CreditScoreManager.applyAction(
    transaction.sellerId,
    transaction.seller.creditScore,
    'COMPLETED_TRANSACTION',
    transaction.seller.cooldownStatus
  );
  
  // 4. Update database
  await Promise.all([
    updateUserScore(transaction.buyerId, buyerResult.newScore),
    updateUserScore(transaction.sellerId, sellerResult.newScore),
    saveCreditHistory(buyerResult.historyEntry),
    saveCreditHistory(sellerResult.historyEntry)
  ]);
};
```

### Monthly Batch Processing
```tsx
const processMonthlyRewards = async () => {
  // 1. Find users with no reports in 30 days
  const cleanUsers = await getUsersWithNoReports(30);
  
  cleanUsers.forEach(user => {
    CreditScoreManager.applyAction(
      user.id,
      user.creditScore,
      'NO_REPORTS_30_DAYS',
      user.cooldownStatus
    );
  });
  
  // 2. Find top 5 buyers and sellers
  const topBuyers = await getTopBuyers(5);
  const topSellers = await getTopSellers(5);
  
  [...topBuyers, ...topSellers].forEach(user => {
    CreditScoreManager.applyAction(
      user.id,
      user.creditScore,
      'TOP_5_MONTHLY',
      user.cooldownStatus
    );
  });
  
  // 3. Reset warning counters
  await resetAllWarningCounters();
};
```

### Check Before Action
```tsx
const handlePostProduct = () => {
  if (user.creditScore <= 60) {
    toast.error('Cannot post products with credit score below 61');
    return;
  }
  
  if (cooldownStatus.isActive) {
    toast.warning('Cooldown active - complete existing transactions first');
    return;
  }
  
  // Proceed with posting
  setShowPostProduct(true);
};
```

## 🎯 Complete Example

```tsx
import React from 'react';
import { CreditScoreRing } from './components/CreditScoreRing';
import { useCreditScore } from './components/CreditScoreSystem';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Alert } from './components/ui/alert';

function UserCreditDisplay({ userId, initialScore = 70 }) {
  const {
    score,
    history,
    cooldownStatus,
    applyAction,
    tierInfo
  } = useCreditScore(userId, initialScore);
  
  const handleCompletePurchase = () => {
    applyAction('PURCHASED_FOR_CAUSE', true);
  };
  
  const handleLeaveReview = () => {
    applyAction('LEFT_REVIEW', true);
  };
  
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium">Credit Score</h3>
          <p className="text-sm text-muted-foreground">
            {tierInfo.description}
          </p>
        </div>
        <CreditScoreRing 
          score={score}
          size="lg"
          showAnimation={true}
        />
      </div>
      
      {cooldownStatus.isActive && (
        <Alert variant="warning" className="mb-4">
          Cooldown active until {new Date(cooldownStatus.endDate).toLocaleDateString()}
        </Alert>
      )}
      
      <div className="space-y-2">
        <Button onClick={handleCompletePurchase} className="w-full">
          Complete Purchase (+3 points)
        </Button>
        <Button onClick={handleLeaveReview} variant="outline" className="w-full">
          Leave Review (+1 point)
        </Button>
      </div>
      
      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
        <div className="space-y-2">
          {history.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-center justify-between text-sm">
              <span>
                {entry.emoji} {entry.actionName}
              </span>
              <span className={entry.pointsChange > 0 ? 'text-green-600' : 'text-red-600'}>
                {entry.pointsChange > 0 ? '+' : ''}{entry.pointsChange}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default UserCreditDisplay;
```

---

**Quick Reference Version:** 1.0
**Last Updated:** January 2025
