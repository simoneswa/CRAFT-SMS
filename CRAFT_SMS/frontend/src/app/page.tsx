"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, Shield, Zap, Globe, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--brand-surface)] text-[var(--brand-heading)] selection:bg-[var(--brand-primary)]/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--brand-border)] bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--brand-primary)/20]">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[var(--brand-heading)]">CRAFT <span className="text-[var(--brand-primary)]">SMS</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--brand-body)]">
            <a href="#features" className="hover:text-[var(--brand-primary)] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[var(--brand-primary)] transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-[var(--brand-primary)] transition-colors">Contact</a>
          </div>

          <Link href="/signup">
            <button className="px-6 py-2.5 rounded-full bg-[var(--brand-primary)] hover:bg-[#006b48] text-white font-semibold text-sm transition-all shadow-lg shadow-[var(--brand-primary)/20]">
              Request Demo
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-[var(--brand-surface)]">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[var(--brand-primary)]/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[var(--brand-primary)]/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5 text-[var(--brand-primary)] text-xs font-bold uppercase tracking-widest mb-6">
              Now Available in Liberia
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-[var(--brand-heading)]">
              Unified Educational <br />
              <span className="gradient-text">Management Platform</span>
            </h1>
            <p className="max-w-2xl mx-auto text-[var(--brand-body)] text-lg md:text-xl mb-12 leading-relaxed">
              A high-security, multi-tenant SaaS tailored for low-bandwidth environments.
              Empowering schools with offline-first capabilities and gamified learning.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

              <Link
                href="/dashboard"
                className="w-full sm:w-auto"
              >
                <button className="w-full px-8 py-4 rounded-3xl bg-[var(--brand-primary)] text-white font-bold hover:bg-[#006b48] transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-[var(--brand-primary)/20]">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>

              <Link
                href="/docs"
                className="w-full sm:w-auto"
              >
                <button className="w-full px-8 py-4 rounded-3xl border border-[var(--brand-border)] bg-white text-[var(--brand-heading)] hover:bg-[var(--brand-surface)] transition-all duration-300 font-bold">
                  View Documentation
                </button>
              </Link>

            </div>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32">
            {[
              {
                icon: Shield,
                title: "High Security",
                desc: "Enterprise-grade data isolation with Row-Level Security (RLS) powered by Supabase."
              },
              {
                icon: Zap,
                title: "Offline-First",
                desc: "Work seamlessly in 2G/3G environments. Sync data automatically when connection returns."
              },
              {
                icon: Globe,
                title: "Multi-Tenant",
                desc: "Dedicated subdomains for every school with custom branding and automated ID generation."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="premium-card text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-6">
                  <feature.icon className="text-[var(--brand-primary)] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--brand-heading)]">{feature.title}</h3>
                <p className="text-[var(--brand-body)] leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--brand-border)] py-12 px-6 bg-[var(--brand-surface)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-[var(--brand-heading)]">CRAFT SMS</span>
          </div>
          <p className="text-[var(--brand-muted)] text-sm">
            © 2026 CRAFT SMS. All rights reserved. Built for Liberia.
          </p>
        </div>
      </footer>
    </main>
  )
}
