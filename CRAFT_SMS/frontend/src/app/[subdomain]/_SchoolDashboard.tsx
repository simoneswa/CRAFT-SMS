"use client"

import React from 'react'
import { useAuth } from '../../providers/AuthProvider'
import StudentDashboard from '../../components/dashboard/StudentDashboard'
import TeacherDashboard from '../../components/dashboard/TeacherDashboard'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, Bell, Trophy, Settings, Zap, BookOpen, ClipboardCheck } from 'lucide-react'
import { CraftLogo } from '../../components/ui/CraftLogo'

/**
 * Root [subdomain] client component — renders role-specific Edlink-inspired dashboards.
 *
 * - STUDENT  → StudentDashboard (light emerald Edlink layout)
 * - TEACHER  → TeacherDashboard (light emerald Edlink instructor layout)
 * - Others   → Legacy admin/business sidebar layout (preserved)
 */
export default function SchoolDashboardClient() {
  const params = useParams()
  const subdomain = params?.subdomain as string | undefined
  const { profile, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--edlink-green-brand)]/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Guard: during static export the subdomain may be undefined — render nothing until hydrated
  if (!subdomain) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[var(--edlink-green-brand)]/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  const role = profile?.role || 'STUDENT'

  // Render Edlink-inspired dashboards for Student and Teacher roles
  if (role === 'STUDENT') return <StudentDashboard />
  if (role === 'TEACHER') return <TeacherDashboard />

  // ── Legacy admin/business/parent layout (preserved from original) ──────────
  const schoolName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + " School"

  const getNavItems = () => {
    const base = [
      { icon: LayoutDashboard, label: 'Overview', href: `/${subdomain}/dashboard`, active: true },
      { icon: Bell, label: 'News Feed', href: `/${subdomain}/dashboard/news` },
    ]

    if (role === 'BUSINESS') {
      return [
        ...base,
        { icon: CreditCard, label: 'Payments & Slips', href: `/${subdomain}/dashboard/finance` },
        { icon: Users, label: 'Student Balances', href: `/${subdomain}/dashboard/students` },
      ]
    }
    // Admin / Super Admin / Parent
    return [
      ...base,
      { icon: Users, label: 'Directory', href: `/${subdomain}/dashboard/students` },
      { icon: CreditCard, label: 'Financials', href: `/${subdomain}/dashboard/finance` },
      { icon: ClipboardCheck, label: 'Attendance', href: `/${subdomain}/dashboard/attendance` },
      { icon: Trophy, label: 'Gamification', href: `/${subdomain}/dashboard/gamification` },
      { icon: Settings, label: 'Settings', href: `/${subdomain}/dashboard/settings` },
    ]
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-8 flex-col gap-12 hidden md:flex">
        <div className="flex items-center gap-3">
          <CraftLogo className="h-10 w-auto" />
          <span className="font-bold text-xl tracking-tight uppercase">{subdomain}</span>
        </div>

        <nav className="flex flex-col gap-2">
          {getNavItems().map((item, i) => (
            <Link key={i} href={item.href}>
              <button
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  item.active
                  ? 'bg-[var(--edlink-green-brand)]/10 text-[var(--edlink-green-brand)] border border-[var(--edlink-green-brand)]/20'
                  : 'text-[var(--edlink-blue-text)]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-blue-500/20 border border-[var(--edlink-green-brand)]/30">
            <p className="text-xs font-bold text-[var(--edlink-green-brand)] mb-2 uppercase">{role}</p>
            <p className="text-sm text-gray-300">Secured via CRAFT SMS.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">{schoolName}</h1>
            <p className="text-[var(--edlink-blue-text)]/70">Welcome back, {profile?.full_name || role}</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">
              <Bell className="w-5 h-5 text-[var(--edlink-blue-text)]/70" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 border-2 border-white/20" />
          </div>
        </header>

        {role === 'BUSINESS' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href={`/${subdomain}/dashboard/finance?filter=PENDING`} className="premium-card hover:border-amber-500/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Pending Slips</p>
                <h3 className="text-lg font-bold mb-1 text-amber-400">Review Pending &rarr;</h3>
                <span className="text-xs text-[var(--edlink-blue-text)]/70">Awaiting your verification</span>
              </Link>
              <Link href={`/${subdomain}/dashboard/finance?filter=VERIFIED`} className="premium-card hover:border-[var(--edlink-green-brand)]/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Verified Today</p>
                <h3 className="text-lg font-bold mb-1 text-emerald-400">View Verified &rarr;</h3>
                <span className="text-xs text-[var(--edlink-blue-text)]/70">Recently approved payments</span>
              </Link>
              <Link href={`/${subdomain}/dashboard/students`} className="premium-card hover:border-[var(--edlink-green-brand)]/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Student Balances</p>
                <h3 className="text-lg font-bold mb-1 text-[var(--edlink-green-brand)]">View Directory &rarr;</h3>
                <span className="text-xs text-[var(--edlink-blue-text)]/70">Track per-student accounts</span>
              </Link>
            </div>

            <div className="premium-card border-amber-500/20 bg-amber-500/5">
              <h3 className="text-lg font-bold mb-4">Pending Financial Actions</h3>
              <p className="text-sm text-[var(--edlink-blue-text)]/70 mb-4">Navigate to the Finance page to review and verify pending student payment slips.</p>
              <Link href={`/${subdomain}/dashboard/finance`}>
                <button className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl transition-all hover:bg-amber-400">
                  Review Slips
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Link href={`/${subdomain}/dashboard/students`} className="premium-card hover:border-[var(--edlink-green-brand)]/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Total Students</p>
                <h3 className="text-lg font-bold mb-1 text-[var(--edlink-green-brand)]">View Directory &rarr;</h3>
              </Link>
              <Link href={`/${subdomain}/dashboard/finance?filter=PENDING`} className="premium-card hover:border-blue-500/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Pending Slips</p>
                <h3 className="text-lg font-bold mb-1 text-blue-400">Review &rarr;</h3>
              </Link>
              <Link href={`/${subdomain}/dashboard/attendance`} className="premium-card hover:border-purple-500/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Attendance</p>
                <h3 className="text-lg font-bold mb-1 text-purple-400">Take Roll Call &rarr;</h3>
              </Link>
              <Link href={`/${subdomain}/dashboard/finance`} className="premium-card hover:border-[var(--edlink-green-brand)]/40 transition-all cursor-pointer">
                <p className="text-[var(--edlink-blue-text)]/70 text-xs font-medium mb-1 uppercase tracking-wider">Financials</p>
                <h3 className="text-lg font-bold mb-1 text-emerald-400">View Finance &rarr;</h3>
              </Link>
            </div>
          </div>
        )}

        {/* Global Offline Sync Indicator */}
        <div className="mt-8">
          <div className="premium-card border-[var(--edlink-green-brand)]/20 bg-[var(--edlink-green-brand)]/5">
            <h3 className="text-lg font-bold mb-4">Offline Sync Status</h3>
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <Zap className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold">All changes synced</span>
            </div>
            <p className="text-xs text-[var(--edlink-blue-text)]/70 leading-relaxed">
              Your data is safe. Even without internet, you can continue marking attendance and verifying slips.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
