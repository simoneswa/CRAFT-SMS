"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BarChart3,
  CloudLightning,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, schools(subdomain)')
        .eq('id', data.user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('[Login] Profile fetch error:', profileError.message)
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
      if (err?.message) {
        setError(err.message)
      } else {
        setError('Unable to sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] text-[var(--brand-heading)]">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col px-4 py-8 md:px-8">
        <div className="grid flex-1 gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          {/* LEFT COLUMN: Student Hero with Phone Overlay */}
          <section className="relative hidden overflow-hidden rounded-[44px] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 shadow-sm md:flex md:min-h-[600px]">
            {/* Main Student Image */}
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
                alt="Student working on a laptop"
                className="h-full w-full object-cover object-right"
              />
              {/* Dark Overlay Base */}
              <div className="absolute inset-0 bg-[var(--brand-surface)]/95" />
              {/* Soft Gradient Mask - Left to Right Fade */}
              <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/45 to-transparent" />
            </div>

            {/* Laptop Branding Badge (Absolutely Positioned) */}
            <div className="absolute bottom-32 right-20 z-20 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">
              <div className="flex items-center gap-1">
                <div className="h-4 w-1 rounded-full bg-gradient-to-b from-blue-500 to-teal-500" />
                <div className="h-4 w-1 rounded-full bg-gradient-to-b from-teal-500 to-green-500" />
              </div>
            </div>

            {/* Phone Mockup Overlay - Absolutely Positioned on Left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-20 left-12 z-20 w-[240px] drop-shadow-2xl"
            >
              <div className="rounded-[32px] border-8 border-black bg-white overflow-hidden">
                {/* Phone Status Bar */}
                <div className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 px-4 py-2 text-white text-[10px] font-bold flex justify-between">
                  <span>9:41</span>
                  <span>📶</span>
                </div>

                {/* Phone Content */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-3 h-80">
                  {/* User Greeting Card */}
                  <div className="bg-gradient-to-r from-[var(--brand-primary)] to-emerald-600 rounded-2xl px-4 py-3 text-white">
                    <p className="text-[11px] font-semibold">Good morning,</p>
                    <p className="text-[13px] font-bold">John Doe</p>
                  </div>

                  {/* Recent Announcements */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Recent</p>
                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-900">Assembly Today</p>
                      <p className="text-[8px] text-slate-600 mt-1">2:00 PM Hall</p>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                      <p className="text-[10px] font-semibold text-slate-900">Exam Results</p>
                      <p className="text-[8px] text-slate-600 mt-1">Check portal</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-[var(--brand-primary)] text-white text-[9px] font-bold rounded-lg py-2 mt-auto">
                    VIEW DASHBOARD
                  </button>
                </div>

                {/* Phone Home Indicator */}
                <div className="h-6 bg-black rounded-t-3xl" />
              </div>
            </motion.div>
            {/* Content Overlay - Text & Features */}
            <div className="relative z-10 flex h-full flex-col justify-between gap-10 pointer-events-none">
              <div className="space-y-10 max-w-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)/20]">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[var(--brand-heading)]">
                      CRAFT <span className="text-[var(--brand-primary)]">SMS</span>
                    </p>
                    <p className="text-sm font-medium text-[var(--brand-primary)]">Unified Educational Platform</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                    Empowering Schools. Inspiring Futures.
                  </h1>
                  <p className="text-base leading-8 text-slate-600">
                    CRAFT SMS is the all-in-one platform for school management, finance, attendance, and communication.
                  </p>
                </div>

                <div className="space-y-4 pointer-events-auto">
                  <div className="flex gap-4 rounded-[28px] bg-white px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <CloudLightning className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Offline Ready</p>
                      <p className="mt-1 text-sm text-slate-600">Continue working even when connectivity is limited.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-[28px] bg-white px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Secure by Design</p>
                      <p className="mt-1 text-sm text-slate-600">Protect sensitive school data with modern security controls.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-[28px] bg-white px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Actionable Insights</p>
                      <p className="mt-1 text-sm text-slate-600">Monitor school performance with fast, visual analytics.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm pointer-events-auto">
                <p className="text-base italic leading-8 text-slate-700">
                  "CRAFT SMS helps us run school operations faster and keeps our staff aligned."
                </p>
                <p className="mt-4 text-sm font-semibold text-slate-950">- Mary J. Johnson, Principal</p>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Login Form */}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center"
          >
            <div className="w-full max-w-xl rounded-[40px] bg-white p-8 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.12)] sm:p-10">
              <div className="text-center">
                <h2 className="text-4xl font-semibold text-slate-950">Welcome back!</h2>
                <p className="mt-3 text-sm text-slate-500">Sign in to continue to your secure CRAFT SMS dashboard.</p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-6">
                {error && (
                  <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="school-email" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      School Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="school-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@school.com"
                        className="w-full rounded-3xl border border-[var(--brand-border)] bg-[#f8f5ef] px-14 py-4 text-sm text-[var(--brand-heading)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-sm font-semibold text-[var(--brand-primary)] hover:text-[#006342] transition"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-3xl border border-[var(--brand-border)] bg-[#f8f5ef] px-14 py-4 text-sm text-[var(--brand-heading)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm -translate-y-1/2 transition hover:bg-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-3 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    Remember me
                  </label>
                </div>

                {/* Primary Sign In Button - Exact Brand Green */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[#007A53] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#007A53]/20 transition hover:bg-[#006342] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-[0.28em] text-slate-400">OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Google Auth Button - Official Branding */}
              <button
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl border border-[var(--brand-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--brand-heading)] transition hover:bg-slate-50 shadow-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                  <svg viewBox="0 0 533.5 544.3" className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M533.5 278.4c0-17.7-1.6-34.8-4.6-51.3H272.1v97h146.9c-6.3 34-25.3 62.8-54.2 82l87.7 68c51.1-47 80.9-116.5 80.9-195.7z"/>
                    <path fill="#34A853" d="M272.1 544.3c73.1 0 134.6-24.1 179.4-65.4l-87.7-68c-24.4 16.4-55.4 26-91.7 26-70.6 0-130.4-47.7-151.8-111.8l-89.4 69c43.7 86.5 132 149.2 241.2 149.2z"/>
                    <path fill="#FBBC05" d="M120.3 326.1c-10.4-30.6-10.4-63.6 0-94.2l-89.4-69c-39.4 78.6-39.4 170.8 0 249.4l89.4-69z"/>
                    <path fill="#EA4335" d="M272.1 213.8c38.8-.6 76.1 14 104.5 40.4l78.3-78.3C405.3 124 343.7 96 272.1 96 163.1 96 74.7 158.3 31 244.8l89.4 69c21.4-64.1 81.2-111.8 151.7-111.8z"/>
                  </svg>
                </span>
                <span>Sign in with Google</span>
              </button>

              <p className="mt-6 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-[var(--brand-primary)] hover:text-[#006342]">
                  Request Access
                </Link>
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 font-semibold flex-shrink-0">AWS</div>
                  <div>
                    <p className="font-semibold text-slate-900">AWS Partner</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 font-semibold flex-shrink-0">S</div>
                  <div>
                    <p className="font-semibold text-slate-900">Supabase Backed By</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 flex-shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">PWA Offline Ready</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Secure SSL Encrypted</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </main>
  )
}
