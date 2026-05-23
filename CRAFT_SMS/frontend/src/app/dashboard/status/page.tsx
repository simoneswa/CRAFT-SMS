"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { Building2, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function SchoolStatusPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('schools')
      .select('id, name, subdomain, is_active, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSchools(data || [])
        setIsLoading(false)
      })
  }, [])

  const toggleStatus = async (id: string, current: boolean) => {
    await supabase.from('schools').update({ is_active: !current }).eq('id', id)
    setSchools(prev => prev.map(s => s.id === id ? { ...s, is_active: !current } : s))
  }

  return (
    <>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">School <span className="gradient-text">Status</span></h1>
          <p className="text-gray-400">Monitor and control active/inactive state for all tenant schools.</p>
        </header>

        <div className="premium-card">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : schools.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No schools registered yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="section-label pb-3 pr-6">School</th>
                    <th className="section-label pb-3 pr-6">Subdomain</th>
                    <th className="section-label pb-3 pr-6">Created</th>
                    <th className="section-label pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map(school => (
                    <tr key={school.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 pr-6 font-bold">{school.name}</td>
                      <td className="py-4 pr-6 text-sm text-gray-400 font-mono">{school.subdomain}</td>
                      <td className="py-4 pr-6 text-sm text-gray-500">
                        {new Date(school.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => toggleStatus(school.id, school.is_active)}
                          className={`flex items-center gap-2 ml-auto px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            school.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          {school.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          {school.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
