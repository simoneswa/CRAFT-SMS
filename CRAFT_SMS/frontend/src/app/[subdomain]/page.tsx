"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, Users, CreditCard, Bell, Trophy, Settings, Zap } from 'lucide-react'

export default function SchoolDashboard() {
  const params = useParams()
  const subdomain = params.subdomain as string

  // Mock school data - In production, fetch this from Supabase based on subdomain
  const schoolName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + " School"

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-8 flex flex-col gap-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-lg" />
          <span className="font-bold text-xl tracking-tight uppercase">{subdomain}</span>
        </div>

        <nav className="flex flex-col gap-2">
          {[
            { icon: LayoutDashboard, label: 'Overview', active: true },
            { icon: Users, label: 'Students' },
            { icon: CreditCard, label: 'Financials' },
            { icon: Trophy, label: 'Leaderboard' },
            { icon: Bell, label: 'News Feed' },
            { icon: Settings, label: 'Settings' },
          ].map((item, i) => (
            <button
              key={i}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                item.active 
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-blue-500/20 border border-teal-500/30">
            <p className="text-xs font-bold text-teal-400 mb-2 uppercase">Pro Plan</p>
            <p className="text-sm text-gray-300">Your school is secured with CRAFT SMS.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">{schoolName}</h1>
            <p className="text-gray-400">Welcome back, Administrator</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 border-2 border-white/20" />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Students', value: '1,240', change: '+12%', color: 'teal' },
            { label: 'Pending Slips', value: '42', change: '-5%', color: 'blue' },
            { label: 'Active Teachers', value: '86', change: '0%', color: 'purple' },
            { label: 'Revenue (MTD)', value: '$12.4k', change: '+18%', color: 'emerald' },
          ].map((stat, i) => (
            <div key={i} className="premium-card">
              <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold mb-2">{stat.value}</h3>
              <span className={`text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.change} <span className="text-gray-500 font-normal">from last month</span>
              </span>
            </div>
          ))}
        </div>

        {/* Action Center & News Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="premium-card">
              <h3 className="text-lg font-bold mb-6">Recent Slip Verifications</h3>
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                        S{i}
                      </div>
                      <div>
                        <p className="font-bold text-sm">Samuel Doe</p>
                        <p className="text-xs text-gray-500">Slip #BNK-9920</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">$450.00</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase font-bold">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="premium-card border-teal-500/20 bg-teal-500/5">
              <h3 className="text-lg font-bold mb-4">Offline Sync Status</h3>
              <div className="flex items-center gap-3 text-emerald-400 mb-4">
                <Zap className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">All changes synced</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Your data is safe. Even without internet, you can continue marking attendance and verifying slips.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
