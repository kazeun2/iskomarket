# Trustworthy Badge System - Implementation Complete

## Overview
The Trustworthy Badge System is a comprehensive credibility and access control feature for IskoMarket that represents verified credibility and consistent positive marketplace behavior.

## Badge Rules & Access Levels

### Credit Score Tiers

| Credit Score | Badge Status | Access Level | Features |
|-------------|--------------|--------------|----------|
| **90-100** | ✅ **Trustworthy Badge Active** | **Full Access** | • Buy products<br>• Sell products<br>• Send/receive messages<br>• View seller profiles<br>• All platform features |
| **89-61** | ⚪ **No Trustworthy Badge** | **Normal Access** | • Buy products<br>• Sell products<br>• Send/receive messages<br>• View seller profiles<br>• Normal access but not verified as trusted |
| **60 and below** | 🔴 **Under Review – Subject to Removal** | **Limited Access** | • Browse marketplace listings only<br>• **Cannot** contact sellers<br>• **Cannot** view seller profiles<br>• **Cannot** post products |

## Component Implementation

### TrustworthyBadge Component

**Location:** `/components/TrustworthyBadge.tsx`

#### Props
```typescript
interface TrustworthyBadgeProps {
  creditScore: number;        // User's credit score (0-100)
  size?: 'sm' | 'md' | 'lg'; // Badge size
  showLabel?: boolean;        // Show "Trustworthy" label
  variant?: 'full' | 'icon-only'; // Display variant
}
```

#### Usage Examples

**Full Badge with Label:**
```tsx
<TrustworthyBadge 
  creditScore={95}
  size="md"
  showLabel={true}
/>
```

**Icon-Only Badge:**
```tsx
<TrustworthyBadge 
  creditScore={85}
  size="sm"
  variant="icon-only"
/>
```

### Visual Appearance

#### Trustworthy Badge (90-100)
- **Color:** Green gradient (from-green-600 to-emerald-600)
- **Icon:** ✅ ShieldCheck
- **Label:** "Trustworthy"
- **Tooltip:** Full access description

#### Normal Member (61-89)
- **Display:** No badge shown
- **Status:** No Trustworthy Badge
- **Access:** Normal access but not verified as trusted
- **Note:** Badge component returns null for this range

#### Under Review (≤60)
- **Color:** Red gradient (from-red-600 to-rose-600)
- **Icon:** 🔴 ShieldAlert
- **Label:** "Under Review – Subject to Removal"
- **Access:** Limited access (cannot contact sellers, cannot view seller profiles, cannot post products, but can view marketplace listings)
- **Tooltip:** Account under review with rebuild trust message

## Helper Functions

### 1. getUserAccessLevel
Returns the access level for a given credit score.

```typescript
getUserAccessLevel(creditScore: number): 'full' | 'normal' | 'restricted'
```

**Example:**
```typescript
const accessLevel = getUserAccessLevel(currentUser.creditScore);
// Returns: 'full', 'normal', or 'restricted'
```

### 2. canUserPerformAction
Checks if a user can perform a specific action based on their credit score.

```typescript
canUserPerformAction(
  creditScore: number, 
  action: 'post' | 'chat' | 'view-profile' | 'browse'
): boolean
```

**Example:**
```typescript
const canChat = canUserPerformAction(currentUser.creditScore, 'chat');
if (!canChat) {
  toast.error('Your account is under review. Cannot send messages.');
  return;
}
```

### 3. getRestrictionMessage
Gets the appropriate restriction message for an action.

```typescript
getRestrictionMessage(creditScore: number, action: string): string | null
```

**Example:**
```typescript
const message = getRestrictionMessage(currentUser.creditScore, 'post');
if (message) {
  toast.error(message);
}
```

## Integration Points

### 1. ProductGrid Component
**File:** `/components/ProductGrid.tsx`

Shows badge next to seller ratings in product cards:
```tsx
<TrustworthyBadge 
  creditScore={product.seller.creditScore}
  size="sm"
  variant="icon-only"
/>
```

### 2. UserDashboard Component
**File:** `/components/UserDashboard.tsx`

Displays badge next to user's name:
```tsx
<TrustworthyBadge 
  creditScore={currentUser?.creditScore || 70}
  size="md"
  showLabel={true}
/>
```

### 3. SellerProfile Component
**File:** `/components/SellerProfile.tsx`

Shows badge in seller profile header:
```tsx
<TrustworthyBadge 
  creditScore={seller.creditScore || 70}
  size="md"
  showLabel={true}
/>
```

### 4. ProductDetail Component
**File:** `/components/ProductDetail.tsx`

**Recommended Integration:**
Add access restrictions for chat/messaging:
```tsx
const handleContactSeller = () => {
  if (!canUserPerformAction(currentUser.creditScore, 'chat')) {
    const message = getRestrictionMessage(currentUser.creditScore, 'chat');
    toast.error(message);
    return;
  }
  setShowMeetupReminder(true);
};
```

### 5. PostProduct Component
**File:** `/components/PostProduct.tsx`

**Recommended Integration:**
Add access check before allowing product posting:
```tsx
useEffect(() => {
  if (currentUser && !canUserPerformAction(currentUser.creditScore, 'post')) {
    const message = getRestrictionMessage(currentUser.creditScore, 'post');
    toast.error(message);
    onClose();
  }
}, [currentUser]);
```

## Access Restriction Implementation

### Example: Preventing Chat for Under Review Users

