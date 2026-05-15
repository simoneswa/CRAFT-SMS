"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
 * Supports:
 *   - craft-sms.vercel.app          → "craft-sms"
 *   - school.craftsms.com           → "school"
 *   - school.localhost:3000         → "school"
 *   - localhost:3000                → null  (root, no tenant)
 *   - craft-sms-abc.vercel.app      → "craft-sms-abc" (preview build, attempted lookup)
 */
function extractSubdomain(): string | null {
  const hostname = window.location.hostname
  console.log('[TenantProvider] window.location.hostname =', hostname)

  // Strip port (e.g. localhost:3000 → localhost)
  const host = hostname.split(':')[0]

  // Case 1: Vercel deployment — e.g. "craft-sms.vercel.app"
  if (host.endsWith('.vercel.app')) {
    const subdomain = host.replace('.vercel.app', '')
    console.log('[TenantProvider] vercel.app subdomain =', subdomain)
    return subdomain
  }

  // Case 2: Custom root domain — e.g. "craftsms.com" or "school.craftsms.com"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'craftsms.com'
  if (host === rootDomain || host === `www.${rootDomain}`) {
    console.log('[TenantProvider] root domain, no subdomain')
    return null
  }
  if (host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.slice(0, host.length - rootDomain.length - 1)
    console.log('[TenantProvider] custom domain subdomain =', subdomain)
    return subdomain
  }

  // Case 3: localhost with subdomain — e.g. "school.localhost"
  const parts = host.split('.')
  if (parts.length >= 2) {
    const first = parts[0]
    if (!['www', 'localhost', 'api'].includes(first)) {
      console.log('[TenantProvider] localhost subdomain =', first)
      return first
    }
  }

  // Case 4: bare "localhost" — root, no tenant
  console.log('[TenantProvider] no subdomain found for host =', host)
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

    // No subdomain = root domain access, not a tenant page
    if (!detectedSubdomain) {
      setIsLoading(false)
      return
    }

    const fetchSchool = async (attempt = 1) => {
      console.log(`[TenantProvider] fetching school for subdomain="${detectedSubdomain}" (attempt ${attempt})`)
      try {
        const { data, error: queryError } = await supabase
          .from('schools')
          .select('*')
          .eq('subdomain', detectedSubdomain)
          .eq('is_active', true)
          .single()

        console.log('[TenantProvider] Supabase result:', { data, queryError })

        if (queryError) {
          // PGRST116 = no rows found (school doesn't exist or is inactive)
          if (queryError.code === 'PGRST116') {
            console.warn('[TenantProvider] School not found in DB for subdomain:', detectedSubdomain)
            setError(`No active school found for "${detectedSubdomain}"`)
            return
          }

          // Network/transient error — retry once after 1.5s
          if (attempt < 2) {
            console.warn('[TenantProvider] Transient error, retrying in 1.5s...', queryError.message)
            setTimeout(() => fetchSchool(2), 1500)
            return
          }

          throw queryError
        }

        // ✅ Success — school found
        console.log('[TenantProvider] School loaded:', data)
        setSchool(data)
        setError(null)
      } catch (err: any) {
        console.error('[TenantProvider] Fatal error fetching school:', err)
        // Only set error if we don't already have valid school data
        setSchool(prev => {
          if (prev) {
            console.warn('[TenantProvider] Keeping existing school state despite fetch error')
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

  // Show "School Not Found" only when:
  // - We have a subdomain (user intended to access a tenant)
  // - Loading is done
  // - There is an error OR school is null after a completed fetch
  const showNotFound = !isLoading && subdomain && !school && error

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
          The subdomain <code className="text-teal-400 font-mono">"{subdomain}"</code> doesn't match an active school.
        </p>
        <p className="text-gray-600 text-center text-sm max-w-md mb-8">
          {error}
        </p>
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
