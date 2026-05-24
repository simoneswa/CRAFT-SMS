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
    <main className="min-h-screen bg-[#f5f2ec] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1480px] flex-col px-4 py-8 md:px-8">
        <div className="grid flex-1 gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <section className="relative hidden overflow-hidden rounded-[44px] border border-slate-200 bg-[#f7f1e8] p-8 shadow-xl md:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_45%)]" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_left,rgba(247,241,232,0.95),transparent_60%)]" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-10">
              <div className="space-y-10 max-w-xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-700 text-white shadow-lg shadow-emerald-200/30">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950">
                      CRAFT <span className="text-emerald-700">SMS</span>
                    </p>
                    <p className="text-sm font-medium text-emerald-700">Unified Educational Platform</p>
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                      <CloudLightning className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Offline Ready</p>
                      <p className="mt-1 text-sm text-slate-600">Continue working even when connectivity is limited.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-[28px] bg-white px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Secure by Design</p>
                      <p className="mt-1 text-sm text-slate-600">Protect sensitive school data with modern security controls.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 rounded-[28px] bg-white px-5 py-4 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">Actionable Insights</p>
                      <p className="mt-1 text-sm text-slate-600">Monitor school performance with fast, visual analytics.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-base italic leading-8 text-slate-700">
                  “CRAFT SMS helps us run school operations faster and keeps our staff aligned.”
                </p>
                <p className="mt-4 text-sm font-semibold text-slate-950">- Mary J. Johnson, Principal</p>
              </div>
            </div>
          </section>

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
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-14 py-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Password
                      </label>
                      <span className="text-sm font-semibold text-emerald-700">Forgot password?</span>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-14 py-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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
                      className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                    />
                    Remember me
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-700 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-200/30 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
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

              <button
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                  <span className="text-lg font-bold">G</span>
                </span>
                Sign in with Google
              </button>

              <p className="mt-6 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
                  Request Access
                </Link>
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">AWS</div>
                  <div>
                    <p className="font-semibold text-slate-900">AWS Partner</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">S</div>
                  <div>
                    <p className="font-semibold text-slate-900">Supabase Backed By</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">PWA Offline Ready</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
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
