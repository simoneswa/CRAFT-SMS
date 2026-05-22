"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useState, useEffect, useCallback } from 'react'
import { 
  Calendar, 
  Users, 
  Check, 
  X, 
  Clock, 
  History, 
  Save, 
  ChevronRight,
  Filter,
  AlertCircle
} from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/utils/supabase'
import { fetchAPI } from '@/lib/api'
import { SyncEngine } from '@/lib/syncEngine'
import { generatePDFFromElement } from '@/lib/pdfGenerator'

import { motion, AnimatePresence } from 'framer-motion'

export default function AttendancePage() {
  const { school } = useTenant()
  const { profile } = useAuth()
  
  const [classes, setClasses] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  
  const [students, setStudents] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({}) // studentId -> status
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [historyStats, setHistoryStats] = useState({ avgPresence: 0, chronicAbsentees: 0, daysTracked: 0 })
  const [historyRows, setHistoryRows] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [view, setView] = useState<'ROLL_CALL' | 'HISTORY'>('ROLL_CALL')

  useEffect(() => {
    if (school?.id) {
      loadClasses()
    }
  }, [school])

  const loadClasses = async () => {
    try {
      const data = await fetchAPI('/academic/classes')
      setClasses(data)
      if (data.length > 0) setSelectedClass(data[0].id)
    } catch (err) {
      console.error('Failed to load classes:', err)
    }
  }

const loadRollCall = useCallback(async () => {
    if (!selectedClass || !attendanceDate) return
    setIsLoading(true)

    const supabase = createClient()

    try {
      // 1. Get enrolled students for current active term
      const { data: termData } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('school_id', school?.id)
        .eq('is_current', true)
        .single()

      if (!termData) throw new Error("No current academic term set.")

      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('profiles!student_id(id, full_name, custom_id)')
        .eq('class_id', selectedClass)
        .eq('academic_term_id', termData.id)
        .eq('school_id', school?.id)

      const studentList =
        (enrollmentData?.map((e: any) =>
          Array.isArray(e.profiles) ? e.profiles[0] : e.profiles
        ).filter(Boolean) as any[]) || []

      setStudents(studentList)

      // 2. Get existing attendance for this date/class
      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('school_id', school?.id)
        .eq('date', attendanceDate)
        .in('student_id', studentList.map((s: any) => s.id))

      const attMap: Record<string, string> = {}
      attData?.forEach((a: any) => {
        attMap[a.student_id] = a.status
      })
      setAttendance(attMap)
    } catch (err) {
      console.error('Failed to load roll call:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedClass, attendanceDate, school])


  useEffect(() => {
    if (view === 'ROLL_CALL') loadRollCall()
    if (view === 'HISTORY') loadHistory()
  }, [loadRollCall, view, selectedClass])

  // Load aggregate history stats when switching to HISTORY view
  const loadHistory = async () => {
    if (!school?.id || !selectedClass) return
    setIsLoadingHistory(true)
    const supabase = createClient()
    try {
      const { data } = await supabase
        .from('attendance')
        .select('student_id, status, profiles!student_id(full_name, custom_id)')
        .eq('school_id', school.id)
      
      const rows: Record<string, any> = {}
      ;(data || []).forEach((r: any) => {
        const id = r.student_id
        const name = Array.isArray(r.profiles) ? r.profiles[0]?.full_name : r.profiles?.full_name
        const customId = Array.isArray(r.profiles) ? r.profiles[0]?.custom_id : r.profiles?.custom_id
        if (!rows[id]) rows[id] = { name, customId, present: 0, late: 0, absent: 0, excused: 0 }
        if (r.status === 'PRESENT') rows[id].present++
        else if (r.status === 'LATE') rows[id].late++
        else if (r.status === 'ABSENT') rows[id].absent++
        else if (r.status === 'EXCUSED') rows[id].excused++
      })

      const rowList = Object.values(rows)
      const totalDays = rowList.length > 0 ? Math.max(...rowList.map((r: any) => r.present + r.late + r.absent + r.excused)) : 0
      const avgPct = rowList.length > 0 ? rowList.reduce((acc: number, r: any) => {
        const total = r.present + r.late + r.absent + r.excused
        return acc + (total > 0 ? (r.present / total) * 100 : 0)
      }, 0) / rowList.length : 0
      const chronic = rowList.filter((r: any) => {
        const total = r.present + r.late + r.absent + r.excused
        return total > 0 && r.absent / total > 0.2
      }).length

      setHistoryRows(rowList.map((r: any) => ({
        ...r,
        pct: (() => {
          const total = r.present + r.late + r.absent + r.excused
          return total > 0 ? Math.round((r.present / total) * 100 * 10) / 10 : 0
        })(),
      })))
      setHistoryStats({ avgPresence: Math.round(avgPct * 10) / 10, chronicAbsentees: chronic, daysTracked: totalDays })
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleExportPdf = async () => {
    setIsExportingPdf(true)
    try {
      await generatePDFFromElement('attendance-history-table', `Attendance-Report-${selectedClass}`)
    } finally {
      setIsExportingPdf(false)
    }
  }

  const markAttendance = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }))
  }

  const submitAttendance = async () => {
    setIsSaving(true)

    const entries = Object.entries(attendance).map(([studentId, status]) => ({
      school_id: school?.id,
      student_id: studentId,
      date: attendanceDate,
      status,
      recorded_by: profile?.id,
    }))

    // Offline-first: queue to IndexedDB if no connection
    if (!navigator.onLine) {
      try {
        await SyncEngine.queueRequest('/academic/attendance/batch', 'POST', { entries })
        alert(`Offline — ${entries.length} attendance record(s) queued and will sync automatically when reconnected.`)
      } catch (queueErr: any) {
        alert('Failed to queue attendance for offline sync: ' + queueErr.message)
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Online path: direct Supabase upsert
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert(entries, { onConflict: 'school_id,student_id,date' })

      if (error) throw error
      alert('Attendance saved successfully.')
    } catch (err: any) {
      // Network failure despite onLine flag — fall back to queue
      if (err.message?.toLowerCase().includes('fetch') || err.message?.toLowerCase().includes('network')) {
        await SyncEngine.queueRequest('/academic/attendance/batch', 'POST', { entries })
        alert(`Network error — attendance queued for automatic sync.`)
      } else {
        alert(err.message || 'Failed to save attendance.')
      }
    } finally {
      setIsSaving(false)
    }
  }


  const stats = {
    present: Object.values(attendance).filter(s => s === 'PRESENT').length,
    absent: Object.values(attendance).filter(s => s === 'ABSENT').length,
    late: Object.values(attendance).filter(s => s === 'LATE').length,
    excused: Object.values(attendance).filter(s => s === 'EXCUSED').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Student <span className="gradient-text">Attendance</span></h1>
            <p className="text-gray-400">High-efficiency roll call and historical tracking.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setView('ROLL_CALL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'ROLL_CALL' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              Daily Roll Call
            </button>
            <button 
              onClick={() => setView('HISTORY')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'HISTORY' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              History
            </button>
          </div>
        </header>

        {view === 'ROLL_CALL' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Roll Call Area */}
            <div className="lg:col-span-3 space-y-6">
              <div className="premium-card flex flex-wrap items-center gap-6 p-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="section-label mb-2 block">Select Class</label>
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 text-white cursor-pointer"
                  >
                    {classes.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="section-label mb-2 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="date" 
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-teal-500/50 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="premium-card">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No students enrolled in this class.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between py-4 group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-400">
                            {student.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{student.full_name}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{student.custom_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                          {[
                            {
                          id: 'PRESENT',
                          label: 'P',
                          activeClass: 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                           },
                            { id: 'LATE', label: 'L', activeClass: 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' },
                            { id: 'ABSENT', label: 'A', activeClass: 'bg-rose-500 text-black shadow-lg shadow-rose-500/20' },
                            { id: 'EXCUSED', label: 'E', activeClass: 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => markAttendance(student.id, opt.id)}
                              className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${
                                attendance[student.id] === opt.id 
                                  ? opt.activeClass 
                                  : 'text-gray-500 hover:text-white'
                              }`}
                              title={opt.id}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
              <div className="premium-card">
                 <h4 className="font-bold text-sm mb-6 text-white flex items-center gap-2">
                   <History className="w-4 h-4 text-teal-400" />
                   Quick Summary
                 </h4>
                 <div className="space-y-4">
                    {[
                      { label: 'Present', val: stats.present, color: 'emerald' },
                      { label: 'Late', val: stats.late, color: 'amber' },
                      { label: 'Absent', val: stats.absent, color: 'rose' },
                      { label: 'Excused', val: stats.excused, color: 'blue' },
                    ].map(s => (
                      <div key={s.label} className="flex justify-between items-center text-xs">
                         <span className="text-gray-400">{s.label}</span>
                         <span className={`text-${s.color}-400 font-bold bg-${s.color}-500/10 px-2 py-0.5 rounded-md`}>{s.val}</span>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase mb-2">
                          <span>Completion</span>
                          <span>{students.length > 0 ? Math.round((Object.keys(attendance).length / students.length) * 100) : 0}%</span>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${students.length > 0 ? (Object.keys(attendance).length / students.length) * 100 : 0}%` }}
                            className="h-full bg-teal-500 rounded-full" 
                          />
                       </div>
                    </div>
                 </div>
              </div>
              
              <button 
                onClick={submitAttendance}
                disabled={isSaving || students.length === 0}
                className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-2xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Finalize Attendance'}
              </button>
              
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                 <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                       <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Attention</p>
                       <p className="text-[11px] text-amber-500/80 leading-relaxed">
                         Finalizing attendance will trigger parent notifications for students marked Absent or Late.
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="premium-card flex flex-wrap items-center gap-6 p-4">
              <div className="flex-1 min-w-[200px]">
                <label className="section-label mb-2 block">Class</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 text-white cursor-pointer"
                >
                  {classes.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>)}
                </select>
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="premium-card bg-emerald-500/5 border-emerald-500/10">
                  <p className="section-label text-emerald-400 mb-1">Average Presence</p>
                  <h3 className="text-3xl font-bold text-white">{isLoadingHistory ? '…' : `${historyStats.avgPresence}%`}</h3>
               </div>
               <div className="premium-card bg-rose-500/5 border-rose-500/10">
                  <p className="section-label text-rose-400 mb-1">Chronic Absentees</p>
                  <h3 className="text-3xl font-bold text-white">{isLoadingHistory ? '…' : historyStats.chronicAbsentees}</h3>
               </div>
               <div className="premium-card bg-blue-500/5 border-blue-500/10">
                  <p className="section-label text-blue-400 mb-1">Days Tracked</p>
                  <h3 className="text-3xl font-bold text-white">{isLoadingHistory ? '…' : historyStats.daysTracked}</h3>
               </div>
             </div>

            <div className="premium-card overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-white">Student Attendance Ranking</h3>
                  <button
                    onClick={handleExportPdf}
                    disabled={isExportingPdf}
                    className="text-xs font-bold text-teal-400 hover:underline disabled:opacity-50"
                  >
                    {isExportingPdf ? 'Generating...' : 'Export Report (PDF)'}
                  </button>
               </div>
               <div className="overflow-x-auto custom-scrollbar" id="attendance-history-table">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-4 section-label">Student</th>
                        <th className="p-4 section-label text-center">Days Present</th>
                        <th className="p-4 section-label text-center">Late</th>
                        <th className="p-4 section-label text-center">Absent</th>
                        <th className="p-4 section-label text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody>
                     {isLoadingHistory ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading history...</td></tr>
                     ) : historyRows.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-gray-500">No attendance records found.</td></tr>
                     ) : historyRows.map((s: any, i: number) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4">
                             <p className="font-bold text-sm text-white">{s.name || 'Unknown'}</p>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{s.customId || `STU_00${i+1}`}</p>
                          </td>
                          <td className="p-4 text-center text-sm font-bold text-gray-300">{s.present}</td>
                          <td className="p-4 text-center text-sm font-bold text-amber-400">{s.late}</td>
                          <td className="p-4 text-center text-sm font-bold text-rose-400">{s.absent}</td>
                          <td className="p-4 text-right">
                             <div className="flex flex-col items-end">
                                <span className={`text-sm font-black ${s.pct >= 90 ? 'text-emerald-400' : s.pct >= 80 ? 'text-amber-400' : 'text-rose-400'}`}>
                                  {s.pct}%
                                </span>
                                <div className="w-20 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                   <div className={`h-full ${s.pct >= 90 ? 'bg-emerald-500' : s.pct >= 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${s.pct}%` }} />
                                </div>
                             </div>
                          </td>
                        </tr>
                     ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

