"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { signOut } from '../lib/firebaseAuth'
import { db } from '../lib/offline/db'
import { fetchAPI } from '../lib/api'

interface AuthContextType {
  user: any | null
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
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isMaintenance, setIsMaintenance] = useState(false)

  useEffect(() => {
    // Check maintenance mode on client (must never block auth bootstrap)
    try {
      setIsMaintenance(
        window.localStorage.getItem('maintenanceMode') === 'true' &&
          window.location.pathname !== '/maintenance'
      )
    } catch (err) {
      setIsMaintenance(false)
    }

    // Firebase auth state lifecycle
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser)
        if (!fbUser) {
          setProfile(null)
          return
        }

        // Backend resolves firebase UID → profile
        const me = await fetchAPI('/auth/me', { method: 'GET' })
        setProfile(me)

        // Cache for offline use (key by profile.id)
        try {
          await db.profiles.put(me)
        } catch (cacheErr) {
          console.error('[AuthProvider] Failed to cache profile:', cacheErr)
        }
      } catch (err) {
        console.error('[AuthProvider] Profile fetch error:', err)

        // Offline fallback: try to load from local cache using firebase UID as best-effort key
        try {
          const uid = fbUser?.uid
          if (uid) {
            const cachedProfile = await db.profiles.get(uid)
            if (cachedProfile) {
              console.log('[AuthProvider] Loaded profile from offline cache')
              setProfile(cachedProfile)
              return
            }
          }
        } catch (dbErr) {
          console.error('[AuthProvider] Failed to read profile from cache:', dbErr)
        }

        setProfile(null)
      } finally {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut: handleSignOut }}>
      {isMaintenance && profile?.role !== 'SUPER_ADMIN' ? (
        <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">System Maintenance</h1>
          <p className="text-[var(--edlink-blue-text)]/70 mb-6">The system is currently undergoing scheduled maintenance.</p>
          <button
            onClick={() => (window.location.href = '/maintenance')}
            className="px-6 py-3 bg-rose-500 rounded-xl font-bold text-black"
          >
            View Status
          </button>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

