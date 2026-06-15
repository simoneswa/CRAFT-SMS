"use client"
// Build Trigger: Applying refined tenant extraction logic to exclude Vercel domains.

import React, { createContext, useContext, useEffect, useState } from 'react'
import { fetchAPI } from '../lib/api'
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
 *   craft-sms-5bb1c.firebaseapp.com              → "demo"
 *   craft-sms-5bb1c.web.app                      → "demo"
 *   craftsms.com                                 → null
 *   school.craftsms.com                          → "school"
 *   school.localhost:3000                        → "school"
 *   localhost:3000                               → "demo"
 */
function extractSubdomain(): string | null {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  console.log('[TenantProvider] window.location.hostname =', hostname)

  // Strip port
  const host = hostname.split(':')[0] || ''

  // --- Vercel & Firebase Hosting deployments (Production & Previews) ---
  // Exclude all .vercel.app, .web.app, and .firebaseapp.com hostnames from tenant resolution.
  // This ensures that the root project URL and all previews load the landing page.
  if (host.endsWith('.vercel.app') || host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) {
    console.log('[TenantProvider] platform deployment domain detected — falling back to "demo"')
    return 'demo'
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

  // Bare localhost — fallback to demo for local testing
  console.log('[TenantProvider] bare localhost — falling back to "demo"')
  return 'demo'
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subdomain, setSubdomain] = useState<string | null>(null)

  useEffect(() => {
    // Only run on client side (window is defined)
    if (typeof window === 'undefined') return

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
        // Resolve school via backend API (Firebase-authenticated or Public depending on backend route)
        const data = await fetchAPI(`/tenants/by-subdomain?subdomain=${detectedSubdomain}`, { method: 'GET' })

        if (!data) {
          console.warn('[TenantProvider] No active school found for subdomain:', detectedSubdomain)
          setError(`No active school found for "${detectedSubdomain}"`)
          return
        }

        //  School found
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
        <p className="text-[var(--edlink-blue-text)]/70 text-center max-w-md mb-2">
          The subdomain <code className="text-[var(--edlink-green-brand)] font-mono">&quot;{subdomain}&quot;</code> doesn&apos;t match an active school.
        </p>
        <p className="text-[var(--edlink-blue-text)]/70 text-center text-sm max-w-md mb-8">{error}</p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 rounded-xl bg-[var(--edlink-green-brand)] hover:bg-[var(--edlink-green-hover)] text-black font-bold transition-all shadow-lg shadow-teal-500/20"
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
