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
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
} from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleWarning, setGoogleWarning] = useState(false)
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

  // Google Sign-In is intentionally disabled — no external OAuth redirects
  const handleGoogleSignIn = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setGoogleWarning(true)
    // Ensure any prior form error is cleared so the Google warning stands out
    setError(null)
  }

  return (
    <main className="min-h-screen bg-[var(--brand-surface)] text-[var(--brand-heading)]">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col px-4 py-8 md:px-8">
        <div className="flex flex-col gap-6 w-full px-4 md:flex-row md:gap-12 flex-1 md:items-center">
          {/* LEFT COLUMN: Student Hero with Phone Overlay */}
          <section className="relative overflow-hidden rounded-[44px] bg-[#FAF8F5] p-8 shadow-sm flex flex-col md:min-h-[600px] w-full md:w-[55%]">
            {/* Student Image Backdrop */}
            <div className="absolute inset-0 w-full h-full overflow-hidden hidden md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/hero-student.jpg"
                alt="Student working on a laptop"
                className="absolute inset-0 w-full h-full object-cover object-[center_25%] z-0"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/70 to-transparent z-[5] hidden md:block" />

            <div className="relative z-10 flex h-full w-full items-start flex-col md:flex-row">
              <div className="w-full md:w-1/2 md:pr-8">
                <div className="space-y-10 max-w-xl">
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-10 w-auto object-contain block" />
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

                  <div className="space-y-4">
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

                <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-base italic leading-8 text-slate-700">
                    &quot;CRAFT SMS helps us run school operations faster and keeps our staff aligned.&quot;
                  </p>
                  <p className="mt-4 text-sm font-semibold text-slate-950">- Mary J. Johnson, Principal</p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute right-6 bottom-6 z-20 hidden md:block"
              >
                <div className="relative w-[260px] md:w-[295px]">
                  {/* Device outer frame — midnight black bezel */}
                  <div className="rounded-[36px] bg-[#111111] p-[3px] drop-shadow-[0_30px_40px_rgba(0,0,0,0.22)] ring-1 ring-white/5">
                    {/* Screen glass */}
                    <div className="rounded-[34px] bg-white overflow-hidden w-full flex flex-col" style={{ height: 540 }}>

                      {/* ── Green Header Panel ── */}
                      <div className="relative flex-shrink-0 bg-[#007A53]" style={{ paddingTop: 28, paddingBottom: 20, paddingLeft: 16, paddingRight: 16 }}>
                        {/* Dynamic island / notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#111111] rounded-b-2xl z-10" />
                        {/* Status row */}
                        <div className="flex items-center justify-between text-white/80 text-[10px] font-semibold mb-3">
                          <span>9:41</span>
                          <span className="flex items-center gap-1">📶 🔋</span>
                        </div>
                        {/* Greeting + Avatar */}
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">AB</div>
                          <div>
                            <p className="text-white/70 text-[10px] font-medium">CRAFT SMS — Student Portal</p>
                            <p className="text-white font-bold text-[13px] leading-tight">Selamat Pagi, Alex Brandon</p>
                            <span className="inline-block mt-1 bg-white/20 text-white/90 text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wide">✓ Active Student</span>
                          </div>
                        </div>
                      </div>

                      {/* ── Dashboard Body ── */}
                      <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#F4F7F5] to-white p-3 space-y-2.5">

                        {/* Attendance metric card */}
                        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Attendance Rate</p>
                              <p className="text-[26px] font-extrabold text-[#0A251C] leading-none mt-0.5">100%</p>
                              <p className="text-[9px] text-[#007A53] font-semibold mt-0.5">Perfect Record ↑</p>
                            </div>
                            <div className="h-11 w-11 rounded-full bg-[#007A53] flex items-center justify-center shadow-md">
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#007A53] rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>

                        {/* Class schedule items */}
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Today&apos;s Schedule</p>
                          <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
                            <div className="h-7 w-7 rounded-lg bg-[#007A53] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">M</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-800 truncate">Matematika</p>
                              <p className="text-[9px] text-slate-400">09:00 – 10:30</p>
                            </div>
                            <span className="text-[8px] bg-emerald-50 text-[#007A53] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Live</span>
                          </div>
                          <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2 border border-slate-100 shadow-sm">
                            <div className="h-7 w-7 rounded-lg bg-[#006342] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">B</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-800 truncate">Biologi</p>
                              <p className="text-[9px] text-slate-400">11:00 – 12:30</p>
                            </div>
                            <span className="text-[8px] bg-slate-100 text-slate-400 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">Next</span>
                          </div>
                        </div>

                        {/* Latest grade */}
                        <div className="flex items-center gap-2.5 rounded-xl bg-[#007A53]/8 border border-[#007A53]/15 px-3 py-2">
                          <div className="h-7 w-7 rounded-lg bg-[#007A53]/20 flex items-center justify-center text-[#007A53] text-[10px] font-extrabold flex-shrink-0">92</div>
                          <div>
                            <p className="text-[10px] font-semibold text-slate-700">Latest Grade — Matematika</p>
                            <p className="text-[9px] text-[#007A53] font-medium">Excellent Performance</p>
                          </div>
                        </div>

                        {/* CTA */}
                        <button className="w-full bg-[#007A53] text-white text-[11px] font-bold rounded-xl py-2.5 hover:bg-[#006342] transition-colors shadow-sm">
                          Open Full Dashboard →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* RIGHT COLUMN: Login Form */}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center w-full md:w-[45%]"
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

              {/* Google Auth Button - Disabled placeholder, no OAuth redirects */}
              <button
                type="button"
                id="google-signin-disabled"
                onClick={handleGoogleSignIn}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl border border-[var(--brand-border)] bg-white px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed opacity-70 shadow-sm select-none"
                aria-disabled="true"
              >
                <FcGoogle size={20} aria-hidden="true" />
                <span>Sign in with Google</span>
              </button>
              {googleWarning && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Google login is currently disabled. Please sign in above using your unique Student ID or School Email.
                </div>
              )}

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
