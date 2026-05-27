"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Shield,
  Zap,
  Globe,
  Mail,
  Phone,
  BarChart3,
  BookOpen,
  Users,
  CreditCard,
  Bell,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react'
import { FaInstagram, FaFacebook, FaWhatsapp } from 'react-icons/fa'
import { supabase } from '@/lib/supabase'

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

const testimonials = [
  {
    quote: "CRAFT SMS transformed our school's operations — faster, simpler, and secure.",
    author: 'Mary J. Johnson',
    role: 'Principal, Unity Academy',
  },
  {
    quote: "Attendance, fees, and communication — all in one place. Teachers love it!",
    author: 'Samuel K. Doe',
    role: 'Headmaster, Greenfield School',
  },
  {
    quote: "Offline-first features saved our reporting during poor connectivity seasons.",
    author: 'Aisha B. Conteh',
    role: 'Admin Officer, Star Institute',
  },
]

export default function LandingPage() {
  const [tIndex, setTIndex] = useState(0)
  const nextTestimonial = () => setTIndex((i) => (i + 1) % testimonials.length)
  const prevTestimonial = () => setTIndex((i) => (i - 1 + testimonials.length) % testimonials.length)

  const [stats, setStats] = useState([
    { value: '0', label: 'Schools Onboarded' },
    { value: '0%', label: 'Platform Uptime' },
    { value: '0', label: 'Students Managed' },
    { value: '0★', label: 'Average Rating' },
  ])

  React.useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const [{ count: schoolCount }, { count: profileCount }] = await Promise.all([
          supabase.from('schools').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
        ])
        if (mounted) {
          setStats([
            { value: schoolCount ? `${schoolCount}+` : '0', label: 'Schools Onboarded' },
            { value: '99.9%', label: 'Platform Uptime' },
            { value: profileCount ? `${profileCount}+` : '0', label: 'Students Managed' },
            { value: '4.9★', label: 'Average Rating' },
          ])
        }
      } catch (err) {
        // Keep zeros if fetch fails
      }
    }
    loadStats()
    return () => { mounted = false }
  }, [])

  return (
    <main className="min-h-screen selection:bg-[#007A53]/20 bg-[var(--brand-surface)] text-slate-900 overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--brand-border)] bg-[var(--brand-surface)]/95 backdrop-blur-sm py-3">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-10 w-auto object-contain block" style={{ background: 'transparent' }} />
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              CRAFT <span style={{ color: BRAND.primary }}>SMS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            {['features', 'pricing', 'contact'].map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="capitalize hover:text-[#007A53] transition-colors hover:-translate-y-0.5 transition-all duration-200"
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

      {/* ── Hero ───────────────────────────────────── */}
      <section className="pt-28 pb-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* Badge */}
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

      {/* ── Stats Bar ──────────────────────────────── */}
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

      {/* ── Features ───────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#007A53] mb-3">Platform Capabilities</p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Everything your school needs
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
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
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why CRAFT SMS ──────────────────────────── */}
      <section className="py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#007A53] mb-4">Why CRAFT SMS?</p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Built for Africa&apos;s
                <br />
                <span className="text-[#007A53]">connected future</span>
              </h2>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed">
                Unlike legacy solutions, CRAFT SMS is engineered for real-world conditions —
                intermittent power, limited bandwidth, and diverse device ecosystems.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Offline-first PWA — works without internet',
                  'Sub-second load times on 3G networks',
                  'Supabase-powered real-time data sync',
                  'Role-based access: Admins, Teachers, Students, Parents',
                  'Railway + Vercel cloud-native architecture',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-[#007A53] mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link href="/signup">
                  <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-white font-semibold bg-[#007A53] hover:bg-[#005d40] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                    Start for Free <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>

            {/* Visual Card Stack */}
            <div className="relative h-[420px] hidden md:block">
              {/* Card 1 */}
              <div className="absolute top-0 left-8 right-0 rounded-[28px] bg-white border border-slate-100 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#007A53]/10 flex items-center justify-center text-[#007A53]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">School Analytics</p>
                    <p className="text-xs text-slate-500">Live performance overview</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {[65, 80, 55, 90, 72, 85, 68].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-[#007A53]/20 relative overflow-hidden"
                      style={{ height: 48 }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-sm bg-[#007A53]"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {/* Card 2 */}
              <div className="absolute bottom-0 left-0 right-8 rounded-[28px] bg-[#007A53] p-6 shadow-2xl">
                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3">Today&apos;s Attendance</p>
                <p className="text-5xl font-extrabold text-white">94%</p>
                <p className="text-white/60 text-sm mt-1">482 / 512 students present</p>
                <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-[94%] bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#007A53] mb-3">Testimonials</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">What Principals Say</h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-[28px] border border-slate-100 bg-white p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-[#007A53] text-[#007A53]" />
                  ))}
                </div>
                <p className="italic text-slate-700 text-sm leading-relaxed">&quot;{t.quote}&quot;</p>
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="font-semibold text-slate-900 text-sm">{t.author}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────── */}
      <section className="py-20 bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Ready to modernise
            <br />
            <span className="text-[#007A53]">your school?</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            Join hundreds of educators using CRAFT SMS to run smarter, more connected institutions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 px-9 py-4 rounded-full text-white font-bold bg-[#007A53] hover:bg-[#005d40] hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                Get Started — It&apos;s Free <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <div className="flex items-center gap-3 px-6 py-4 rounded-full border border-slate-200 bg-white shadow-sm">
              <Phone className="h-4 w-4 text-slate-500" />
              <a href="tel:+231880864187" className="text-sm font-semibold text-slate-700 hover:text-[#007A53] transition-colors">
                +231 88 086 4187
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer id="contact" className="w-full border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Branding */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="h-10 w-auto object-contain block" style={{ background: 'transparent' }} />
              <div>
                <p className="font-bold text-slate-900 text-lg">CRAFT SMS</p>
                <p className="text-xs text-slate-500">Unified Educational Platform</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
              Empowering schools across West Africa with modern, offline-first school management.
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#007A53]" />
                <a href="mailto:support.craftsms@gmail.com" className="hover:text-[#007A53] transition-colors">
                  support.craftsms@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#007A53]" />
                <a href="tel:+231880864187" className="hover:text-[#007A53] transition-colors">
                  +231 88 086 4187
                </a>
              </div>
              <p className="text-xs text-slate-400">Mon – Fri, 9:00 – 17:00 (Local Time)</p>
            </div>
            <p className="mt-6 text-xs text-slate-400">© 2026 CRAFT SMS. All Rights Reserved.</p>
          </div>

          {/* Products */}
          <div>
            <p className="font-semibold text-slate-900 mb-4">Products</p>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {['Platform', 'Mobile App', 'Integrations'].map((l) => (
                <li key={l}><a href="#" className="hover:text-[#007A53] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="font-semibold text-slate-900 mb-4">Company</p>
            <ul className="space-y-2.5 text-sm text-slate-600">
              {['About', 'Careers', 'Blog'].map((l) => (
                <li key={l}><a href="#" className="hover:text-[#007A53] transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="font-semibold text-slate-900 mb-4">Follow Us</p>
            <div className="flex flex-col gap-3">
              <a href="https://www.instagram.com/craf.tsms?igsh=MTB6M3UzenRwemlzYg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#007A53] hover:text-[#005d40] hover:-translate-y-0.5 transition-all duration-200">
                <FaInstagram className="w-5 h-5" /><span className="text-sm font-medium">Instagram</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61590187690022&mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#007A53] hover:text-[#005d40] hover:-translate-y-0.5 transition-all duration-200">
                <FaFacebook className="w-5 h-5" /><span className="text-sm font-medium">Facebook</span>
              </a>
              <a href="https://wa.me/231880864187" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-[#007A53] hover:text-[#005d40] hover:-translate-y-0.5 transition-all duration-200">
                <FaWhatsapp className="w-5 h-5" /><span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
