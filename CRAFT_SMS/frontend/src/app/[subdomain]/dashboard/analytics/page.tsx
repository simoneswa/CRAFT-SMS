"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CreditCard, 
  BarChart3,
  Target,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { fetchAPI } from '@/lib/api'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

export default function AnalyticsDashboard() {
  const { school } = useTenant()
  const [data, setData] = useState<any>(null)
  const [atRisk, setAtRisk] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (school?.id) {
      loadAnalytics()
    }
  }, [school])

  const loadAnalytics = async () => {
    setIsLoading(true)
    try {
      const [summary, riskData] = await Promise.all([
        fetchAPI('/analytics/summary'),
        fetchAPI('/analytics/at-risk')
      ])
      setData(summary)
      setAtRisk(riskData)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Transform trend data for recharts
  const revenueTrend = [
    { name: 'W1', value: 12000 },
    { name: 'W2', value: 15000 },
    { name: 'W3', value: 18000 },
    { name: 'W4', value: data?.kpis.institutional_revenue || 22000 },
  ]

  const attendanceTrend = [
    { name: 'Mon', value: 92 },
    { name: 'Tue', value: 94 },
    { name: 'Wed', value: 91 },
    { name: 'Thu', value: 95 },
    { name: 'Fri', value: data?.kpis.attendance_rate || 96 },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white">Institutional <span className="gradient-text">Intelligence</span></h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Data-driven performance monitoring and operational health.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={loadAnalytics} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all">
                Refresh Intelligence
             </button>
          </div>
        </header>

        {isLoading ? (
           <div className="flex justify-center py-32">
              <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
           </div>
        ) : (
           <>
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: 'Term Revenue', value: `$${data?.kpis.institutional_revenue.toLocaleString()}`, icon: CreditCard, trend: '+12.5%', color: 'emerald' },
                 { label: 'Attendance Rate', value: `${data?.kpis.attendance_rate}%`, icon: Users, trend: '-0.2%', color: 'blue' },
                 { label: 'Academic Avg', value: `${data?.kpis.average_grade}%`, icon: BarChart3, trend: '+2.1%', color: 'purple' },
                 { label: 'Total Students', value: data?.kpis.total_students, icon: Target, trend: 'Stable', color: 'teal' },
               ].map((kpi, i) => (
                 <div key={i} className="premium-card group hover:scale-[1.02] transition-all">
                    <div className="flex justify-between items-start mb-6">
                       <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-500/10 flex items-center justify-center`}>
                          <kpi.icon className={`w-5 h-5 text-${kpi.color}-400`} />
                       </div>
                       <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${kpi.trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {kpi.trend} <ArrowUpRight className="w-3 h-3" />
                       </div>
                    </div>
                    <p className="section-label mb-1">{kpi.label}</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{kpi.value}</h3>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Main Intelligence Chart */}
               <div className="lg:col-span-2 premium-card">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-sm font-black uppercase tracking-widest text-white">Revenue Acquisition Flow</h3>
                     <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-teal-500" />
                           <span className="text-[10px] font-bold text-gray-500 uppercase">Verified</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueTrend}>
                           <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#0F4C81" stopOpacity={0.8}/>
                                 <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                           <XAxis 
                             dataKey="name" 
                             stroke="#ffffff10" 
                             fontSize={10} 
                             tickLine={false} 
                             axisLine={false}
                             tick={{ fill: '#4b5563', fontWeight: 'bold' }}
                           />
                           <YAxis 
                             stroke="#ffffff10" 
                             fontSize={10} 
                             tickLine={false} 
                             axisLine={false}
                             tick={{ fill: '#4b5563', fontWeight: 'bold' }}
                             tickFormatter={(val) => `$${val/1000}k`}
                           />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}
                              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                           />
                           <Area type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {/* Risk Sidebar */}
               <div className="space-y-6">
                  <div className="premium-card bg-[#0F4C81]/5 border-[#0F4C81]/10">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <AlertCircle className="w-5 h-5 text-[var(--accent)]" />
                           <h3 className="text-xs font-black uppercase tracking-widest text-white">At-Risk Student Watch</h3>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                     </div>

                     <div className="space-y-4">
                        {atRisk.slice(0, 4).map((s, i) => (
                           <div key={i} className="flex flex-col gap-2 p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl group hover:border-[var(--accent)]/30 transition-all">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <p className="text-xs font-bold text-white">{s.name}</p>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em]">{s.risk_level}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-sm font-black text-[var(--accent)]">{s.average_grade}%</p>
                                 </div>
                              </div>
                              <p className="text-[10px] text-gray-500 italic border-t border-white/[0.02] pt-2 mt-1">
                                 {s.absences > 5 ? `⚠️ Operational Warning: ${s.absences} absences detected in last 30 days.` : 
                                  s.average_grade < 60 ? "📉 Academic Warning: Grade average significantly below threshold." :
                                  "🔍 Monitoring: Performance inconsistency detected."}
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="premium-card">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-8">Attendance Periodicity</h3>
                     <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={attendanceTrend}>
                              <Bar dataKey="value" fill="#0F4C81" radius={[6, 6, 0, 0]} barSize={16} />
                              <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{ fill: '#374151' }} />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
            </div>
           </>
        )}
      </div>
    </DashboardLayout>
  )
}
