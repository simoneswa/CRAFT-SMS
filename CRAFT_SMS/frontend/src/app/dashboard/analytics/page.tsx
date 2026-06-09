"use client"

import { DashboardLayout } from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../providers/AuthProvider'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react'
import { fetchAPI } from '../../../lib/api'

export default function AnalyticsPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ schools: 0, students: 0, slips: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetch = async () => {
      try {
        setIsLoading(true)

        // Fetch real stats from API
        const realStats = await fetchAPI('/auth/admin/stats')
        if (!isMounted) return

        setStats({
          schools: realStats?.schools || 0,
          students: realStats?.students || 0,
          slips: realStats?.slips || 0,
        })
      } catch (err) {
        console.warn('Analytics fetch failed; falling back to zeroed stats.', err)
        if (!isMounted) return
        setStats({ schools: 0, students: 0, slips: 0 })
      } finally {
        if (!isMounted) return
        setIsLoading(false)
      }
    }

    fetch()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">Global <span className="gradient-text">Analytics</span></h1>
          <p className="text-[var(--edlink-blue-text)]/70">Platform-wide metrics across all tenants.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Active Schools', value: stats.schools, icon: Building2, color: 'teal' },
            { label: 'Total Students', value: stats.students, icon: Users, color: 'blue' },
            { label: 'Fee Slips Processed', value: stats.slips, icon: BarChart3, color: 'purple' },
          ].map((s, i) => (
            <div key={i} className="premium-card">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-500/10 flex items-center justify-center mb-4`}>
                <s.icon className={`w-5 h-5 text-${s.color}-400`} />
              </div>
              <p className="section-label mb-1">{s.label}</p>
              <p className="text-3xl font-bold">{isLoading ? '—' : s.value}</p>
            </div>
          ))}
        </div>

        <div className="premium-card">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--edlink-green-brand)]" />
            Enrollment Trend
          </h3>
          <div className="flex items-center justify-center h-40 text-[var(--edlink-blue-text)]/70 text-sm">
            Chart integration coming soon — connect to your preferred analytics provider.
          </div>
        </div>
      </div>
    </>
  )
}

