# IskoMarket Supabase Implementation Guide

## Complete Step-by-Step Guide to Connect Database

This guide will walk you through setting up Supabase for IskoMarket, from creating a project to full database integration with authentication, real-time features, and data persistence.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Supabase Project Setup](#phase-1-supabase-project-setup)
3. [Phase 2: Database Schema Implementation](#phase-2-database-schema-implementation)
4. [Phase 3: Environment Configuration](#phase-3-environment-configuration)
5. [Phase 4: Client Setup](#phase-4-client-setup)
6. [Phase 5: Authentication Integration](#phase-5-authentication-integration)
7. [Phase 6: Data Migration](#phase-6-data-migration)
8. [Phase 7: Real-Time Features](#phase-7-real-time-features)
9. [Phase 8: Testing & Verification](#phase-8-testing--verification)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ A Supabase account (free tier is sufficient)
- ✅ Node.js installed (v16 or higher)
- ✅ Basic understanding of SQL and React
- ✅ IskoMarket codebase with schema files ready

---

## Phase 1: Supabase Project Setup

### Step 1.1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Sign up with GitHub, Google, or email

### Step 1.2: Create New Project
1. Click "New Project" in dashboard
2. Fill in project details:
   - **Organization**: Create or select existing
   - **Project Name**: `iskomarket` (or your preferred name)
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest to Philippines (e.g., Singapore - Southeast Asia)
   - **Pricing Plan**: Free tier is sufficient for development

3. Click "Create new project"
4. Wait 2-3 minutes for project provisioning

### Step 1.3: Save Project Credentials
Once project is ready, navigate to **Settings > API**:

1. **Project URL**: Copy this (looks like: `https://xxxxx.supabase.co`)
2. **API Keys**:
   - `anon` public key (for client-side)
   - `service_role` secret key (for server-side, keep secret!)

**Example:**
```
Project URL: https://abcdefghijk.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **IMPORTANT**: Never commit these keys to GitHub! We'll use environment variables.

---

## Phase 2: Database Schema Implementation

### Step 2.1: Access SQL Editor
1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click "New query"

### Step 2.2: Run Schema File
1. Open `/supabase_schema.sql` from your project
2. Copy the ENTIRE contents
3. Paste into SQL Editor
4. Click "Run" (or press Ctrl/Cmd + Enter)

**What this creates:**
- ✅ 15+ tables (users, products, transactions, etc.)
- ✅ All relationships and foreign keys
- ✅ Triggers for updated_at timestamps
- ✅ Row Level Security (RLS) policies
- ✅ Database functions and views

### Step 2.3: Verify Schema Creation
Go to **Table Editor** and confirm you see:
- users
- products
- transactions
- messages
- notifications
- rewards
- season_stats
- categories
- colleges
- (and more...)

### Step 2.4: Insert Sample Data (Optional)
1. Create new query in SQL Editor
2. Open `/supabase_sample_data.sql`
3. Copy and paste contents
4. Click "Run"

This populates:
- Sample categories
- Sample colleges/programs
- Test users
- Example products

---

## Phase 3: Environment Configuration

### Step 3.1: Create Environment File
In your project root (same level as App.tsx), create `.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Replace with YOUR actual credentials from Step 1.3.

### Step 3.2: Update .gitignore
Ensure `.env.local` is in your `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env*.local
```

### Step 3.3: Verify Environment Variables
TypeScript can access these via:
```typescript
import.meta.env.VITE_SUPABASE_URL
import.meta.env.VITE_SUPABASE_ANON_KEY
```

---

## Phase 4: Client Setup

### Step 4.1: Install Supabase Client
Run in terminal:
```bash
npm install @supabase/supabase-js
```

### Step 4.2: Create Supabase Client File
Create `/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
})
```

### Step 4.3: Generate TypeScript Types (Optional but Recommended)
In terminal:
```bash
npx supabase gen types typescript --project-id "your-project-ref" > lib/database.types.ts
```

This creates type-safe database types for TypeScript.

**Alternative**: Manual types file at `/lib/database.types.ts`:
```typescript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          program: string
          credit_score: number
          iskoins: number
          rating: number
          // ... add all fields
        }
        Insert: {
          id?: string
          email: string
          username: string
          // ... insert fields
        }
        Update: {
          id?: string
          email?: string
          // ... update fields
        }
      }
      // Add other tables...
    }
  }
}
```

---

## Phase 5: Authentication Integration

### Step 5.1: Enable Email Authentication
1. Go to **Authentication > Providers** in Supabase dashboard
2. Enable "Email" provider
3. Configure settings:
   - ✅ Enable email confirmations (optional for development)
   - ✅ Set redirect URLs for your app

### Step 5.2: Create Auth Helper Functions
Create `/lib/auth.ts`:

```typescript
import { supabase } from './supabase'

export interface SignUpData {
  email: string
  password: string
  username: string
  program: string
  studentId: string
}

export interface SignInData {
  email: string
  password: string
}

// Sign Up
export async function signUp(data: SignUpData) {
  const { email, password, username, program, studentId } = data

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        program,
        student_id: studentId
      }
    }
  })

  if (authError) throw authError

  // 2. Create user profile in users table
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        username,
        program,
        credit_score: 100,
        iskoins: 0
      })

    if (profileError) throw profileError
  }

  return authData
}

// Sign In
export async function signIn(data: SignInData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password
  })

  if (error) throw error
  return authData
}

// Sign Out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get Current User
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Fetch full profile from users table
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return profile
}

// Listen to Auth Changes
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}
```

### Step 5.3: Update AuthPage Component
Modify `/components/AuthPage.tsx`:

```typescript
import { signUp, signIn } from '../lib/auth'
import { toast } from 'sonner@2.0.3'

// In handleSubmit function for Sign Up:
const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    await signUp({
      email: formData.email,
      password: formData.password,
      username: formData.username,
      program: formData.program,
      studentId: formData.studentId
    })

    toast.success('Account created successfully!')
    // Redirect to dashboard or home
  } catch (error: any) {
    toast.error(error.message || 'Sign up failed')
  } finally {
    setIsLoading(false)
  }
}

// For Sign In:
const handleSignIn = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    await signIn({
      email: formData.email,
      password: formData.password
    })

    toast.success('Welcome back!')
    // Redirect to home
  } catch (error: any) {
    toast.error(error.message || 'Sign in failed')
  } finally {
    setIsLoading(false)
  }
}
```

### Step 5.4: Create Auth Context (Recommended)
Create `/contexts/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, onAuthStateChange, signOut } from '../lib/auth'

interface AuthContextType {
  user: any | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current user on mount
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

Wrap your App in `/App.tsx`:
```typescript
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* Your app content */}
    </AuthProvider>
  )
}
```

---

## Phase 6: Data Migration

This phase replaces mock data with real database queries.

### Step 6.1: Create Data Service Functions
Create `/lib/services/products.ts`:

```typescript
import { supabase } from '../supabase'

export interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition?: string
  seller_id: string
  images: string[]
  location: string
  status: 'available' | 'sold' | 'reserved'
  is_for_a_cause: boolean
  goal_amount?: number
  raised_amount?: number
  created_at: string
}

// Fetch all products
export async function getProducts(filters?: {
  category?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  forACause?: boolean
}) {
  let query = supabase
    .from('products')
    .select(`
      *,
      seller:users!seller_id(id, username, rating, avatar_url)
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  if (filters?.minPrice) {
    query = query.gte('price', filters.minPrice)
  }

  if (filters?.maxPrice) {
    query = query.lte('price', filters.maxPrice)
  }

  if (filters?.forACause !== undefined) {
    query = query.eq('is_for_a_cause', filters.forACause)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Product[]
}

// Get single product
export async function getProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!seller_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create product
export async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete product
export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

### Step 6.2: Create User Service
Create `/lib/services/users.ts`:

```typescript
import { supabase } from '../supabase'

// Get user profile
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get user's products
export async function getUserProducts(userId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Update Iskoins
export async function updateIskoins(userId: string, amount: number, operation: 'add' | 'subtract') {
  const { data: user } = await supabase
    .from('users')
    .select('iskoins')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const newAmount = operation === 'add' 
    ? user.iskoins + amount 
    : Math.max(0, user.iskoins - amount)

  return updateUserProfile(userId, { iskoins: newAmount })
}

// Update Credit Score
export async function updateCreditScore(userId: string, change: number) {
  const { data: user } = await supabase
    .from('users')
    .select('credit_score')
    .eq('id', userId)
    .single()

  if (!user) throw new Error('User not found')

  const newScore = Math.max(0, Math.min(100, user.credit_score + change))

  return updateUserProfile(userId, { credit_score: newScore })
}
```

### Step 6.3: Update App.tsx to Use Real Data
Modify `/App.tsx`:

```typescript
import { useEffect, useState } from 'react'
import { getProducts } from './lib/services/products'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const handleFilterChange = async (filters: any) => {
    try {
      setLoading(true)
      const data = await getProducts(filters)
      setProducts(data)
    } catch (error) {
      console.error('Error filtering products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Rest of your component...
}
```

---

## Phase 7: Real-Time Features

### Step 7.1: Set Up Real-Time Subscriptions
For real-time chat and notifications:

```typescript
// In ChatModal.tsx or messaging component
import { supabase } from '../lib/supabase'

useEffect(() => {
  // Subscribe to new messages
  const channel = supabase
    .channel('messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`
      },
      (payload) => {
        console.log('New message received:', payload.new)
        // Add message to state
        setMessages(prev => [...prev, payload.new])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [user.id])
```

### Step 7.2: Real-Time Notifications
```typescript
// In NotificationSystem.tsx
useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Show toast notification
        toast.info(payload.new.message)
        // Update notification count
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user.id])
```

---

## Phase 8: Testing & Verification

### Step 8.1: Test Authentication
1. ✅ Try signing up with new account
2. ✅ Verify email confirmation (if enabled)
3. ✅ Sign in with credentials
4. ✅ Check user profile loads correctly
5. ✅ Test sign out

### Step 8.2: Test Data Operations
1. ✅ Create new product listing
2. ✅ View product details
3. ✅ Update product
4. ✅ Delete product
5. ✅ Test filters and search

### Step 8.3: Test Real-Time Features
1. ✅ Open two browser windows
2. ✅ Send message in one window
3. ✅ Verify it appears in other window
4. ✅ Test notifications

### Step 8.4: Check Database in Supabase Dashboard
1. Go to **Table Editor**
2. Verify data appears in tables
3. Check **Authentication > Users** for registered users

---

## Troubleshooting

### Common Issues

#### Issue 1: "Missing Supabase environment variables"
**Solution:** Check `.env.local` exists with correct variable names starting with `VITE_`

#### Issue 2: Authentication fails
**Solution:** 
- Check email provider is enabled in Supabase dashboard
- Verify RLS policies are correctly set
- Check browser console for error messages

#### Issue 3: Data not loading
**Solution:**
- Check RLS policies allow reading data
- Verify user is authenticated
- Check browser network tab for API errors

#### Issue 4: Real-time not working
**Solution:**
- Enable Realtime in Supabase dashboard
- Check channel subscriptions are correct
- Verify user has permission to subscribe

#### Issue 5: TypeScript errors
**Solution:**
- Regenerate types: `npx supabase gen types typescript`
- Check import paths are correct

---

## Security Best Practices

### Row Level Security (RLS)
Already implemented in schema, but verify:

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Products visible to all, but only owner can update
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
USING (true);

CREATE POLICY "Users can update own products"
ON products FOR UPDATE
USING (auth.uid() = seller_id);
```

### Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use `anon` key for client-side
- ✅ Keep `service_role` key secret (server-side only)

### API Rate Limiting
Supabase free tier limits:
- 500MB database
- 1GB file storage
- 2GB bandwidth
- 50,000 monthly active users

---

## Next Steps After Implementation

1. **Image Upload**: Implement Supabase Storage for product images
2. **File Management**: Store user avatars in Storage
3. **Advanced Queries**: Optimize with database indexes
4. **Monitoring**: Set up error tracking
5. **Backup**: Configure automatic backups
6. **Performance**: Add caching layer
7. **Scaling**: Monitor usage and upgrade plan if needed

---

## Useful Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

## Support & Help

If you encounter issues:
1. Check Supabase Dashboard logs
2. Review browser console errors
3. Check Network tab for API failures
4. Search Supabase Discord community
5. Review existing schema files in `/guidelines`

---

**Last Updated:** November 25, 2024  
**Version:** 1.0  
**Status:** Ready for Implementation
