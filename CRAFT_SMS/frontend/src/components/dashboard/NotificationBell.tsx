"use client"

import { useState, useEffect } from 'react'
import { Bell, X, CheckCircle2, AlertCircle, CreditCard, BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { fetchAPI } from '@/lib/api'

export function NotificationBell() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!profile?.id) return

    let isMounted = true
    let channel: any

    const safeSetNotifications = (next: any[]) => {
      if (!isMounted) return
      setNotifications(Array.isArray(next) ? next : [])
    }

    const fetchNotifications = async () => {
      try {
        const data = await fetchAPI('/notifications')
        safeSetNotifications(data || [])
      } catch (err) {
        // Non-fatal: keep dashboard interactive even if notifications endpoint fails
        console.warn('Failed to fetch notifications. The table might be missing or restricted.', err)
        safeSetNotifications([])
      }
    }

    fetchNotifications()

    try {
      // Subscribe to new notifications (non-fatal if table/RLS/network fails)
      channel = supabase
        .channel(`realtime:notifications:${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            // payload handling must not crash render tree
            if (!isMounted) return
            setNotifications((prev) => [payload?.new, ...prev].filter(Boolean))
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.warn(
              'Supabase Realtime subscription error (likely missing table or RLS):',
              err
            )
            // Safe fallback: keep an empty list rather than crashing the UI
            safeSetNotifications([])
          }
        })
    } catch (err) {
      console.warn('Failed to initialize realtime subscription cleanly:', err)
      safeSetNotifications([])
    }

    return () => {
      isMounted = false
      if (channel) {
        try {
          supabase.removeChannel(channel)
        } catch (e) {
          console.warn('Failed to remove channel:', e)
        }
      }
    }
  }, [profile?.id])

  const markAsRead = async (id: string) => {
    try {
      await fetchAPI(`/notifications/${id}/read`, { method: 'POST' })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      )
    } catch (err) {
      // Non-fatal: allow user to continue using dashboard
      console.error('Failed to mark notification as read', err)
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? 'text-teal-400' : 'text-gray-400 group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-teal-500 text-black text-[10px] font-black rounded-full flex items-center justify-center -translate-y-1/3 translate-x-1/3 shadow-lg shadow-teal-500/20">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-[350px] max-h-[500px] bg-[#0a0f18] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-sm text-white">Notifications</h3>
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
              </div>

              <div className="overflow-y-auto max-h-[400px] custom-scrollbar divide-y divide-white/5">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-sm">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      onClick={() => !notif.read_at && markAsRead(notif.id)}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer group relative ${!notif.read_at ? 'bg-teal-500/[0.02]' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          notif.type === 'FINANCE' ? 'bg-amber-500/10 text-amber-500' :
                          notif.type === 'ACADEMIC' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-teal-500/10 text-teal-400'
                        }`}>
                          {notif.type === 'FINANCE' && <CreditCard className="w-5 h-5" />}
                          {notif.type === 'ACADEMIC' && <BookOpen className="w-5 h-5" />}
                          {notif.type === 'INFO' && <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold truncate ${!notif.read_at ? 'text-white' : 'text-gray-400'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter mt-2">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {!notif.read_at && (
                         <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-500 shadow-sm shadow-teal-500/50" />
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-3 bg-white/5 border-t border-white/10 text-center">
                 <Link href="/dashboard/news" onClick={() => setIsOpen(false)} className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-all">View All Activity</Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
