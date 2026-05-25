"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, Shield, Zap, Globe, ArrowRight, Mail, Phone, MessageCircle } from 'lucide-react'

const BRAND = {
  primary: '#007A53',
  cream: '#FAF8F5',
}

export default function LandingPage() {
  const [videoId] = useState('dQw4w9WgXcQ') // configurable YouTube id
  const partnerLogos: string[] = [] // dynamic source: replace with real registered school logos

  const placeholderCount = 5

  const testimonials = [
    {
      quote: "CRAFT SMS transformed our school's operations — faster, simpler, and secure.",
      author: 'Mary J. Johnson, Principal',
    },
    {
      quote: "Attendance, fees, and communication — all in one place. Teachers love it!",
      author: 'Samuel K. Doe, Headmaster',
    },
    {
      quote: "Offline-first features saved our reporting during poor connectivity.",
      author: 'Aisha B. Conteh, Admin',
    },
  ]

  const [tIndex, setTIndex] = useState(0)
  const nextTestimonial = () => setTIndex((i) => (i + 1) % testimonials.length)
  const prevTestimonial = () => setTIndex((i) => (i - 1 + testimonials.length) % testimonials.length)

  return (
    <main className="min-h-screen selection:bg-[#007A53]/20 bg-white text-slate-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-100 bg-white/95 backdrop-blur py-3">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center shadow-lg" style={{background:BRAND.primary}}>
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">CRAFT <span style={{color:BRAND.primary}}>SMS</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-[#007A53] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#007A53] transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-[#007A53] transition-colors">Contact</a>
          </div>

          <Link href="/signup">
            <button className="px-6 py-2.5 rounded-full text-white font-semibold text-sm transition-all shadow-lg" style={{background:BRAND.primary}}>
              Request Demo
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.45}}>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900">
              Unified School Management
              <br />
              <span className="text-[#0f3f3a]">for modern, resilient schools</span>
            </h1>
            <p className="max-w-2xl mx-auto mt-4 text-lg text-slate-600">CRAFT SMS brings attendance, finance, communication and analytics into a single, offline-first platform built for constrained networks.</p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <button className="px-8 py-4 rounded-3xl text-white font-bold shadow-xl" style={{background:BRAND.primary}}>Get Started</button>
              </Link>
              <Link href="/docs">
                <button className="px-8 py-4 rounded-3xl border border-gray-200 bg-white text-slate-800">View Documentation</button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Alternating Canvas: Partners (white) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-slate-900">Schools Empowered by Craft SMS</h2>
          <p className="text-sm text-slate-600 mt-2">A growing roster of schools rely on CRAFT SMS. Add your institution today.</p>

          <div className="mt-6 grid grid-cols-3 md:grid-cols-8 gap-4 items-center">
            {partnerLogos.length > 0 ? (
              partnerLogos.map((src, idx) => (
                <div key={idx} className="flex items-center justify-center p-3 bg-white border rounded-full shadow-sm">
                  <img src={src} alt={`partner-${idx}`} className="h-10 object-contain" />
                </div>
              ))
            ) : (
              Array.from({length: placeholderCount}).map((_, i) => (
                <div key={i} className="flex items-center justify-center p-4 bg-white/60 border border-gray-100 rounded-full h-20 w-20 mx-auto">
                  <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Video Canvas (cream bg) */}
      <section className="py-16 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-xl font-semibold text-slate-900 text-center">Watch Craft SMS in Action</h3>
          <div className="mt-8">
            <div className="aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-xl">
              <iframe
                title="Craft SMS Demo"
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials (white) */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="hidden md:flex items-center justify-center bg-[#007A53] p-8">
                <div className="text-white max-w-md">
                  <p className="italic text-lg">"{testimonials[tIndex].quote}"</p>
                  <p className="mt-4 font-semibold">{testimonials[tIndex].author}</p>
                </div>
              </div>
              <div className="md:col-span-2 p-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold">What Principals Say</h4>
                  <div className="flex gap-2">
                    <button aria-label="previous" onClick={prevTestimonial} className="p-2 rounded-full border hover:bg-gray-50">
                      ‹
                    </button>
                    <button aria-label="next" onClick={nextTestimonial} className="p-2 rounded-full border hover:bg-gray-50">
                      ›
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="rounded-2xl border p-6 bg-white shadow-sm">
                    <p className="text-slate-800">{testimonials[tIndex].quote}</p>
                    <p className="mt-4 text-sm text-slate-600">— {testimonials[tIndex].author}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Humanized Illustration Banner */}
      <section className="py-12 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-6">
          <div className="hidden md:block w-48">
            <div className="h-36 w-36 bg-gradient-to-br from-emerald-200 to-sky-200 rounded-full" />
          </div>

          <div className="flex-1 text-center">
            <h3 className="text-2xl font-semibold">Download Craft SMS Sekarang</h3>
            <p className="text-sm text-slate-600 mt-2">Get the mobile app to manage attendance and communications on the go.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <a className="inline-block px-5 py-3 rounded-full bg-[#007A53] text-white font-semibold" href="#">App Store</a>
              <a className="inline-block px-5 py-3 rounded-full border border-gray-200 bg-white text-slate-800 font-semibold" href="#">Google Play</a>
            </div>
          </div>

          <div className="hidden md:block w-48">
            <div className="h-36 w-36 bg-gradient-to-br from-pink-200 to-yellow-200 rounded-full" />
          </div>
        </div>
      </section>

      {/* Executive Footer */}
      <footer className="w-full border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Column 1: Branding & Support */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{background:BRAND.primary}}>
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900">CRAFT SMS</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-600" />
                <a href="mailto:support.craftsms@gmail.com" className="hover:text-[#007A53]">support.craftsms@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-600" />
                <a href="tel:+231880864187" className="hover:text-[#007A53]">+231 88 086 4187</a>
              </div>
              <p className="text-xs text-slate-500 mt-2">Mon — Fri, 9:00 — 17:00 (Local Time)</p>
            </div>

            <p className="mt-6 text-xs text-slate-500">© 2026 CRAFT SMS. All Rights Reserved.</p>
          </div>

          {/* Column 2: Products */}
          <div>
            <p className="font-semibold text-slate-900 mb-3">Products</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-[#007A53]">Platform</a></li>
              <li><a href="#" className="hover:text-[#007A53]">Mobile App</a></li>
              <li><a href="#" className="hover:text-[#007A53]">Integrations</a></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <p className="font-semibold text-slate-900 mb-3">Company</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-[#007A53]">About</a></li>
              <li><a href="#" className="hover:text-[#007A53]">Careers</a></li>
              <li><a href="#" className="hover:text-[#007A53]">Blog</a></li>
            </ul>
          </div>

          {/* Column 4: Partners */}
          <div>
            <p className="font-semibold text-slate-900 mb-3">Partners</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-[#007A53]">Become a Partner</a></li>
              <li><a href="#" className="hover:text-[#007A53]">Affiliates</a></li>
              <li><a href="#" className="hover:text-[#007A53]">School Onboarding</a></li>
            </ul>
          </div>

          {/* Column 5: Social */}
          <div>
            <p className="font-semibold text-slate-900 mb-3">Ikuti Craft SMS</p>
            <div className="flex flex-col gap-3">
                <a href="https://www.instagram.com/craf.tsms?igsh=MTB6M3UzenRwemlzYg%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#007A53]">
                <Globe className="text-pink-500 w-5 h-5" /> <span className="text-sm">Instagram</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61590187690022&mibextid=wwXIfr&mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#007A53]">
                <MessageCircle className="text-blue-600 w-5 h-5" /> <span className="text-sm">Facebook</span>
              </a>
              <a href="https://wa.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#007A53]">
                <Phone className="text-green-500 w-5 h-5" /> <span className="text-sm">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
