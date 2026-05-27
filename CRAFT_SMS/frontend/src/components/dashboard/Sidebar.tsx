"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Bell, 
  Trophy, 
  Settings, 
  LogOut,
  GraduationCap,
  BookOpen,
  Calendar,
  ShieldCheck,
  Building2,
  BarChart3,
  Activity,
  History,
  Globe,
  Lock,
  Mail
} from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { useAuth } from '@/providers/AuthProvider'

interface SidebarItem {
  icon: any
  label: string
  href: string
  roles?: string[]
}

const tenantSidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Users, label: 'Students', href: '/dashboard/students', roles: ['SCHOOL_ADMIN', 'TEACHER'] },
  { icon: BookOpen, label: 'Grades', href: '/dashboard/grades', roles: ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT'] },
  { icon: BookOpen, label: 'Gradebook', href: '/dashboard/gradebook', roles: ['SCHOOL_ADMIN', 'TEACHER'] },
  { icon: Calendar, label: 'Attendance', href: '/dashboard/attendance', roles: ['SCHOOL_ADMIN', 'TEACHER'] },
  { icon: CreditCard, label: 'Financials', href: '/dashboard/finance', roles: ['SCHOOL_ADMIN', 'BUSINESS', 'STUDENT'] },
  { icon: Trophy, label: 'Leaderboard', href: '/dashboard/gamification' },
  { icon: Bell, label: 'News Feed', href: '/dashboard/news' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

const superAdminSidebarItems: SidebarItem[] = [
  { icon: ShieldCheck, label: 'Control Center', href: '/dashboard' },
  { icon: Building2, label: 'Tenants', href: '/dashboard/tenants' },
  { icon: BarChart3, label: 'Global Analytics', href: '/dashboard/analytics' },
  { icon: Activity, label: 'System Health', href: '/dashboard/health' },
  { icon: Lock, label: 'Security Logs', href: '/dashboard/security' },
  { icon: History, label: 'Audit Logs', href: '/dashboard/audit' },
  { icon: Mail, label: 'Announcements', href: '/dashboard/announcements' },
  { icon: Globe, label: 'School Status', href: '/dashboard/status' },
  { icon: Settings, label: 'System Settings', href: '/dashboard/system-settings' },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { school } = useTenant()
  const { profile, signOut } = useAuth()
  const [isMounted, setIsMounted] = React.useState(false)
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN'

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Determine which sidebar items to show
  const isRootDomain = !school
  
  const activeSidebarItems = (isSuperAdmin && isRootDomain) 
    ? superAdminSidebarItems 
    : tenantSidebarItems

  // Filter items based on user role
  const filteredItems = activeSidebarItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(profile?.role)
  })

  if (!isMounted) return null

  return (
    <aside 
      className={`fixed md:sticky top-0 left-0 z-50 w-72 ${isSuperAdmin ? 'border-r border-white/5 bg-[#0B1120] text-white' : 'border-r border-[var(--brand-border)] bg-[var(--brand-card)] text-[var(--brand-heading)]'} flex flex-col h-screen overflow-hidden transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Branding */}
      <div className="p-10 flex flex-col items-center text-center">
        <div className="mb-4">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-10 w-auto object-contain block mx-auto md:mx-0" />
        </div>
        <div>
          <span className={`text-2xl font-black tracking-tighter block leading-none uppercase ${isSuperAdmin ? 'text-white' : 'text-[var(--brand-heading)]'}`}>CRAFT <span className={`${isSuperAdmin ? 'text-[var(--accent)]' : 'text-[var(--brand-primary)]'}`}>SMS</span></span>
          <span className={`text-[10px] ${isSuperAdmin ? 'text-gray-500' : 'text-[var(--brand-muted)]'} font-bold uppercase tracking-[0.2em] block mt-3 truncate max-w-[180px]`}>
             {school?.name || 'Unified Platform'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {filteredItems.map((item, i) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link key={i} href={item.href} onClick={onClose} className="block w-full">
              <div
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-xs font-bold uppercase tracking-widest relative group ${
                  isActive 
                  ? isSuperAdmin 
                    ? 'text-[var(--accent)]' 
                    : 'text-[var(--brand-primary)]' 
                  : isSuperAdmin 
                    ? 'text-gray-500 hover:text-white hover:bg-white/[0.03]' 
                    : 'text-[var(--brand-body)] hover:text-[var(--brand-heading)] hover:bg-[var(--brand-surface)]'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-bg"
                    className={`absolute inset-0 ${isSuperAdmin ? 'bg-white/[0.03] border-l-4 border-[var(--accent)]' : 'bg-[var(--brand-primary)]/10 border-l-4 border-[var(--brand-primary)]'} rounded-r-xl -z-10`}
                  />
                )}
                <item.icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent)]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className={`p-4 ${isSuperAdmin ? 'border-t border-white/5' : 'border-t border-[var(--brand-border)]'}`}>
        <div className={`p-4 rounded-2xl ${isSuperAdmin ? 'bg-white/5 border border-white/10 text-white' : 'bg-[var(--brand-card)] border border-[var(--brand-border)] text-[var(--brand-heading)]'} flex items-center gap-3`}>
          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isSuperAdmin ? 'bg-gradient-to-tr from-teal-500 to-blue-500 border-white/10 text-white' : 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--brand-primary)]'}`}>
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{profile?.full_name || 'Loading...'}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider truncate ${isSuperAdmin ? 'text-teal-400' : 'text-[var(--brand-primary)]'}`}>
              {profile?.role?.replace('_', ' ') || 'Guest'}
            </p>
          </div>
          <button 
            onClick={signOut}
            className={`p-2 rounded-lg transition-colors ${isSuperAdmin ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-[var(--brand-body)]'}`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
