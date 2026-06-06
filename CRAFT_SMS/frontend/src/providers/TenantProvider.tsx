"use client"
// Build Trigger: Applying refined tenant extraction logic to exclude Vercel domains.

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { db } from '../lib/offline/db'

interface School {
  id: string
  name: string
  subdomain: string
  logo_url?: string
  branding?: any
}

interface TenantContextType {
  school: School | null
  isLoading: boolean
  error: string | null
}

const TenantContext = createContext<TenantContextType>({
  school: null,
  isLoading: true,
  error: null,
})

/**
 * Extracts the tenant subdomain from the current browser hostname.
 *
 * Handles:
 *   craft-sms.vercel.app                         → "craft-sms"   (production)
 *   craft-sms-git-main-simoneswas-projects.vercel.app → "craft-sms"   (git preview)
 *   craft-sms-pr-42-user.vercel.app              → "craft-sms"   (PR preview)
 *   craft-sms-abc123def456.vercel.app            → "craft-sms"   (hash preview)
 *   school.craftsms.com                          → "school"      (custom domain)
 *   school.localhost:3000                        → "school"      (local dev)
 *   localhost:3000                               → null          (root, no tenant)
 */
function extractSubdomain(): string | null {
  const hostname = window.location.hostname
  console.log('[TenantProvider] window.location.hostname =', hostname)

  // Strip port
  const host = hostname.split(':')[0]

  // --- Vercel deployments (Production & Preview) ---
  // Exclude all .vercel.app hostnames from tenant resolution.
  // This ensures that the root project URL and all previews load the landing page.
  if (host.endsWith('.vercel.app')) {
    console.log('[TenantProvider] vercel domain detected — bypassing tenant resolution')
    return null
  }

  // --- Custom root domain ---
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'craftsms.com'
  if (host === rootDomain || host === `www.${rootDomain}`) {
    console.log('[TenantProvider] root domain — no tenant')
    return null
  }
  if (host.endsWith(`.${rootDomain}`)) {
    const sub = host.slice(0, host.length - rootDomain.length - 1)
    console.log('[TenantProvider] custom domain → subdomain =', sub)
    return sub
  }

  // --- Localhost with subdomain ---
  const parts = host.split('.')
  const isIp = host.match(/^\d+\.\d+\.\d+\.\d+$/)

  if (parts.length >= 2 && !isIp) {
    const first = parts[0]
    if (!['www', 'localhost', 'api'].includes(first)) {
      console.log('[TenantProvider] localhost subdomain =', first)
      return first
    }
  }

  // Bare localhost — root, no tenant
  console.log('[TenantProvider] bare localhost — no tenant')
  return null
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)

  useEffect(() => {
    const detectedSubdomain = extractSubdomain()
    setSubdomain(detectedSubdomain)

    // No subdomain → root domain or preview bypass, not a tenant page
    if (!detectedSubdomain) {
      setIsLoading(false)
      return
    }

    const fetchSchool = async (attempt = 1) => {
      console.log(
        `[TenantProvider] fetching school for subdomain="${detectedSubdomain}" (attempt ${attempt})`
      )
      try {
        const { data, error: queryError } = await supabase
          .from('schools')
          .select('*')
          .eq('subdomain', detectedSubdomain)
          .eq('is_active', true)
          .single()

        console.log('[TenantProvider] Supabase result:', { data, queryError })

        if (queryError) {
          // PGRST116 = no rows → this subdomain doesn't exist in DB
          if (queryError.code === 'PGRST116') {
            console.warn('[TenantProvider] No active school found for subdomain:', detectedSubdomain)
            setError(`No active school found for "${detectedSubdomain}"`)
            return
          }

          // Transient error → retry once after 1.5s
          if (attempt < 2) {
            console.warn('[TenantProvider] Transient error, retrying in 1.5s…', queryError.message)
            setTimeout(() => fetchSchool(2), 1500)
            return
          }

          throw queryError
        }

        // ✅ School found
        console.log('[TenantProvider] School loaded successfully:', data?.name)
        setSchool(data)
        setError(null)
        
        // Cache for offline use
        try {
          await db.schools.put(data)
        } catch (cacheErr) {
          console.error('[TenantProvider] Failed to cache school:', cacheErr)
        }
      } catch (err: any) {
        console.error('[TenantProvider] Fatal error fetching school:', err)
        
        // Offline fallback: check local DB
        try {
          const cachedSchool = await db.schools.where('subdomain').equals(detectedSubdomain).first()
          if (cachedSchool) {
            console.log('[TenantProvider] Loaded school from local offline cache:', cachedSchool.name)
            setSchool(cachedSchool)
            setError(null)
            return
          }
        } catch (dbErr) {
          console.error('[TenantProvider] Failed to read school from cache:', dbErr)
        }

        // Never wipe an already-loaded school due to a subsequent error
        setSchool(prev => {
          if (prev) {
            console.warn('[TenantProvider] Keeping existing school state despite error')
            return prev
          }
          setError(err.message || 'Failed to load school')
          return null
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchool()
  }, [])

  // Only show "School Not Found" when ALL of these are true:
  //   1. A subdomain was detected (user intended to access a tenant)
  //   2. Loading finished
  //   3. School is still null (not found or error)
  //   4. An error is set (not just a null-school on root domain)
  const showNotFound = !isLoading && !!subdomain && !school && !!error

  if (showNotFound) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center">School Not Found</h1>
        <p className="text-gray-400 text-center max-w-md mb-2">
          The subdomain <code className="text-teal-400 font-mono">&quot;{subdomain}&quot;</code> doesn&apos;t match an active school.
        </p>
        <p className="text-gray-600 text-center text-sm max-w-md mb-8">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all shadow-lg shadow-teal-500/20"
        >
          Return to Global Directory
        </button>
      </div>
    )
  }

  return (
    <TenantContext.Provider value={{ school, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)
