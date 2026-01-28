# ProfileAvatarWithScore Component Guide

## Overview

The `ProfileAvatarWithScore` component displays a user's profile picture surrounded by an animated circular credit score ring. This is the Supabase-ready version that works seamlessly with real database data.

## Features

✅ Circular avatar with animated credit score ring  
✅ 5 color-coded tiers based on credit score  
✅ Smooth animations on mount and score changes  
✅ 4 responsive size options  
✅ Special pulse effect for Elite tier (100 score)  
✅ Clean, centered layout  
✅ Compatible with Supabase user profiles  

## Usage

### Basic Usage

```tsx
import { ProfileAvatarWithScore } from './components/ProfileAvatarWithScore'

<ProfileAvatarWithScore
  src={user.avatar_url || '/default-avatar.png'}
  alt={user.username}
  creditScore={user.credit_score}
  size="md"
/>
```

### With Supabase User Data

```tsx
import { useAuth } from './contexts/AuthContext'
import { ProfileAvatarWithScore } from './components/ProfileAvatarWithScore'

function UserProfile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <ProfileAvatarWithScore
      src={user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'}
      alt={user.username}
      creditScore={user.credit_score}
      size="lg"
      showRing={true}
      showAnimation={true}
    />
  )
}
```

### In Navigation Bar

```tsx
<ProfileAvatarWithScore
  src={currentUser.avatar_url}
  alt={currentUser.username}
  creditScore={currentUser.credit_score}
  size="sm"
/>
```

### In Profile Page

```tsx
<ProfileAvatarWithScore
  src={profileUser.avatar_url}
  alt={profileUser.username}
  creditScore={profileUser.credit_score}
  size="xl"
  className="mb-4"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | Required | Image URL for the avatar |
| `alt` | `string` | Required | Alt text for the image |
| `creditScore` | `number` | Required | Credit score value (0-100) |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Size of the avatar with ring |
| `showRing` | `boolean` | `true` | Whether to show the credit score ring |
| `showAnimation` | `boolean` | `true` | Whether to animate the ring on mount |
| `className` | `string` | `''` | Additional CSS classes |

## Sizes

### Small (`sm`)
- Container: 48px × 48px
- Avatar: 36px × 36px
- Perfect for: Navigation bars, compact lists

### Medium (`md`) - Default
- Container: 64px × 64px
- Avatar: 48px × 48px
- Perfect for: User cards, comments, messages

### Large (`lg`)
- Container: 96px × 96px
- Avatar: 76px × 76px
- Perfect for: Profile headers, modal dialogs

### Extra Large (`xl`)
- Container: 128px × 128px
- Avatar: 100px × 100px
- Perfect for: Full profile pages, hero sections

## Credit Score Tiers & Colors

| Score Range | Tier | Color | Visual Effect |
|-------------|------|-------|---------------|
| 100 | Elite Isko 💎 | Cyan (`#06B6D4`) | Pulsing glow animation |
| 80-99 | Trusted 🟢 | Green (`#10B981`) | Solid glow |
| 70-79 | Developing 💛 | Yellow (`#F59E0B`) | Solid glow |
| 61-69 | Recovering 🟠 | Orange (`#F97316`) | Solid glow |
| 0-60 | At Risk 🔴 | Red (`#EF4444`) | Solid glow |

## Examples

### Navbar User Menu

```tsx
<div className="flex items-center gap-3">
  <ProfileAvatarWithScore
    src={user.avatar_url}
    alt={user.username}
    creditScore={user.credit_score}
    size="sm"
  />
  <div>
    <p className="font-medium">{user.username}</p>
    <p className="text-xs text-muted-foreground">Score: {user.credit_score}</p>
  </div>
</div>
```

### Product Seller Card

```tsx
<div className="flex items-center gap-4 p-4 border rounded-lg">
  <ProfileAvatarWithScore
    src={seller.avatar_url}
    alt={seller.username}
    creditScore={seller.credit_score}
    size="md"
  />
  <div className="flex-1">
    <h3 className="font-semibold">{seller.username}</h3>
    <p className="text-sm text-muted-foreground">{seller.program}</p>
    <div className="flex items-center gap-2 mt-1">
      <span className="text-sm">⭐ {seller.rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">
        {seller.total_ratings} reviews
      </span>
    </div>
  </div>
</div>
```

