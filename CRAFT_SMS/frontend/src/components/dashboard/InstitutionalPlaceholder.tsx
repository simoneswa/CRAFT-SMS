"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Settings, ShieldAlert, Newspaper, Layout, Trophy, History, Globe } from 'lucide-react'
import { DashboardLayout } from './DashboardLayout'

interface PlaceholderProps {
  title: string
  subtitle: string
  icon: any
}

export function InstitutionalPlaceholder({ title, subtitle, icon: Icon }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
       <div className="w-20 h-20 rounded-3xl bg-[#0F4C81]/10 flex items-center justify-center mb-8 border border-[#0F4C81]/20">
          <Icon className="w-10 h-10 text-[var(--accent)]" />
       </div>
       <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">{title}</h1>
       <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] max-w-sm leading-relaxed">
          {subtitle}
       </p>
       <div className="mt-12 flex gap-4">
          <div className="h-px w-12 bg-white/5 self-center" />
          <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">CRAFT SMS Operational Stream</span>
          <div className="h-px w-12 bg-white/5 self-center" />
       </div>
    </div>
  )
}

// Reusable Page Wrappers
export function PlaceholderPage({ title, subtitle, icon }: PlaceholderProps) {
  return (
    <DashboardLayout>
       <InstitutionalPlaceholder title={title} subtitle={subtitle} icon={icon} />
    </DashboardLayout>
  )
}
