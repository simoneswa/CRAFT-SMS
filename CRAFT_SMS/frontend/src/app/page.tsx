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
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa'
import DownloadSection from '../components/DownloadSection'

const BRAND = {
  primary: '#3954A5', // Craft SMS Primary Blue
  primaryDark: '#2d4282', 
  cream: '#FAF8F5',
}

const features = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Offline First',
    desc: "Work even without internet. Auto syncs when you're back online.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Smart & Secure',
    desc: 'Your data is protected with enterprise security and role based access.',
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
  { value: 'Secure', label: 'Cloud Infrastructure' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: 'Real-time', label: 'Student Management' },
  { value: '24/7', label: 'Support Access' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen selection:bg-[#3954A5]/20 bg-[var(--brand-surface)] text-[var(--brand-heading)] overflow-x-hidden">
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
                className="capitalize hover:text-[#3954A5] transition-colors hover:-translate-y-0.5 duration-200"
              >
                {s}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-[#3954A5] text-[#3954A5] font-semibold text-sm hover:bg-slate-50 transition-all duration-300">
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3954A5]/10 text-[#3954A5] text-xs font-bold uppercase tracking-widest mb-8">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Offline First System Architecture
            </div>
            <p className="text-sm text-slate-600 mb-8 max-w-xl mx-auto font-medium">
              Data automatically logs without an internet connection and syncs seamlessly once networks become stable.
            </p>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-900">
              Unified School Management
              <br />
              <span className="bg-gradient-to-r from-[#3954A5] to-[#FFAD23] bg-clip-text text-transparent">
                for the Modern Era
              </span>
            </h1>

            <p className="max-w-2xl mx-auto mt-7 text-lg md:text-xl leading-relaxed text-slate-600">
              CRAFT SMS brings attendance, finance, communication, and analytics into
              one offline first platform  built for schools in constrained networks.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <button className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-white font-bold text-base shadow-xl bg-[#3954A5] hover:bg-[#2d4282] hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/docs">
                <button className="inline-flex items-center gap-2 px-9 py-4 rounded-full border-2 border-[#3954A5] bg-white text-[#3954A5] font-semibold text-base hover:bg-slate-50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  See Demo
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-[#3954A5]">
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
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#3954A5] mb-3">Platform Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Everything your school needs
            </h2>
            <p className="mt-4 text-lg text-slate-600/70 max-w-xl mx-auto">
              Modular tools designed for administrators, teachers, and parents  on any device.
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
                className="group flex flex-col gap-4 rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm hover:-translate-y-1.5 hover:shadow-xl hover:border-[#3954A5]/20 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3954A5]/10 text-[#3954A5] group-hover:bg-[#3954A5] group-hover:text-white transition-all duration-300">
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

      <section className="py-24 bg-slate-50" id="contact">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#3954A5]">Why schools choose CRAFT</p>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                Built for busy administrators and stretched networks.
              </h2>
              <p className="max-w-2xl text-lg text-slate-600 leading-relaxed">
                From one click attendance to offline grade entry and instant parent notices,
                CRAFT SMS removes the friction so teams can focus on learning, not logins.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="feature-card">
                  <div className="feature-card-icon"><Zap className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">Fast Setup</p>
                    <p className="text-sm text-slate-600/70">Get up and running with school data in minutes.</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card-icon"><Users className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-900">Teacher Friendly</p>
                    <p className="text-sm text-slate-600/70">Simple workflows for classroom and school staff.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-[var(--brand-border)] bg-white p-8 shadow-xl">
              <p className="text-sm uppercase tracking-[0.3em] text-[#3954A5] font-bold mb-4">Live in 3 regions</p>
              <div className="space-y-5">
                <div className="rounded-3xl bg-blue-50 p-5">
                  <p className="text-sm text-slate-600">Student Management</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">Effortless</p>
                </div>
                <div className="rounded-3xl bg-amber-50 p-5">
                  <p className="text-sm text-slate-600">School Networks</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">Scalable</p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-5">
                  <p className="text-sm text-slate-600">Parent Communications</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">Instant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <DownloadSection />

      <footer className="bg-slate-900 border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-8 gap-12 lg:gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-8 w-auto object-contain block bg-transparent" />
              <span className="text-xl font-bold tracking-tight text-white">
                CRAFT <span style={{ color: BRAND.primary }}>SMS</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unified School Management for the Modern Era.
            </p>
            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">Contact Us</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300 font-medium">Head Office</p>
                    <p className="text-xs text-slate-500 mt-1">Monrovia, Liberia</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <a href="tel:+231880864187" className="text-sm text-slate-300 font-medium hover:text-[#3954A5] transition-colors">
                      +231 88 086 4187
                    </a>
                    <p className="text-xs text-slate-500 mt-1">Operating Hours: 08:30 - 16:30</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <div className="md:col-span-1"></div>

          <div className="md:col-span-2">
            <p className="font-bold text-white mb-6">Legal & Resources</p>
            <ul className="space-y-4 text-sm font-medium mb-8">
              <li><Link href="/privacy-policy" className="text-slate-400 hover:text-[#3954A5] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-[#3954A5] transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-bold text-white mb-6">Support</p>
            <ul className="space-y-4 text-sm font-medium mb-8">
              <li><Link href="/docs/user-guide" className="text-slate-400 hover:text-[#3954A5] transition-colors">User Guide</Link></li>
              <li><Link href="/help-center" className="text-slate-400 hover:text-[#3954A5] transition-colors">Help Center</Link></li>
            </ul>
          </div>

          <div className="md:col-span-1">
            <p className="font-bold text-white mb-6">Platform</p>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/dashboard" className="text-slate-400 hover:text-[#3954A5] transition-colors">CRAFT SMS PRO</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="font-bold text-white mb-6">Follow Craft SMS</p>
            <div className="flex flex-col gap-4">
              <a href="https://www.instagram.com/craf.tsms?igsh=MTB6M3UzenRwemlzYg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white group">
                <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] flex items-center justify-center text-white group-hover:-translate-y-0.5 transition-transform shadow-lg shadow-[#E1306C]/20">
                  <FaInstagram className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Instagram</span>
              </a>
              <a href="https://wa.me/231880864187" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white group">
                <div className="w-8 h-8 rounded-md bg-[#25D366] flex items-center justify-center text-white group-hover:-translate-y-0.5 transition-transform shadow-lg shadow-[#25D366]/20">
                  <FaWhatsapp className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
          </div>

        </div>
        <p className="mt-12 text-sm text-slate-500 font-medium">© 2026 CRAFT SMS. All Right Reserved</p>
      </footer>
    </main>
  )
}