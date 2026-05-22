"use client"

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Bell, Trophy, Settings, Zap, BookOpen, ClipboardCheck } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

export default function SchoolDashboard() {
  const params = useParams()
  const subdomain = params.subdomain as string
  const { profile } = useAuth()

  const role = profile?.role || 'STUDENT'
  const schoolName = subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + " School"

  // Contextual Sidebar Navigation
  const getNavItems = () => {
    const base = [
      { icon: LayoutDashboard, label: 'Overview', href: `/${subdomain}/dashboard`, active: true },
      { icon: Bell, label: 'News Feed', href: `/${subdomain}/dashboard/news` },
    ]

    if (role === 'STUDENT') {
      return [
        ...base,
        { icon: BookOpen, label: 'My Courses', href: `/${subdomain}/dashboard/courses` },
        { icon: CreditCard, label: 'Financial Status', href: `/${subdomain}/dashboard/finance` },
        { icon: Trophy, label: 'Leaderboard', href: `/${subdomain}/dashboard/gamification` },
      ]
    } else if (role === 'BUSINESS') {
      return [
        ...base,
        { icon: CreditCard, label: 'Payments & Slips', href: `/${subdomain}/dashboard/finance` },
        { icon: Users, label: 'Student Balances', href: `/${subdomain}/dashboard/students` },
      ]
    } else {
      // Admin / Super Admin / Teacher
      return [
        ...base,
        { icon: Users, label: 'Directory', href: `/${subdomain}/dashboard/students` },
        { icon: CreditCard, label: 'Financials', href: `/${subdomain}/dashboard/finance` },
        { icon: ClipboardCheck, label: 'Attendance', href: `/${subdomain}/dashboard/attendance` },
        { icon: Trophy, label: 'Gamification', href: `/${subdomain}/dashboard/gamification` },
        { icon: Settings, label: 'Settings', href: `/${subdomain}/dashboard/settings` },
      ]
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-white/5 bg-black/40 backdrop-blur-2xl p-8 flex flex-col gap-12 hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-lg" />
          <span className="font-bold text-xl tracking-tight uppercase">{subdomain}</span>
        </div>

        <nav className="flex flex-col gap-2">
          {getNavItems().map((item, i) => (
            <Link key={i} href={item.href}>
              <button
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  item.active 
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            </Link>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-blue-500/20 border border-teal-500/30">
            <p className="text-xs font-bold text-teal-400 mb-2 uppercase">{role}</p>
            <p className="text-sm text-gray-300">Secured via CRAFT SMS.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">{schoolName}</h1>
            <p className="text-gray-400">Welcome back, {profile?.full_name || role}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 border-2 border-white/20" />
          </div>
        </header>

        {/* Dynamic Dashboard Differentiation */}
        {role === 'STUDENT' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Current GPA', value: '3.8', change: 'Top 10%', color: 'teal' },
                { label: 'Attendance', value: '98%', change: 'Excellent', color: 'blue' },
                { label: 'Unpaid Fees', value: '$0.00', change: 'Cleared', color: 'emerald' },
              ].map((stat, i) => (
                <div key={i} className="premium-card">
                  <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold mb-2">{stat.value}</h3>
                  <span className="text-xs font-bold text-emerald-400">{stat.change}</span>
                </div>
              ))}
            </div>
            
            <div className="premium-card">
              <h3 className="text-lg font-bold mb-6">My Recent Classes</h3>
              <div className="flex flex-col gap-4">
                {['Mathematics', 'Physics', 'History'].map((course, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-bold">{course}</span>
                    <button onClick={() => alert('Opening course material...')} className="text-teal-400 text-sm font-bold hover:underline">View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : role === 'BUSINESS' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Pending Slips', value: '14', change: 'Needs Review', color: 'amber' },
                { label: 'Verified Today', value: '42', change: '+12%', color: 'emerald' },
                { label: 'Total Revenue (MTD)', value: '$12,450', change: 'On Track', color: 'teal' },
              ].map((stat, i) => (
                <div key={i} className="premium-card">
                  <p className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-2xl font-bold mb-2">{stat.value}</h3>
                  <span className="text-xs font-bold text-amber-400">{stat.change}</span>
                </div>
              ))}
            </div>

            <div className="premium-card border-amber-500/20 bg-amber-500/5">
              <h3 className="text-lg font-bold mb-4">Pending Financial Actions</h3>
              <p className="text-sm text-gray-400 mb-4">You have 14 unverified payment slips from students.</p>
              <Link href={`/${subdomain}/dashboard/finance`}>
                <button className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl transition-all hover:bg-amber-400">
                  Review Slips
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Offline Sync Indicator */}
        <div className="mt-8">
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
      </main>
    </div>
  )
}
