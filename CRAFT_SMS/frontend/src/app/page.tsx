"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Globe,
  BarChart3,
  BookOpen,
  Users,
  CreditCard,
  Bell,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

const BRAND = {
  primary: '#007A53',
  primaryDark: '#005d40',
  cream: '#FAF8F5',
}

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Offline-First',
    desc: "Work even without internet. Auto-syncs when you're back online.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Smart & Secure',
    desc: 'Your data is protected with enterprise security and role-based access.',
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: 'All-in-One Platform',
    desc: 'Academics, Finance, Attendance, Exams, Communication & more.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Analytics & Reports',
    desc: 'Visual dashboards and exportable reports for principals and administrators.',
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: 'Smart Notifications',
    desc: 'Push alerts for parents, staff, and students — across SMS, email, and in-app.',
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: 'School Finance',
    desc: 'Fee collection, receipts, and financial reporting built for institutional clarity.',
  },
]

const stats = [
  { value: '128+', label: 'Schools Onboarded' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '21,406', label: 'Students Managed' },
  { value: '4.9★', label: 'Average Rating' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen selection:bg-[#007A53]/20 bg-[var(--brand-surface)] text-[var(--brand-heading)] overflow-x-hidden">
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--brand-border)] bg-[var(--brand-surface)]/95 backdrop-blur-sm py-3">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-14 w-auto object-contain block" />
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              CRAFT <span style={{ color: BRAND.primary }}>SMS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            {['features', 'pricing', 'contact'].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="capitalize hover:text-[#007A53] transition-colors hover:-translate-y-0.5 duration-200"
              >
                {s}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-[#007A53] text-[#007A53] font-semibold text-sm hover:bg-[#f0fff6] transition-all duration-300">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button
                className="px-6 py-2.5 rounded-full text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                style={{ background: BRAND.primary }}
              >
                Request Demo
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-24 bg-[var(--brand-surface)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#007A53]/10 text-[#007A53] text-xs font-bold uppercase tracking-widest mb-8">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Offline-First System Architecture
            </div>
            <p className="text-sm text-slate-600 mb-8 max-w-xl mx-auto font-medium">
              Data automatically logs without an internet connection and syncs seamlessly once networks become stable.
            </p>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-900">
              Unified School Management
              <br />
              <span className="bg-gradient-to-r from-[#007A53] to-[#0f7a60] bg-clip-text text-transparent">
                for the Modern Era
              </span>
            </h1>

            <p className="max-w-2xl mx-auto mt-7 text-lg md:text-xl leading-relaxed text-slate-600">
              CRAFT SMS brings attendance, finance, communication, and analytics into
              one offline-first platform — built for schools in constrained networks.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-white font-bold text-base shadow-xl bg-[#007A53] hover:bg-[#005d40] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/docs">
                <button className="inline-flex items-center gap-2 px-9 py-4 rounded-full border-2 border-[#007A53] bg-white text-[#007A53] font-semibold text-base hover:bg-[#f0fff6] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  See Demo
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-[#007A53]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl md:text-4xl font-extrabold text-white">{s.value}</p>
                <p className="mt-1 text-sm text-white/70 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#007A53] mb-3">Platform Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Everything your school needs
            </h2>
            <p className="mt-4 text-lg text-[var(--edlink-blue-text)]/70 max-w-xl mx-auto">
              Modular tools designed for administrators, teachers, and parents — on any device.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                viewport={{ once: true }}
                className="group flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-[#007A53]/20 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#007A53]/10 text-[#007A53] group-hover:bg-[#007A53] group-hover:text-white transition-all duration-300">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#f4faf6]" id="contact">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#007A53]">Why schools choose CRAFT</p>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Built for busy administrators and stretched networks.
              </h2>
              <p className="max-w-2xl text-lg text-slate-600 leading-relaxed">
                From one-click attendance to offline grade entry and instant parent notices,
                CRAFT SMS removes the friction so teams can focus on learning, not logins.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="feature-card">
                  <div className="feature-card-icon"><Zap className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">Fast Setup</p>
                    <p className="text-sm text-[var(--edlink-blue-text)]/70">Get up and running with school data in minutes.</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon"><Users className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">Teacher Friendly</p>
                    <p className="text-sm text-[var(--edlink-blue-text)]/70">Simple workflows for classroom and school staff.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-[var(--brand-border)] bg-white p-8 shadow-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-primary)] font-bold mb-4">Live in 3 regions</p>
              <div className="space-y-5">
                <div className="rounded-3xl bg-[#effaf5] p-5">
                  <p className="text-sm text-slate-600">Students managed</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">21,406</p>
                </div>
                <div className="rounded-3xl bg-[#faf7ef] p-5">
                  <p className="text-sm text-slate-600">Active school networks</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">128+</p>
                </div>
                <div className="rounded-3xl bg-[#f0f9ff] p-5">
                  <p className="text-sm text-slate-600">Parent messages sent</p>
                  <p className="mt-2 text-4xl font-bold text-slate-900">84,200+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
