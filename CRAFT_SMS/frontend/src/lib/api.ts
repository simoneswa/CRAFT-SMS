import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Log prominently if missing so deployment sync issues are obvious
if (!API_BASE_URL) {
  console.error(`
[CRAFT SMS] CRITICAL: NEXT_PUBLIC_API_URL is missing!
  API calls will likely fail. Ensure your Vercel deployment has 
  NEXT_PUBLIC_API_URL set to your Railway backend URL.
  (e.g., https://craft-backend.up.railway.app/api)
`)
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any || {}),
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // Ensure robust base URL format (remove trailing slash or /v1 suffix if misconfigured)
  let baseUrl = API_BASE_URL || ''
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)
  if (baseUrl.endsWith('/v1')) baseUrl = baseUrl.slice(0, -3)

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || 'API Request Failed')
  }

  return response.json()
}
