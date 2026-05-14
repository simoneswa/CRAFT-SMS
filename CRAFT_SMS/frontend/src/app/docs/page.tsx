"use client"

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, ArrowLeft, Book, Shield, Zap, Globe, Code } from 'lucide-react'

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white flex flex-col">
      {/* Header */}
      <nav className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <GraduationCap className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">CRAFT <span className="text-teal-400">SMS</span></span>
            </Link>
            <div className="h-6 w-px bg-white/10" />
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Documentation</span>
          </div>

          <Link href="/login">
            <button className="px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all">
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 p-8 hidden lg:block sticky top-20 h-[calc(100vh-80px)]">
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Getting Started</h3>
              <ul className="space-y-3">
                {['Introduction', 'Quickstart', 'Architecture'].map((item) => (
                  <li key={item}><Link href="#" className="text-sm text-teal-400 font-medium hover:text-teal-300">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Core Concepts</h3>
              <ul className="space-y-3">
                {['Multi-Tenancy', 'Row Level Security', 'Offline Sync'].map((item) => (
                  <li key={item}><Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 p-8 lg:p-16 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-invert prose-teal max-w-none"
          >
            <h1 className="text-4xl font-extrabold mb-8">Documentation</h1>
            
            <p className="text-gray-400 text-lg mb-12 leading-relaxed">
              Welcome to the CRAFT SMS documentation. CRAFT (Centralized Resource for Academic & Financial Tracking) 
              is a next-generation school management system built for the unique challenges of the West African educational landscape.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
              {[
                { title: 'Security First', desc: 'Isolated data per school using PostgreSQL RLS.', icon: Shield },
                { title: 'Offline-First', desc: 'Sync data in 2G/3G environments seamlessly.', icon: Zap },
                { title: 'Multi-Tenant', desc: 'Dedicated subdomains for every institution.', icon: Globe },
                { title: 'API Access', desc: 'Integrate with local payment gateways easily.', icon: Code },
              ].map((feature, i) => (
                <div key={i} className="premium-card">
                  <feature.icon className="text-teal-400 w-8 h-8 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mb-6">System Architecture</h2>
            <p className="text-gray-400 mb-8">
              CRAFT SMS utilizes a distributed architecture with a centralized FastAPI backend and a Supabase storage layer. 
              Each school is treated as a first-class tenant with its own secure data silo.
            </p>

            <div className="p-8 rounded-2xl bg-teal-500/5 border border-teal-500/20">
              <h3 className="text-teal-400 font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-gray-400">
                Contact our support team in Monrovia for on-site onboarding and technical assistance.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
