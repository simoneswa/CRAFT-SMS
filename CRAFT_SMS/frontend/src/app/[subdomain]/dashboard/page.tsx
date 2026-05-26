"use client"

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  CreditCard, 
  Bell, 
  Trophy, 
  Zap,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  BookOpen,
  Layout,
  ChevronRight,
  Clock
} from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { useAuth } from '@/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { fetchAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'

import { ParentDashboardWidget } from '@/components/dashboard/ParentDashboardWidget'
import { StudentWidget } from '@/components/dashboard/StudentWidget'
import { FinanceWidget } from '@/components/dashboard/FinanceWidget'
import { AdminWidget } from '@/components/dashboard/AdminWidget'

function StatCard({ stat, index }: { stat: any, index: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="premium-card bg-white/[0.02] border-white/5 group hover:bg-white/[0.04] transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
          <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
        </div>
        <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
          stat.status === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400' : 
          stat.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 
          stat.status === 'DANGER' ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-gray-500'
        }`}>
          {stat.badge || 'Stable'}
        </div>
      </div>
      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
    </motion.div>
  )
}

export default function TenantDashboard() {
  const { school, isLoading: tenantLoading } = useTenant()
  const { profile, isLoading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [isMetricsLoading, setIsMetricsLoading] = useState(false)

  // Use stable primitive values as dependencies to prevent infinite re-fire loops.
  // Object references (school, profile) change identity on every context re-render,
  // which caused loadDashboardData → setIsLoading(true) → re-render → effect re-fire → infinite loop.
  const schoolId = school?.id
  const profileId = profile?.id

  useEffect(() => {
    if (!schoolId || !profileId) return

    let cancelled = false
    const loadDashboardData = async () => {
      setIsMetricsLoading(true)
      try {
        const data = await fetchAPI(`/tenants/schools/${schoolId}/metrics`)
        if (!cancelled) setMetrics(data)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        if (!cancelled) setIsMetricsLoading(false)
      }
    }

    loadDashboardData()
    return () => { cancelled = true }
  }, [schoolId, profileId])

  if (tenantLoading || authLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
    </div>
  )

  const getRoleStats = () => {
    switch(profile?.role) {
      case 'STUDENT':
        return [
          { label: 'Overall Average', value: '92.4%', badge: 'Top 5%', status: 'POSITIVE', color: 'teal', icon: Trophy },
          { label: 'Attendance', value: '98%', badge: 'Excellent', status: 'POSITIVE', color: 'blue', icon: Users },
          { label: 'Achievement Points', value: '1,250', badge: '+150 Today', status: 'POSITIVE', color: 'purple', icon: Zap },
          { label: 'Pending Fees', value: '$0.00', badge: 'Paid', status: 'POSITIVE', color: 'emerald', icon: CreditCard },
        ]
      case 'TEACHER':
        return [
          { label: 'Active Classes', value: '4', badge: 'Today', status: 'POSITIVE', color: 'teal', icon: Layout },
          { label: 'Attendance Completion', value: '75%', badge: '1 Class Pending', status: 'WARNING', color: 'amber', icon: CheckCircle2 },
          { label: 'Grading Progress', value: '88%', badge: 'Term 1', status: 'POSITIVE', color: 'blue', icon: BookOpen },
          { label: 'Total Students', value: metrics?.total_students || '0', badge: 'Enrolled', status: 'STABLE', color: 'purple', icon: Users },
        ]
      case 'PARENT':
        return [
          { label: 'Linked Students', value: '2', badge: 'Monitoring', status: 'STABLE', color: 'teal', icon: Users },
          { label: 'Average Attendance', value: '94%', badge: 'Consistent', status: 'POSITIVE', color: 'blue', icon: CheckCircle2 },
          { label: 'Recent Grades', value: '3 New', badge: 'Term 1', status: 'POSITIVE', color: 'purple', icon: BookOpen },
          { label: 'Pending Payments', value: '$120.00', badge: 'Due Soon', status: 'WARNING', color: 'amber', icon: CreditCard },
        ]
      default: // SCHOOL_ADMIN / BUSINESS
        return [
          { label: 'Total Enrollment', value: metrics?.total_students || '0', badge: '+12% MoM', status: 'POSITIVE', color: 'teal', icon: Users },
          { label: 'Pending Verifications', value: metrics?.pending_slips || '0', badge: 'Immediate Action', status: 'DANGER', color: 'rose', icon: CreditCard },
          { label: 'Revenue (Term)', value: `$${(metrics?.monthly_revenue || 0).toLocaleString()}`, badge: 'Budget Track', status: 'POSITIVE', color: 'emerald', icon: TrendingUp },
          { label: 'Faculty Count', value: metrics?.total_teachers || '0', badge: 'All Active', status: 'STABLE', color: 'purple', icon: Users },
        ]
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              System <span className="gradient-text">Overview</span>
            </h1>
            <p className="text-gray-500 text-sm max-w-lg">
              {profile?.role === 'STUDENT' ? 'Your academic journey and performance analytics.' :
               profile?.role === 'TEACHER' ? 'Classroom management and operational workflows.' :
               'Institutional health, finance oversight, and platform operations.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             {school?.name} System Live
          </div>
        </header>

        {/* Dynamic Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {getRoleStats().map((stat, i) => (
             <StatCard key={i} stat={stat} index={i} />
           ))}
        </div>

        {/* Primary Action & Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Main Operational View */}
           <div className="lg:col-span-2 space-y-8">
              
              {/* Contextual Widget */}
              {profile?.role === 'STUDENT' ? (
                 <StudentWidget />
              ) : profile?.role === 'TEACHER' ? (
                 <div className="premium-card">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-lg font-bold text-white">Today&apos;s Schedule</h3>
                       <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                          <Calendar className="w-3 h-3" />
                          May 14, 2026
                       </div>
                    </div>
                    <div className="space-y-4">
                       {[
                         { class: 'Grade 10A', subject: 'Mathematics', time: '08:00 AM', status: 'COMPLETED' },
                         { class: 'Grade 11B', subject: 'Calculus', time: '10:30 AM', status: 'ACTIVE' },
                         { class: 'Grade 10C', subject: 'Mathematics', time: '01:00 PM', status: 'UPCOMING' },
                       ].map((item, i) => (
                         <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                           item.status === 'ACTIVE' ? 'bg-teal-500/5 border-teal-500/20 shadow-xl shadow-teal-500/5' : 'bg-white/[0.03] border-white/5'
                         }`}>
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                                 item.status === 'ACTIVE' ? 'bg-teal-500 text-black' : 'bg-white/5 text-gray-500'
                               }`}>
                                 {item.time.split(':')[0]}
                               </div>
                               <div>
                                  <p className="font-bold text-sm text-white">{item.subject}</p>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{item.class} • {item.time}</p>
                               </div>
                            </div>
                            <button className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                               item.status === 'ACTIVE' ? 'bg-teal-500 text-black' : 'bg-white/10 text-gray-400'
                            }`}>
                               {item.status === 'ACTIVE' ? 'Launch Class' : item.status}
                            </button>
                         </div>
                       ))}
                    </div>
                 </div>
              ) : profile?.role === 'PARENT' ? (
                  <ParentDashboardWidget />
              ) : profile?.role === 'BUSINESS' ? (
                  <FinanceWidget />
              ) : (
                  <AdminWidget />
              )}
           </div>

           {/* Secondary Operational Info */}
           <div className="space-y-8">
              
              {/* Contextual Sidebar Widget */}
              <div className="premium-card bg-gradient-to-br from-teal-500/10 via-transparent to-transparent">
                 <h4 className="text-xs font-black text-teal-500 uppercase tracking-[0.25em] mb-6">Critical Alerts</h4>
                 <div className="space-y-4">
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                       <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                          <Bell className="w-4 h-4 text-rose-500" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white mb-1">Term 1 Finalization</p>
                          <p className="text-[10px] text-gray-500 leading-normal">System locking scheduled for May 20. Ensure all grades are published.</p>
                       </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                       <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <CreditCard className="w-4 h-4 text-amber-500" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-white mb-1">Fee Verification</p>
                          <p className="text-[10px] text-gray-500 leading-normal">32 student slips require manual verification by end of day.</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Institutional Events */}
              <div className="premium-card">
                 <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.25em] mb-6">Academic Calendar</h4>
                 <div className="space-y-6">
                    {[
                      { date: 'May 18', event: 'Parent Teacher Conference', type: 'GENERAL' },
                      { date: 'May 22', event: 'Staff Professional Dev', type: 'ADMIN' },
                      { date: 'May 25', event: 'Final Exam Week Starts', type: 'ACADEMIC' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 group cursor-pointer">
                         <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-all">
                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{item.date.split(' ')[0]}</span>
                            <span className="text-sm font-black text-white">{item.date.split(' ')[1]}</span>
                         </div>
                         <div className="flex-1">
                            <p className="text-[11px] font-bold text-white group-hover:text-teal-400 transition-colors">{item.event}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="w-1 h-1 rounded-full bg-gray-700" />
                               <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">{item.type}</span>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>
      </div>
    </DashboardLayout>
  )
}


