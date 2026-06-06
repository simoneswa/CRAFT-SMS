"use client"

import { DashboardLayout } from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../providers/AuthProvider'
import { supabase } from '../../../lib/supabase'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, Building2 } from 'lucide-react'

export default function AnalyticsPage() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ schools: 0, students: 0, slips: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetch = async () => {
      try {
        setIsLoading(true)

        const results = await Promise.allSettled([
          supabase.from('schools').select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'STUDENT'),
          supabase.from('slips').select('*', { count: 'exact', head: true }),
        ])

        const schoolsCount =
          results[0].status === 'fulfilled' ? results[0].value?.count : undefined
        const studentsCount =
          results[1].status === 'fulfilled' ? results[1].value?.count : undefined
        const slipsCount =
          results[2].status === 'fulfilled' ? results[2].value?.count : undefined

        if (!isMounted) return

        setStats({
          schools: typeof schoolsCount === 'number' ? schoolsCount : 0,
          students: typeof studentsCount === 'number' ? studentsCount : 0,
          slips: typeof slipsCount === 'number' ? slipsCount : 0,
        })
      } catch (err) {
        // Non-fatal: keep dashboard interactive even if some tables are missing/unmigrated
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
          <p className="text-gray-400">Platform-wide metrics across all tenants.</p>
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
            <TrendingUp className="w-5 h-5 text-teal-400" />
            Enrollment Trend
          </h3>
          <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
            Chart integration coming soon — connect to your preferred analytics provider.
          </div>
        </div>
      </div>
    </>
  )
}
