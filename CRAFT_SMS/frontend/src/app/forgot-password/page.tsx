"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, ShieldCheck, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      if (!email) {
        throw new Error('Please enter a valid email address')
      }

      // Mock password reset flow
      console.log('Password reset requested for:', email)
      
      setSuccess('If an account exists for that email, we have sent password reset instructions. Please check your inbox.')
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err?.message || 'Unable to process your request. Please contact support.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[32px] bg-white p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.18)] sm:p-10"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#007A53] text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--edlink-blue-text)]/70">Password Recovery</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Reset your school account password</h1>
            </div>
          </div>

          <p className="mb-8 text-sm leading-7 text-slate-600">
            Enter the email address associated with your account and we&apos;ll send you instructions to reset your password securely.
          </p>

          {error && (
            <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              <AlertTriangle className="inline h-4 w-4 align-text-bottom mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-3xl border border-[var(--edlink-divider-blue)] bg-[var(--edlink-green-brand)]/10 px-4 py-4 text-sm text-emerald-700">
              <ShieldCheck className="inline h-4 w-4 align-text-bottom mr-2" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--edlink-blue-text)]">
                School Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@school.com"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-[#007A53] focus:ring-2 focus:ring-[#007A53]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-[#007A53] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#007A53]/20 transition hover:bg-[#006342] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-600">
            <Link href="/login" className="font-semibold text-[#007A53] hover:text-[#005d40]">
              Back to Login
            </Link>
            <p>
              Need help? <a href="mailto:support.craftsms@gmail.com" className="font-semibold text-[#007A53] hover:text-[#005d40]">Contact support</a>
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

