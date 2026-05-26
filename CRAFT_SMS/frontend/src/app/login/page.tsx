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
} from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CraftLogo } from '@/components/ui/CraftLogo'

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
        <div className="grid flex-1 gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          {/* LEFT COLUMN: Student Hero with Phone Overlay */}
          <section className="relative hidden overflow-hidden rounded-[44px] bg-[#FAF8F5] p-8 shadow-sm md:flex md:min-h-[600px]">
            {/* Student Image Backdrop */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <img
                src="/hero-student.jpg"
                alt="Student working on a laptop"
                className="absolute inset-0 w-full h-full object-cover object-[center_25%] z-0"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5]/70 to-transparent z-[5]" />

            <div className="relative z-10 flex h-full w-full items-start">
              <div className="w-full md:w-1/2 pr-8">
                <div className="space-y-10 max-w-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#007A53] text-white shadow-lg shadow-[#007A53]/20">
                      <CraftLogo className="h-10 w-auto object-contain" />
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
                    "CRAFT SMS helps us run school operations faster and keeps our staff aligned."
                  </p>
                  <p className="mt-4 text-sm font-semibold text-slate-950">- Mary J. Johnson, Principal</p>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute right-4 bottom-4 z-20 w-[220px] md:w-[260px] drop-shadow-2xl"
              >
                <div className="rounded-[32px] border-8 border-black bg-white overflow-hidden">
                  <div className="bg-gradient-to-r from-[var(--brand-primary)] to-teal-600 px-4 py-2 text-white text-[10px] font-bold flex justify-between">
                    <span>9:41</span>
                    <span>📶</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 space-y-3 h-80">
                    {/* Header with brand accent and notification badge */}
                    <div className="flex items-center justify-between rounded-xl bg-[#005d40] px-3 py-2 text-white">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-wide">NOTIFICATIONS</span>
                      </div>
                      <div className="relative">
                        <span className="inline-block rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">3</span>
                      </div>
                    </div>

                    {/* Profile identity card */}
                    <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">SS</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Welcome, Swadell Simone</p>
                        <p className="text-xs text-slate-500">Student Dashboard</p>
                      </div>
                    </div>

                    {/* Feature blocks grid */}
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="h-8 w-8 rounded-md bg-[#007A53] flex items-center justify-center text-white">J</div>
                        <div>
                          <p className="text-xs font-semibold">Jadwal Kelas</p>
                          <p className="text-[11px] text-slate-500">Matematika • 09:00</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="h-8 w-8 rounded-md bg-[#006342] flex items-center justify-center text-white">N</div>
                        <div>
                          <p className="text-xs font-semibold">Nilai Terbaru</p>
                          <p className="text-[11px] text-slate-500">Matematika 92%</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-slate-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                        <div className="h-8 w-8 rounded-md bg-emerald-200 flex items-center justify-center text-emerald-800">P</div>
                        <div>
                          <p className="text-xs font-semibold">Presensi Selesai</p>
                          <p className="text-[11px] text-slate-500">100% hari ini</p>
                        </div>
                      </div>
                    </div>

                    <button className="w-full bg-[var(--brand-primary)] text-white text-[9px] font-bold rounded-lg py-2 mt-auto hover:shadow-lg transition-all duration-300">
                      VIEW DASHBOARD
                    </button>
                  </div>
                  <div className="h-6 bg-black rounded-t-3xl" />
                </div>
              </motion.div>
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
