"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CloudLightning,
  BarChart3,
  Layers,
  CreditCard,
  FileText,
  Laptop2,
  Smartphone,
  Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!navigator.onLine) {
      setError('You are currently offline. An active internet connection is required to log in.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Fetch profile to determine correct redirect target
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, schools(subdomain)')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('[Login] Profile fetch error (non-blocking):', profileError.message)
      }

      const role = profile?.role
      const subdomain = (profile?.schools as any)?.subdomain

      if (role === 'SUPER_ADMIN') {
        router.push('/dashboard')
      } else if (subdomain) {
        router.push(`/${subdomain}/dashboard`)
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('Network Error')) {
        setError('Network error: Unable to connect to the authentication server. Please check your internet connection.')
      } else {
        setError(err.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-50 relative overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(8,145,178,0.18),transparent_25%)]" />
      <div className="pointer-events-none absolute right-[-160px] top-1/4 h-[520px] w-[520px] rounded-full bg-[#22D3EE]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-120px] bottom-0 h-[420px] w-[420px] rounded-full bg-[#0F766E]/15 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-12 lg:flex-row lg:items-center">
        <section className="relative flex-1 overflow-hidden rounded-[40px] border border-white/10 bg-slate-950/80 p-8 shadow-[0_40px_120px_-60px_rgba(8,145,178,0.8)] backdrop-blur-xl lg:p-14">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,118,110,0.22),rgba(8,145,178,0.12))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0891B2]/15 text-[#22D3EE]">
                  <Sparkles className="h-5 w-5" />
                </span>
                Premium operations for emerging-market schools
              </div>

              <div className="max-w-2xl space-y-5">
                <p className="text-sm uppercase tracking-[0.32em] text-[#99F6E4]/80">CRAFT SMS</p>
                <h1 className="text-5xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-6xl">
                  School Management Built for Emerging Markets
                </h1>
                <p className="max-w-xl text-base leading-8 text-slate-300">
                  Offline-first student management system for schools, admins, teachers, and financial operations.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22D3EE]/10 text-[#22D3EE]">
                    <CloudLightning className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-white">Offline Ready</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F766E]/15 text-[#0F766E]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-white">Secure Access</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0891B2]/15 text-[#0891B2]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-white">School Analytics</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#22D3EE]/15 text-[#22D3EE]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-white">Multi-Tenant</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F766E]/15 text-[#0F766E]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-white">Fee Tracking</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-200 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.5)]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0891B2]/15 text-[#0891B2]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-semibold text-white">Student Records</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 rounded-[32px] border border-white/10 bg-[#020814]/80 p-6 shadow-[0_36px_80px_-48px_rgba(8,145,178,0.85)]">
              <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                <div>
                  <p className="font-semibold text-slate-100">Real school operations on one platform</p>
                  <p className="mt-2 text-slate-400">Visualize desktop and mobile workflows in a premium control environment.</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#99F6E4]">
                  Trusted workflow
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#050d17] p-4">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#0F766E] via-[#0891B2] to-[#22D3EE]" />
                  <div className="flex h-full flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#0F766E]/15 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[#99F6E4]">
                        <Smartphone className="h-4 w-4" /> Mobile preview
                      </div>
                      <div className="rounded-[24px] bg-[#0B1120] p-4 text-slate-300">
                        <div className="h-64 rounded-[22px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 p-3 shadow-inner shadow-black/40">
                          <div className="h-full rounded-[22px] border border-white/5 bg-[#020814] p-4">
                            <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-slate-500">
                              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                              <span>Craft SMS</span>
                            </div>
                            <div className="space-y-3">
                              <div className="h-3 w-24 rounded-full bg-white/10" />
                              <div className="h-3 w-20 rounded-full bg-white/10" />
                              <div className="h-3 w-16 rounded-full bg-white/10" />
                            </div>
                            <div className="mt-6 h-40 rounded-[22px] bg-gradient-to-br from-[#0F766E]/20 via-[#0891B2]/15 to-[#22D3EE]/10 p-4">
                              <div className="h-4 w-20 rounded-full bg-white/15" />
                              <div className="mt-4 space-y-3">
                                <div className="h-3 rounded-full bg-white/15 w-3/4" />
                                <div className="h-3 rounded-full bg-white/15 w-1/2" />
                                <div className="h-3 rounded-full bg-white/15 w-1/4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#020814]/80 p-5">
                  <div className="absolute -right-16 top-6 h-24 w-24 rounded-full bg-[#0891B2]/10 blur-3xl" />
                  <div className="absolute -left-16 bottom-8 h-32 w-32 rounded-full bg-[#22D3EE]/10 blur-3xl" />
                  <div className="flex flex-col gap-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.3em] text-[#99F6E4]">
                      <Laptop2 className="h-4 w-4" /> Desktop snapshot
                    </div>
                    <div className="grid gap-3 rounded-[24px] bg-[#08111f]/80 p-4 text-sm text-slate-300">
                      <div className="space-y-2 rounded-3xl bg-white/5 p-4">
                        <div className="h-3 rounded-full bg-white/10 w-32" />
                        <div className="h-3 rounded-full bg-white/10 w-24" />
                        <div className="h-3 rounded-full bg-white/10 w-20" />
                      </div>
                      <div className="grid gap-3 rounded-3xl bg-white/5 p-4">
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#0F766E]/15 text-[#0F766E]">
                            <ShieldCheck className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-white">Secure school data</p>
                            <p className="text-slate-400">Enterprise-grade access and controls.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-200">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[#0891B2]/15 text-[#0891B2]">
                            <BarChart3 className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-semibold text-white">Insights at a glance</p>
                            <p className="text-slate-400">School analytics built for fast decisions.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[540px] rounded-[40px] border border-white/10 bg-[#06101c]/95 p-8 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.75)] backdrop-blur-xl lg:p-10"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-[#99F6E4]/80">Secure login</p>
              <h2 className="mt-4 text-4xl font-semibold text-white">Welcome back!</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
                Sign in with your school email to continue to your secure CRAFT SMS workspace.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] ${isOnline ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
              {isOnline ? 'Online' : 'Offline mode'}
            </span>
          </div>

          <div className="mt-8 rounded-[32px] border border-white/10 bg-[#07121e]/95 p-8 shadow-[0_24px_80px_-32px_rgba(8,145,178,0.40)]">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="school-email" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  School Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="school-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@school.com"
                    className="w-full rounded-3xl border border-white/10 bg-[#04101a]/90 px-14 py-4 text-sm text-slate-100 outline-none transition focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Password
                  </label>
                  <button type="button" className="text-xs font-semibold text-[#22D3EE] hover:text-white" onClick={() => router.push('/login')}>
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-3xl border border-white/10 bg-[#04101a]/90 px-14 py-4 text-sm text-slate-100 outline-none transition focus:border-[#22D3EE]/60 focus:ring-2 focus:ring-[#22D3EE]/20"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
                <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-[#22D3EE] focus:ring-[#22D3EE]/60"
                  />
                  Remember me
                </label>
                <span className="text-xs uppercase tracking-[0.24em] text-slate-500">Tenant-aware login</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full items-center justify-center gap-3 rounded-3xl bg-[#0891B2] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#0F766E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
              New to CRAFT SMS?{' '}
              <Link href="/signup" className="font-semibold text-[#22D3EE] hover:text-white">
                Request Access
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  )
}
