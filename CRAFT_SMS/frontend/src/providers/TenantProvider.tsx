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

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSubdomain, setCurrentSubdomain] = useState<string | null>(null)

  useEffect(() => {
    const fetchSchool = async () => {
      const hostname = window.location.hostname
      const parts = hostname.split('.')
      
      // Extract subdomain
      let subdomain = null
      if (parts.length >= 2) {
        const first = parts[0]
        if (!['www', 'localhost', 'api'].includes(first)) {
          subdomain = first
        }
      }

      if (!subdomain) {
        setIsLoading(false)
        return
      }
      
      setCurrentSubdomain(subdomain)

      try {
        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .eq('subdomain', subdomain)
          .eq('is_active', true)
          .single()

        if (error) throw error
        setSchool(data)
      } catch (err: any) {
        console.error('Error fetching school:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchool()
  }, [])

  if (!isLoading && error && currentSubdomain) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center">School Not Found</h1>
        <p className="text-gray-400 text-center max-w-md mb-8">
          The subdomain you're trying to access doesn't exist or has been deactivated. Please check the URL and try again.
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
