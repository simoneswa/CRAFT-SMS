import { supabase } from './supabase'
import { db } from './offline/db'
import { v4 as uuidv4 } from 'uuid'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'

// Persistent Device ID
const getDeviceId = () => {
  if (typeof window === 'undefined') return 'server'
  let id = localStorage.getItem('craft_device_id')
  if (!id) {
    id = uuidv4()
    localStorage.setItem('craft_device_id', id)
  }
  return id
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine
  const method = options.method || 'GET'
  
  // Scoped Interception for Phase 1
  const isSyncable = endpoint.includes('/grades') || endpoint.includes('/attendance')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Device-ID': getDeviceId(),
    ...(options.headers as any || {}),
  }

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  // --- OFFLINE LOGIC ---
  if (isOffline && isSyncable && method !== 'GET') {
    console.log(`[API:OFFLINE] Queuing mutation for ${endpoint}`)
    
    const mutationId = uuidv4()
    await db.pendingMutations.add({
      id: mutationId,
      tenantId: 'derived-on-server', // Security: derived from JWT
      deviceId: getDeviceId(),
      entityType: endpoint.includes('/grades') ? 'grade' : 'attendance',
      operation: method as any,
      payload: JSON.parse(options.body as string || '{}'),
      timestamp: Date.now(),
      retryCount: 0,
      status: 'PENDING',
      version: 1,
      checksum: 'TBD'
    })

    // Return optimistic success
    return { status: 'queued', mutationId }
  }

  // --- ONLINE LOGIC ---
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.detail || 'API Request Failed')
    }

    return response.json()
  } catch (error) {
    // If request fails due to network, fall back to queue if syncable
    if (isSyncable && method !== 'GET') {
       const mutationId = uuidv4()
       await db.pendingMutations.add({
         id: mutationId,
         tenantId: 'derived-on-server',
         deviceId: getDeviceId(),
         entityType: endpoint.includes('/grades') ? 'grade' : 'attendance',
         operation: method as any,
         payload: JSON.parse(options.body as string || '{}'),
         timestamp: Date.now(),
         retryCount: 0,
         status: 'PENDING',
         version: 1,
         checksum: 'TBD'
       })
       return { status: 'queued', mutationId }
    }
    throw error
  }
}
