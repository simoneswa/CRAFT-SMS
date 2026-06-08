"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Bell, Search, Menu, Cloud, CloudOff, CloudAlert, Activity, ShieldCheck, X, HardDrive, RefreshCw, Globe } from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSyncStatus } from '../../hooks/useSyncStatus'
import { SyncEngine } from '../../lib/syncEngine'

import { NotificationBell } from './NotificationBell'
import { useTenant } from '../../providers/TenantProvider'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, user } = useAuth()
  const { school } = useTenant()
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false)
  const { isOnline, hasConflicts, pendingCount } = useSyncStatus()
  const [isMounted, setIsMounted] = useState(false)
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  // Dynamic CSS Variables for branding
  const brandingStyles = {
    '--brand-primary': school?.branding?.primary_color || '#0D9488',
    '--brand-secondary': school?.branding?.secondary_color || '#111827',
  } as React.CSSProperties

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userId = user?.id

  useEffect(() => {
    // Guard: only redirect to /login after a stabilization delay.
    // This prevents redirect loops during the brief window when Supabase
    // auth state is still propagating after a router.push from the login page.
    if (!isMounted || isLoading || userId) return

    // Already on login — don't push again
    if (pathname === '/login') return

    const timer = setTimeout(() => {
      // Re-check: user may have been set during the delay
      if (!userId) {
        router.push('/login')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [userId, isLoading, router, isMounted, pathname])

  if (!isMounted || isLoading) {
    return (
      <div className={`min-h-screen ${isSuperAdmin ? 'bg-[#030712] text-white' : 'bg-[var(--brand-surface)] text-[var(--brand-heading)]'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)] rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    // Show spinner briefly while redirect timer is pending
    return (
      <div className={`min-h-screen ${isSuperAdmin ? 'bg-[#030712] text-white' : 'bg-[var(--brand-surface)] text-[var(--brand-heading)]'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-[var(--brand-primary)]/20 border-t-[var(--brand-primary)] rounded-full animate-spin" />
      </div>
    )
  }
  
  return (
    <div className={`min-h-screen flex overflow-hidden ${isSuperAdmin ? 'bg-[#030712] text-white' : 'bg-[var(--brand-surface)] text-[var(--brand-heading)]'}`} style={brandingStyles}>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Command Center Panel */}
      <AnimatePresence>
        {isCommandCenterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setIsCommandCenterOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-[#111827] border-l border-white/5 z-[70] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                   <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Institutional <span className="text-[var(--accent)]">Command Center</span></h2>
                   <p className="text-[9px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest mt-1">Operational Observability Stream</p>
                </div>
                <button onClick={() => setIsCommandCenterOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                   <X className="w-5 h-5 text-[var(--edlink-blue-text)]/70" />
                </button>
              </div>

              <div className="space-y-6">
                 {/* Sync Queue */}
                 <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--edlink-blue-text)]/70">
                          <RefreshCw className={`w-4 h-4 ${pendingCount > 0 ? 'animate-spin' : ''}`} /> Sync Engine
                       </div>
                       <span className={`text-[10px] font-black px-2 py-0.5 rounded ${pendingCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-[var(--edlink-green-brand)]/10 text-emerald-400'}`}>
                          {pendingCount > 0 ? 'SYNCHRONIZING' : 'STABLE'}
                       </span>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] uppercase font-bold text-[var(--edlink-blue-text)]/70">
                          <span>Mutation Queue</span>
                          <span className="text-white">{pendingCount} Pending</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-[var(--accent)]" 
                            initial={{ width: 0 }}
                            animate={{ width: pendingCount > 0 ? '60%' : '100%' }} 
                          />
                       </div>
                    </div>
                 </div>

                 {/* Connection State */}
                 <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--edlink-blue-text)]/70 mb-4">
                       <Globe className="w-4 h-4" /> Realtime Link
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[var(--edlink-green-brand)] shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500'} animate-pulse`} />
                       <span className="text-[10px] font-black uppercase text-white tracking-widest">
                          {isOnline ? 'Active Connection' : 'Link Disconnected'}
                       </span>
                    </div>
                 </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 text-center">
                 <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.3em]">CRAFT SMS AUDIT PROTOCOL v1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full relative z-0">
        {/* Top Header */}
        <header className={`${isSuperAdmin ? 'border-b border-white/5 bg-black/20 text-white' : 'border-b border-[var(--brand-border)] bg-white/95 text-[var(--brand-heading)]'} backdrop-blur-md px-4 md:px-8 h-20 flex items-center justify-between sticky top-0 z-30`}>
          <div className="flex items-center gap-4 flex-1">
            <button 
              className={`${isSuperAdmin ? 'text-[var(--edlink-blue-text)]/70 hover:bg-white/5' : 'text-[var(--brand-body)] hover:bg-[var(--brand-surface)]'} md:hidden p-2 rounded-lg`}
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center ml-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-14 w-auto object-contain block" />
            </div>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-body)]" />
              <input 
                type="text" 
                placeholder="Search everything..." 
                className="w-full bg-white border border-[var(--brand-border)] rounded-3xl py-2.5 pl-11 pr-4 text-sm text-[var(--brand-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/40 transition-all"
              />
            </div>
            {/* System Pulse Indicator - Interactive */}
            <button 
              onClick={() => setIsCommandCenterOpen(true)}
              className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 rounded-full hover:bg-[var(--brand-primary)]/10 transition-all group"
            >
               <div className={`w-2 h-2 rounded-full ${hasConflicts ? 'bg-rose-500' : isOnline ? 'bg-[var(--brand-primary)]' : 'bg-amber-500'} animate-pulse`} />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--brand-muted)] group-hover:text-[var(--brand-primary)] transition-colors">
                  System Pulse: <span className="text-[var(--brand-heading)]">{isOnline ? 'Stable' : 'Restricted'}</span>
               </span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
               {/* Cloud Sync Status — opens Command Center on click */}
               <button onClick={() => setIsCommandCenterOpen(true)} className="relative flex items-center group cursor-pointer" title={hasConflicts ? "Sync Conflicts Detected" : isOnline ? "Online & Synced" : "Offline - Changes queued"}>
                 {!isOnline ? (
                   <CloudOff className="w-5 h-5 text-amber-500" />
                 ) : hasConflicts ? (
                   <CloudAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                 ) : pendingCount > 0 ? (
                   <Cloud className="w-5 h-5 text-[var(--edlink-green-brand)] animate-pulse" />
                 ) : (
                   <Cloud className="w-5 h-5 text-[var(--edlink-green-brand)]" />
                 )}
                 {pendingCount > 0 && !hasConflicts && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--edlink-green-brand)]"></span>
                    </span>
                 )}
               </button>

               <NotificationBell />
            </div>
            <div className="h-8 w-px bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              {/* DEBUG MENU FOR TESTING */}
              {process.env.NODE_ENV === 'development' && (
                <div className="relative group">
                  <button className="px-2 py-1 text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded hover:bg-rose-500/20 uppercase tracking-widest">
                    Debug
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-black border border-white/10 rounded-xl p-2 hidden group-hover:block z-50 shadow-2xl">
                    <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase mb-2 px-2">Offline Simulator</p>
                    <button 
                      onClick={() => SyncEngine.debugAddConflict()}
                      className="w-full text-left px-2 py-2 text-xs font-bold text-rose-400 hover:bg-white/5 rounded-lg"
                    >
                      Trigger Sync Conflict
                    </button>
                  </div>
                </div>
              )}
              {/* END DEBUG MENU */}

              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">{profile?.full_name || 'Loading...'}</p>
                <p className="text-[10px] text-[var(--edlink-green-brand)] font-bold uppercase tracking-widest mt-1">
                  {profile?.role?.replace('_', ' ') || 'Profile'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-blue-500 border border-white/20 flex items-center justify-center font-bold">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${isSuperAdmin ? 'bg-[#030712]' : 'bg-[var(--brand-surface)]'}`}>
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
