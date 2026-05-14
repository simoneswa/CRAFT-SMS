"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Search, Building2, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { SuperAdminOverview } from '@/components/admin/SuperAdminOverview'

export default function DashboardPage() {
  const { profile, isLoading } = useAuth()

  if (isLoading) return null

  // If user is SUPER_ADMIN, show the Control Center
  if (profile?.role === 'SUPER_ADMIN') {
    return <SuperAdminOverview />
  }

  // Otherwise show the school selection / directory view
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">
          Platform <span className="gradient-text">Overview</span>
        </h1>
        <p className="text-gray-400 text-lg">Manage multiple institutions or find your school portal.</p>
      </header>

      {/* Quick Search */}
      <div className="relative group">
        <div className="absolute inset-0 bg-teal-500/20 blur-2xl group-hover:bg-teal-500/30 transition-all rounded-full -z-10" />
        <div className="premium-card flex items-center gap-6 p-2 pr-4">
          <div className="flex-1 flex items-center gap-4 pl-4">
            <Search className="text-gray-500 w-6 h-6" />
            <input 
              type="text" 
              placeholder="Search for a school in Liberia..." 
              className="w-full bg-transparent border-none focus:outline-none py-4 text-lg font-medium"
            />
          </div>
          <button className="px-8 py-3 bg-teal-500 hover:bg-teal-400 rounded-xl text-black font-bold transition-all shadow-lg shadow-teal-500/20">
            Search
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* For Students/Parents */}
        <div className="premium-card group hover:border-teal-500/40 transition-all">
          <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6">
            <Building2 className="text-teal-400 w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold mb-4">School Directory</h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Access your school's dedicated portal. View grades, attendance, and pay fees through your specific subdomain.
          </p>
          <div className="flex flex-col gap-3">
             {['St. Edwards High', 'Monrovia Academy', 'Liberia Int. School'].map((school, i) => (
               <Link key={i} href={`#`} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <span className="font-medium">{school}</span>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
               </Link>
             ))}
          </div>
        </div>

        {/* For System Admins */}
        <div className="premium-card group hover:border-blue-500/40 transition-all">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
            <ShieldCheck className="text-blue-400 w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Super Admin Console</h2>
          <p className="text-gray-400 leading-relaxed mb-8">
            Global monitoring, tenant management, and system-wide overrides for CRAFT SMS operators.
          </p>
          <button className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-3">
            Enter Command Center
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
