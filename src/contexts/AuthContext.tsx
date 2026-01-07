import React, { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser, onAuthStateChange, signOut as authSignOut } from '../lib/auth'
import type { UserProfile } from '../lib/services/users'
import { processIskoinBonuses } from '../lib/services/users'
import { toast } from 'sonner'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const profile = await getCurrentUser()
      setUser(profile as any)
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    // Check current user on mount
    getCurrentUser()
      .then((p) => setUser(p as any))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (authUser) => {
      if (authUser) {
        try {
          const profile = await getCurrentUser()
          setUser(profile as any)
        } catch (error) {
          console.error('Error getting user profile:', error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await authSignOut()
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Check for Iskoin bonuses when user logs in or profile is refreshed
  useEffect(() => {
    if (user && !loading) {
      // Run bonus check after a short delay to ensure user is fully loaded
      const checkBonuses = async () => {
        try {
          const result = await processIskoinBonuses(user.id)
          
          // Show toast notification if any bonuses were awarded
          if (result.totalAwarded > 0) {
            if (result.firstTimeBonus.awarded) {
              toast.success(result.firstTimeBonus.message, {
                duration: 5000,
                icon: '🪙',
              })
            }
            
            if (result.weeklyBonus.awarded) {
              toast.success(result.weeklyBonus.message, {
                duration: 5000,
                icon: '🎉',
              })
            }

            // Refresh user profile to get updated Iskoin count
            await refreshUser()
          }
        } catch (error) {
          console.error('Error processing Iskoin bonuses:', error)
        }
      }

      // Check bonuses after 2 seconds to avoid overwhelming the user on login
      const timer = setTimeout(checkBonuses, 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, loading])

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}