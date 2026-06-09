"use client"

import React, { useState, useEffect } from 'react'
import { BookOpen, Clock, CreditCard, ChevronRight, Users } from 'lucide-react'
import { fetchAPI } from '../../lib/api'

export function ParentDashboardWidget() {
  const [children, setChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setIsLoading(true)
        const data = await fetchAPI('/parents/students')
        const loadedChildren = Array.isArray(data) ? data : []
        setChildren(loadedChildren)
        if (loadedChildren.length > 0) {
          setSelectedChildId(loadedChildren[0].student_id)
        }
      } catch (err) {
        console.error('Failed to load linked children:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadChildren()
  }, [])

  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedChildId) return
      try {
        const data = await fetchAPI(`/parents/student/${selectedChildId}/summary`)
        setSummary(data)
      } catch (err) {
        console.error('Failed to load child summary:', err)
      }
    }
    loadSummary()
  }, [selectedChildId])

  if (isLoading) {
    return (
      <div className="premium-card p-8 flex flex-col items-center justify-center text-[var(--edlink-blue-text)]/50">
        <p className="text-sm font-medium">Loading linked students...</p>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="premium-card p-12 flex flex-col items-center justify-center text-center bg-white/[0.01]">
        <Users className="w-10 h-10 mb-4 opacity-20 text-[var(--edlink-blue-text)]" />
        <h3 className="text-lg font-bold text-white mb-2">No Linked Students</h3>
        <p className="text-sm text-[var(--edlink-blue-text)]/70 max-w-[250px]">
          There are no students currently linked to your parent account. Please contact the school administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="premium-card bg-[var(--edlink-green-brand)]/5 border-[var(--edlink-green-brand)]/10">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Children Overview</h3>
            <div className="flex gap-2">
               {children.map(child => (
                 <button 
                   key={child.student_id}
                   onClick={() => setSelectedChildId(child.student_id)}
                   className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedChildId === child.student_id ? 'bg-[var(--edlink-green-brand)] text-black' : 'bg-white/5 text-[var(--edlink-blue-text)]/70 hover:bg-white/10'}`}
                 >
                   {child.profile?.full_name?.split(' ')[0] || 'Student'}
                 </button>
               ))}
            </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
               <p className="text-[10px] font-bold text-[var(--edlink-blue-text)]/70 uppercase tracking-widest mb-1">Current Attendance</p>
               <p className="text-xl font-bold text-emerald-400">
                 {summary?.attendance_rate !== undefined ? `${summary.attendance_rate}%` : '—'}
               </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
               <p className="text-[10px] font-bold text-[var(--edlink-blue-text)]/70 uppercase tracking-widest mb-1">Recent Avg Grade</p>
               <p className="text-xl font-bold text-[var(--edlink-green-brand)]">
                 {summary?.average_grade !== undefined ? `${summary.average_grade}%` : '—'}
               </p>
            </div>
         </div>
      </div>

      <div className="premium-card">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <button className="text-[var(--edlink-green-brand)] text-xs font-bold hover:text-teal-300 transition-all flex items-center gap-1">
               Detailed View <ChevronRight className="w-3 h-3" />
            </button>
         </div>
         <div className="space-y-4">
            <div className="p-6 text-center text-xs text-[var(--edlink-blue-text)]/50">
               No recent activity available.
            </div>
         </div>
      </div>
    </div>
  )
}