### Profile Page Header

```tsx
<div className="flex flex-col items-center gap-4 py-8">
  <ProfileAvatarWithScore
    src={user.avatar_url}
    alt={user.username}
    creditScore={user.credit_score}
    size="xl"
  />
  <div className="text-center">
    <h1 className="text-2xl font-bold">{user.username}</h1>
    <p className="text-muted-foreground">{user.program}</p>
    <div className="flex items-center justify-center gap-4 mt-2">
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{user.credit_score}</p>
        <p className="text-xs text-muted-foreground">Credit Score</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{user.iskoins}</p>
        <p className="text-xs text-muted-foreground">Iskoins</p>
      </div>
    </div>
  </div>
</div>
```

### User List with Dynamic Scores

```tsx
{users.map((user) => (
  <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg">
    <ProfileAvatarWithScore
      src={user.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'}
      alt={user.username}
      creditScore={user.credit_score}
      size="md"
    />
    <div className="flex-1">
      <p className="font-medium">{user.username}</p>
      <p className="text-xs text-muted-foreground">{user.program}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium">{user.credit_score}/100</p>
      <p className="text-xs text-muted-foreground">
        {user.credit_score >= 80 ? 'Trusted' : 
         user.credit_score >= 70 ? 'Developing' : 
         user.credit_score >= 61 ? 'Recovering' : 'At Risk'}
      </p>
    </div>
  </div>
))}
```

## Performance Tips

1. **Disable animations for lists**: Set `showAnimation={false}` when rendering many avatars
2. **Lazy load images**: Use the `LazyImage` component for avatar sources
3. **Memoize components**: Wrap in `React.memo()` for static user data

```tsx
import { memo } from 'react'

const MemoizedAvatar = memo(ProfileAvatarWithScore)

// Use in lists
{users.map((user) => (
  <MemoizedAvatar
    key={user.id}
    src={user.avatar_url}
    alt={user.username}
    creditScore={user.credit_score}
    size="sm"
    showAnimation={false}
  />
))}
```

## Integration with Supabase

### Real-time Score Updates

```tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { ProfileAvatarWithScore } from './components/ProfileAvatarWithScore'

function LiveUserAvatar({ userId }: { userId: string }) {
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    // Initial fetch
    const fetchUser = async () => {
      const { data } = await supabase
        .from('users')
        .select('avatar_url, username, credit_score')
        .eq('id', userId)
        .single()
      
      setUserData(data)
    }

    fetchUser()

    // Subscribe to changes
    const subscription = supabase
      .channel(`user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          setUserData(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  if (!userData) return <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />

  return (
    <ProfileAvatarWithScore
      src={userData.avatar_url}
      alt={userData.username}
      creditScore={userData.credit_score}
      size="md"
    />
  )
}
```

## Accessibility

- Uses semantic HTML with proper `alt` text
- Ring colors have sufficient contrast
- Animations respect `prefers-reduced-motion` (set `showAnimation={false}`)

## Comparison: ProfileAvatarWithScore vs UserAvatarWithHighlight

| Feature | ProfileAvatarWithScore | UserAvatarWithHighlight |
|---------|----------------------|------------------------|
| Purpose | Supabase integration | Existing implementation |
| Credit Score Ring | ✅ Full circular ring | ✅ Badge corner |
| Animation | ✅ Smooth SVG animation | ✅ Various effects |
| Database Ready | ✅ Yes | ⚠️ May need updates |
| Sizes | 4 (sm, md, lg, xl) | Varies |
| Use Case | New Supabase features | Legacy compatibility |

## Migration from Existing Components

Replace existing avatar components:

```tsx
// Before
<UserAvatarWithHighlight ... />

// After
<ProfileAvatarWithScore
  src={user.avatar_url}
  alt={user.username}
  creditScore={user.credit_score}
  size="md"
/>
```

---

**Created**: November 28, 2024  
**Compatible with**: Supabase Integration  
**Status**: ✅ Production Ready
