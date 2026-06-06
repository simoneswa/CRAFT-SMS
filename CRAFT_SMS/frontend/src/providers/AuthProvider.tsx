"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { db } from '../lib/offline/db'

interface AuthContextType {
  user: User | null
  profile: any | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    // 1. Get initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.warn('Auth session check failed:', err)
        // Keep user/profile as-is; never block the app bootstrap
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Check maintenance mode on client (must never block auth bootstrap)
    try {
      setIsMaintenance(
        window.localStorage.getItem('maintenanceMode') === 'true' &&
          window.location.pathname !== '/maintenance'
      )
    } catch (err) {
      setIsMaintenance(false)
    }

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (session?.user) {
            setUser(session.user)
            await fetchProfile(session.user.id)
          } else {
            setUser(null)
            setProfile(null)
          }
        } catch (err) {
          // Never let listener errors trap isLoading
          console.warn('[AuthProvider] Auth state change handler failed:', err)
          setUser(session?.user ?? null)
          setProfile(null)
        } finally {
          setIsLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, schools(*)')
        .eq('id', userId)
        .single()
      
      if (error) {
        // PGRST116 = no rows found — profile doesn't exist yet
        // Don't sign out, just leave profile null
        if (error.code === 'PGRST116') {
          console.warn('[AuthProvider] No profile row found for this user. Please create one via the SQL Editor.')
          setProfile(null)
          return
        }
        throw error
      }
      
      setProfile(data)
      
      // Cache for offline use
      try {
        await db.profiles.put(data)
      } catch (cacheErr) {
        console.error('[AuthProvider] Failed to cache profile:', cacheErr)
      }
    } catch (err) {
      console.error('[AuthProvider] Profile fetch error:', err)
      
      // Offline fallback: try to load from local cache
      try {
        const cachedProfile = await db.profiles.get(userId)
        if (cachedProfile) {
          console.log('[AuthProvider] Loaded profile from offline cache')
          setProfile(cachedProfile)
          return
        }
      } catch (dbErr) {
        console.error('[AuthProvider] Failed to read profile from cache:', dbErr)
      }
      
      // Do NOT sign out automatically — keep user logged in but with null profile
      setProfile(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut }}>
      {isMaintenance && profile?.role !== 'SUPER_ADMIN' ? (
         <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white text-center">
            <h1 className="text-2xl font-bold mb-2">System Maintenance</h1>
            <p className="text-gray-400 mb-6">The system is currently undergoing scheduled maintenance.</p>
            <button onClick={() => window.location.href = '/maintenance'} className="px-6 py-3 bg-rose-500 rounded-xl font-bold text-black">
               View Status
            </button>
         </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