```tsx
import { canUserPerformAction, getRestrictionMessage } from './TrustworthyBadge';

// In ProductDetail or ChatModal component
const handleChatClick = () => {
  if (!canUserPerformAction(currentUser.creditScore, 'chat')) {
    toast.error(
      getRestrictionMessage(currentUser.creditScore, 'chat'),
      { duration: 5000 }
    );
    return;
  }
  
  // Proceed with chat
  setShowChat(true);
};
```

### Example: Preventing Product Posting

```tsx
// In PostProduct or Navigation component
const handlePostProduct = () => {
  if (!canUserPerformAction(currentUser.creditScore, 'post')) {
    toast.error(
      getRestrictionMessage(currentUser.creditScore, 'post'),
      { 
        duration: 6000,
        description: 'Rebuild your trust by avoiding violations.'
      }
    );
    return;
  }
  
  setShowPostProduct(true);
};
```

### Example: Preventing Seller Profile View

```tsx
// In ProductGrid or SellerProfile component
const handleSellerClick = (seller: any) => {
  if (!canUserPerformAction(currentUser.creditScore, 'view-profile')) {
    toast.error(
      getRestrictionMessage(currentUser.creditScore, 'view-profile'),
      { duration: 5000 }
    );
    return;
  }
  
  setSelectedSeller(seller);
};
```

## User Experience Flow

### For Users with Credit Score 90-100 (Trustworthy)
1. See green ✅ Trustworthy badge everywhere
2. Full marketplace access
3. Enhanced reputation and trust from other users
4. No restrictions

### For Users with Credit Score 61-89 (Normal)
1. No badge displayed (represented as "No Trustworthy Badge")
2. Normal access but not verified as trusted
3. Can buy, sell, message, and view profiles
4. Can work towards earning Trustworthy badge by reaching 90+ credit score
5. No restrictions on marketplace activities

### For Users with Credit Score ≤60 (Under Review – Subject to Removal)
1. See red 🔴 "Under Review – Subject to Removal" badge
2. Limited access: can only view marketplace listings
3. Cannot contact sellers (chat/messaging disabled)
4. Cannot view seller profiles
5. Cannot post products
6. Attempting restricted actions shows error toast
7. Must rebuild trust to regain full access
8. Remain visible in the marketplace but cannot interact

## Rebuild Trust Process

Users under review can rebuild trust by:
1. **Waiting for account review** - Admins can adjust credit score
2. **Positive behavior** - When account is reinstated, maintaining good behavior
3. **Resolving violations** - Addressing any outstanding issues
4. **Appealing** - Contacting admins through feedback system

## Technical Notes

### Credit Score Storage
- Credit score should be stored in user profile
- Default starting score: **70**
- Range: 0-100
- Updated by admin actions and automated violation system

### Visibility
- Users with credit score ≤60 **remain visible** in the marketplace
- Their products may still be shown (if posted before restriction)
- They cannot post new products or interact

### Toast Notifications
All restriction messages use the `sonner@2.0.3` toast system:
```tsx
import { toast } from 'sonner@2.0.3';

toast.error('Restriction message here', {
  duration: 5000,
  description: 'Additional context'
});
```

## Component Files Modified

1. ✅ `/components/TrustworthyBadge.tsx` - Complete rewrite with new logic
2. ✅ `/components/ProductGrid.tsx` - Integrated badge display
3. ✅ `/components/UserDashboard.tsx` - Integrated badge in user profile
4. ✅ `/components/SellerProfile.tsx` - Integrated badge in seller header

## Recommended Next Steps

1. **Add Access Restrictions:**
   - Update `ProductDetail.tsx` to check credit score before allowing chat
   - Update `PostProduct.tsx` to prevent posting for restricted users
   - Update seller profile click handlers to check credit score

2. **Add Visual Indicators:**
   - Show restriction banner for users with credit score ≤60
   - Add info tooltips explaining how to improve credit score
   - Display badge in notification dropdown

3. **Admin Features:**
   - Credit score management in admin dashboard
   - View users by credit score tier
   - Bulk actions for under-review users

4. **Analytics:**
   - Track badge distribution (how many users in each tier)
   - Monitor trust rebuilding success rate
   - Report on access restriction effectiveness

## Example User Data Structure

```typescript
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  program: string;
  avatar?: string;
  bio?: string;
  creditScore: number; // 0-100, default: 70
  isActive: boolean;
  dateRegistered: string;
  // ... other fields
}
```

## Testing Checklist

- [ ] Trustworthy Badge displays correctly for credit score 90-100 (green with checkmark)
- [ ] No badge displays for credit score 61-89 (component returns null)
- [ ] Under Review badge displays correctly for credit score ≤60 (red with alert icon)
- [ ] Under Review badge shows "Subject to Removal" in full label
- [ ] Icon-only variant works properly
- [ ] Different sizes (sm, md, lg) render correctly
- [ ] Helper functions return correct values
- [ ] Restriction messages include "subject to removal" language
- [ ] Toast notifications appear for restricted actions
- [ ] Users under review (≤60) can browse but not interact
- [ ] Users under review cannot contact sellers
- [ ] Users under review cannot view seller profiles
- [ ] Users under review cannot post products
- [ ] Normal users (61-89) have full access despite no badge
- [ ] Badge appears correctly in all integrated components

## Support & Maintenance

For questions or issues with the Trustworthy Badge system:
- Review this documentation
- Check helper function implementations
- Test with different credit score values
- Ensure currentUser.creditScore is properly set

---

**System Status:** ✅ Fully Implemented and Ready for Integration
**Last Updated:** January 2025
