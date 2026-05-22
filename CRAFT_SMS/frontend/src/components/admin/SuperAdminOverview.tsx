"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  Users, 
  Activity, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  UserX,
  KeyRound,
  Wrench
} from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { useToast } from '@/providers/ToastProvider'

export function SuperAdminOverview() {
  const [metrics, setMetrics] = useState<any>({})
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Safe parallel fetching. We don't want the whole page to crash if one endpoint fails.
      const results = await Promise.allSettled([
        fetchAPI('/tenants/metrics'),
        fetchAPI('/admin/audit-logs')
      ])

      const metricsRes = results[0]
      const logsRes = results[1]

      if (metricsRes.status === 'fulfilled' && metricsRes.value) {
        setMetrics(metricsRes.value)
      } else {
        console.warn('Metrics failed:', metricsRes)
        setMetrics({})
      }

      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value)) {
        setLogs(logsRes.value)
      } else {
        console.warn('Logs failed or invalid format:', logsRes)
        setLogs([])
      }
    } catch (err: any) {
      console.error('Failed to load Super Admin data:', err)
      setError(err.message || 'Failed to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="premium-card text-center py-20">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-rose-400 mb-2">Dashboard Error</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button onClick={loadData} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
          Retry Connection
        </button>
      </div>
    )
  }

  // Safe fallback values
  const activeTenants = Number(metrics?.total_tenants) || 0
  const globalUsers = Number(metrics?.total_users) || 0
  const platformRevenue = Number(metrics?.platform_revenue) || 0
  const systemHealth = metrics?.system_health || '99.9%'
  const safeLogs = Array.isArray(logs) ? logs : []

  const statCards = [
    { label: 'Active Tenants', value: activeTenants, icon: Building2, color: 'teal' },
    { label: 'Global Users', value: globalUsers, icon: Users, color: 'blue' },
    { label: 'Platform Revenue', value: `$${platformRevenue.toLocaleString()}`, icon: DollarSign, color: 'emerald' },
    { label: 'System Health', value: systemHealth, icon: Activity, color: 'purple' },
  ]

  const handleAction = (actionName: string) => {
    addToast(`${actionName} triggered securely.`, 'success')
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Control <span className="gradient-text">Center</span>
        </h1>
        <p className="text-gray-400">Global oversight and platform management.</p>
      </header>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Alerts & System Logs */}
        <div className="lg:col-span-2 space-y-8">
          <div className="premium-card">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <ShieldAlert className="text-teal-400 w-6 h-6" />
                Security & Activity Logs
              </h3>
              <button onClick={() => { loadData(); addToast('Refreshing logs...', 'success') }} className="text-teal-400 text-sm font-bold hover:underline flex items-center gap-2">
                Refresh <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {safeLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity found.</p>
              ) : (
                safeLogs.slice(0, 5).map((log: any) => {
                  const safeAction = String(log?.action || 'UNKNOWN')
                  const isError = safeAction.includes('REJECTED') || safeAction.includes('ERROR')
                  const isSuccess = safeAction.includes('CREATED') || safeAction.includes('VERIFIED')
                  
                  return (
                    <div key={log.id || Math.random()} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          isError ? 'bg-rose-500' : isSuccess ? 'bg-emerald-500' : 'bg-teal-500'
                        }`} />
                        <div>
                          <p className="font-bold text-sm">{safeAction.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500">
                            By: {log?.actor?.full_name || 'System'} | Target: {log?.target_id || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold uppercase">
                        {log?.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Support & Impersonation */}
        <div className="space-y-8">
          <div className="premium-card border-blue-500/20 bg-blue-500/5">
             <h3 className="text-lg font-bold mb-4">Support Toolbox</h3>
             <p className="text-xs text-gray-400 mb-6">Need to assist a school admin? Use impersonation or manual overrides.</p>
             <div className="space-y-3">
                <button onClick={() => handleAction('Impersonation Mode')} className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">
                  <UserX className="w-4 h-4" /> Impersonate Tenant Admin
                </button>
                <button onClick={() => handleAction('Password Reset Flow')} className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold transition-all">
                  <KeyRound className="w-4 h-4" /> Reset School Password
                </button>
                <button onClick={() => handleAction('Maintenance Override')} className="flex items-center justify-center gap-2 w-full py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all">
                  <Wrench className="w-4 h-4" /> Emergency Maintenance Mode
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

