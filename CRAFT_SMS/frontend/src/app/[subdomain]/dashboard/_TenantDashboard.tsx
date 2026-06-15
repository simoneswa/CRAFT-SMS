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
import { useTenant } from '../../../providers/TenantProvider'
import { useAuth } from '../../../providers/AuthProvider'
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout'
import { fetchAPI } from '../../../lib/api'

import { ParentDashboardWidget } from '../../../components/dashboard/ParentDashboardWidget'
import { StudentWidget } from '../../../components/dashboard/StudentWidget'
import { FinanceWidget } from '../../../components/dashboard/FinanceWidget'
import { AdminWidget } from '../../../components/dashboard/AdminWidget'

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
          stat.status === 'POSITIVE' ? 'bg-[var(--edlink-green-brand)]/10 text-emerald-400' : 
          stat.status === 'WARNING' ? 'bg-amber-500/10 text-amber-400' : 
          stat.status === 'DANGER' ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-[var(--edlink-blue-text)]/70'
        }`}>
          {stat.badge || 'Stable'}
        </div>
      </div>
      <p className="text-[var(--edlink-blue-text)]/70 text-[10px] font-bold uppercase tracking-[0.15em] mb-1">{stat.label}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
    </motion.div>
  )
}

export default function TenantDashboardClient() {
  const { school, isLoading: tenantLoading } = useTenant()
  const { profile, isLoading: authLoading } = useAuth()
  const [metrics, setMetrics] = useState<any>(null)
  const [isMetricsLoading, setIsMetricsLoading] = useState(false)

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
      <div className="w-10 h-10 border-4 border-[var(--edlink-green-brand)]/20 border-t-teal-500 rounded-full animate-spin" />
    </div>
  )

  const getRoleStats = () => {
    switch(profile?.role) {
      case 'STUDENT':
        return [
          { label: 'Overall Average', value: '--', badge: 'Pending', status: 'STABLE', color: 'teal', icon: Trophy },
          { label: 'Attendance', value: '--', badge: 'Pending', status: 'STABLE', color: 'blue', icon: Users },
          { label: 'Achievement Points', value: '--', badge: 'Pending', status: 'STABLE', color: 'purple', icon: Zap },
          { label: 'Pending Fees', value: '--', badge: 'Pending', status: 'STABLE', color: 'emerald', icon: CreditCard },
        ]
      case 'TEACHER':
        return [
          { label: 'Active Classes', value: '--', badge: 'Pending', status: 'STABLE', color: 'teal', icon: Layout },
          { label: 'Attendance Completion', value: '--', badge: 'Pending', status: 'STABLE', color: 'amber', icon: CheckCircle2 },
          { label: 'Grading Progress', value: '--', badge: 'Pending', status: 'STABLE', color: 'blue', icon: BookOpen },
          { label: 'Total Students', value: metrics?.total_students || '0', badge: 'Enrolled', status: 'STABLE', color: 'purple', icon: Users },
        ]
      case 'PARENT':
        return [
          { label: 'Linked Students', value: '--', badge: 'Pending', status: 'STABLE', color: 'teal', icon: Users },
          { label: 'Average Attendance', value: '--', badge: 'Pending', status: 'STABLE', color: 'blue', icon: CheckCircle2 },
          { label: 'Recent Grades', value: '--', badge: 'Pending', status: 'STABLE', color: 'purple', icon: BookOpen },
          { label: 'Pending Payments', value: '--', badge: 'Pending', status: 'STABLE', color: 'amber', icon: CreditCard },
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
            <p className="text-[var(--edlink-blue-text)]/70 text-sm max-w-lg">
              {profile?.role === 'STUDENT' ? 'Your academic journey and performance analytics.' :
               profile?.role === 'TEACHER' ? 'Classroom management and operational workflows.' :
               'Institutional health, finance oversight, and platform operations.'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-[var(--edlink-blue-text)]/70 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5">
             <div className="w-2 h-2 rounded-full bg-[var(--edlink-green-brand)]" />
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
                 <div className="premium-card text-center py-12 border-white/5">
                    <Calendar className="w-10 h-10 mx-auto text-[var(--edlink-blue-text)]/40 mb-3" />
                    <p className="text-[var(--edlink-blue-text)]/70 font-medium">No classes scheduled for today.</p>
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
              
              <div className="premium-card bg-gradient-to-br from-teal-500/10 via-transparent to-transparent">
                 <h4 className="text-xs font-black text-[var(--edlink-green-brand)] uppercase tracking-[0.25em] mb-6">Critical Alerts</h4>
                 <div className="text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                    <p className="text-xs text-[var(--edlink-blue-text)]/70">No critical alerts requiring action.</p>
                 </div>
              </div>

              {/* Institutional Events */}
              <div className="premium-card">
                 <h4 className="text-xs font-black text-[var(--edlink-blue-text)]/70 uppercase tracking-[0.25em] mb-6">Academic Calendar</h4>
                 <div className="text-center py-6">
                    <Calendar className="w-8 h-8 text-[var(--edlink-blue-text)]/40 mx-auto mb-2" />
                    <p className="text-xs text-[var(--edlink-blue-text)]/70">No upcoming events this week.</p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
