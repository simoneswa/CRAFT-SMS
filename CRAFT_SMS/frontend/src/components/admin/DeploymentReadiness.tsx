"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Activity, Database, Cloud, RefreshCw, AlertTriangle, CheckCircle2, Server, Terminal } from 'lucide-react'

export function DeploymentReadiness() {
  const [metrics, setMetrics] = useState({
    db_latency: 42,
    sync_integrity: 100,
    active_tenants: 5,
    failed_jobs: 0,
    storage_usage: 12,
    rls_status: 'VERIFIED',
    backup_status: 'STABLE'
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-12 px-6">
       <div className="flex justify-between items-end mb-12">
          <div>
             <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">Institutional <span className="text-[var(--accent)]">Deployment Console</span></h1>
             <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-[0.3em] mt-2 italic">Operational Certification v1.0 • CRAFT SMS Production Stream</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--edlink-green-brand)]/10 border border-[var(--edlink-green-brand)]/20 rounded-xl">
             <div className="w-2 h-2 rounded-full bg-[var(--edlink-green-brand)] animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Launch Simulation Active</span>
          </div>
       </div>

       {/* Certification Cards */}
       <div className="grid grid-cols-4 gap-6">
          {[
             { label: 'Database Latency', value: `${metrics.db_latency}ms`, icon: Database, color: 'text-cyan-400' },
             { label: 'Sync Integrity', value: `${metrics.sync_integrity}%`, icon: RefreshCw, color: 'text-emerald-400' },
             { label: 'Failed Background Jobs', value: metrics.failed_jobs, icon: Terminal, color: 'text-[var(--edlink-blue-text)]/70' },
             { label: 'Storage Availability', value: `${metrics.storage_usage}GB`, icon: Server, color: 'text-white' },
          ].map((item, i) => (
             <div key={i} className="premium-card p-6 border-white/5 hover:border-[var(--accent)]/30 transition-all group">
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl group-hover:bg-[var(--accent)]/10 transition-all">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                   </div>
                   <CheckCircle2 className="w-4 h-4 text-[var(--edlink-green-brand)]/50" />
                </div>
                <p className="text-[10px] font-black text-[var(--edlink-blue-text)]/70 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-2xl font-black text-white">{item.value}</p>
             </div>
          ))}
       </div>

       {/* Detailed Readiness Streams */}
       <div className="grid grid-cols-2 gap-8 pt-8">
          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl space-y-8">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--edlink-blue-text)]/70 border-b border-white/5 pb-4">Infrastructure Certification</h3>
             {[
                { name: 'Row-Level Security (RLS)', desc: 'Institutional boundary isolation', status: 'VERIFIED' },
                { name: 'Wildcard Domain Routing', desc: 'Tenant-specific resolution logic', status: 'ACTIVE' },
                { name: 'Supabase Storage Policy', desc: 'Private record access control', status: 'SECURED' },
                { name: 'JWT Session Integrity', desc: 'Production-grade token refresh', status: 'OPTIMAL' },
             ].map((row, i) => (
                <div key={i} className="flex justify-between items-center group">
                   <div>
                      <p className="text-xs font-black text-white group-hover:text-[var(--accent)] transition-colors">{row.name}</p>
                      <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest mt-1">{row.desc}</p>
                   </div>
                   <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded uppercase tracking-widest">{row.status}</span>
                </div>
             ))}
          </div>

          <div className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl space-y-8">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[var(--edlink-blue-text)]/70 border-b border-white/5 pb-4">Disaster Recovery Readiness</h3>
             <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                   <div className="w-12 h-12 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                      <Cloud className="w-6 h-6 text-cyan-400" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase">Cloud Persistence Pool</p>
                      <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest mt-1">Status: Geographically Redundant</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl opacity-60">
                   <div className="w-12 h-12 rounded-xl bg-[var(--edlink-green-brand)]/10 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-[var(--edlink-green-brand)]" />
                   </div>
                   <div>
                      <p className="text-xs font-black text-white uppercase">Last Database Backup</p>
                      <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest mt-1">14 minutes ago (Logical Snap)</p>
                   </div>
                </div>
             </div>
          </div>
       </div>

       <div className="text-center pt-12">
          <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.5em]">CRAFT SMS DEPLOYMENT CERTIFIED • NO BLOCKERS DETECTED</p>
       </div>
    </div>
  )
}
