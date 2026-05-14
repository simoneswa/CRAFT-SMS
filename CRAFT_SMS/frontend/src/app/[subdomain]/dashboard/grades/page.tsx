"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Search, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  BookOpen
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useTenant } from '@/providers/TenantProvider'
import { supabase } from '@/lib/supabase'
import { fetchAPI } from '@/lib/api'
import { SyncEngine } from '@/lib/syncEngine'

export default function GradebookPage() {
  const { profile } = useAuth()
  const { school } = useTenant()
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [subject, setSubject] = useState('Mathematics')
  const [term, setTerm] = useState('First Term')
  const [grades, setGrades] = useState<Record<string, string>>({})
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const subjects = ['Mathematics', 'Science', 'English Literature', 'History', 'Physical Education']
  const terms = ['First Term', 'Second Term', 'Third Term', 'Final Exam']

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      // Fetch all students for this school
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, custom_id')
        .eq('school_id', school?.id)
        .eq('role', 'STUDENT')
        .order('full_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
      
      // Reset local grade states when fetching new students
      const initialGrades: Record<string, string> = {}
      data?.forEach(s => {
        initialGrades[s.id] = ''
      })
      setGrades(initialGrades)
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGradeChange = (studentId: string, value: string) => {
    // Only allow numbers and decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
       setGrades(prev => ({ ...prev, [studentId]: value }))
    }
  }

  const handleSaveGrades = async () => {
    setIsSubmitting(true)
    setMessage(null)
    
    // Filter out empty grades
    const gradesToSubmit = Object.entries(grades)
      .filter(([_, score]) => score.trim() !== '')
      .map(([student_id, score]) => ({
        student_id,
        subject,
        term,
        score: parseFloat(score),
        max_score: 100.0
      }))

    if (gradesToSubmit.length === 0) {
      setMessage({ type: 'error', text: 'No grades entered to save.' })
      setIsSubmitting(false)
      return
    }

    try {
      await SyncEngine.queueRequest('/grades/batch', 'POST', { grades: gradesToSubmit });
      
      if (!navigator.onLine) {
        setMessage({ type: 'success', text: `Offline mode: ${gradesToSubmit.length} grades queued for sync.` })
      } else {
        setMessage({ type: 'success', text: `Successfully saved ${gradesToSubmit.length} grades.` })
      }
      
      // Clear inputs after success
      const clearedGrades: Record<string, string> = {}
      students.forEach(s => {
        clearedGrades[s.id] = ''
      })
      setGrades(clearedGrades)
      
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save grades.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (profile?.role !== 'TEACHER' && profile?.role !== 'SCHOOL_ADMIN') {
    return (
      <div className="flex items-center justify-center py-32 text-gray-500">
        You do not have permission to access the Gradebook.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Teacher's <span className="gradient-text">Gradebook</span></h1>
          <p className="text-gray-400">Record and manage academic performance for your classes.</p>
        </div>
        <button 
          onClick={handleSaveGrades}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
        >
          {isSubmitting ? <span className="animate-pulse">Saving...</span> : <><Save className="w-5 h-5" /> Save Grades</>}
        </button>
      </header>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Control Panel */}
      <div className="premium-card grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
             <BookOpen className="w-4 h-4 text-teal-400" /> Subject
           </label>
           <div className="relative">
              <select 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-colors appearance-none"
              >
                {subjects.map(s => <option key={s} value={s} className="bg-[#030712]">{s}</option>)}
              </select>
           </div>
        </div>
        <div>
           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
             <GraduationCap className="w-4 h-4 text-blue-400" /> Academic Term
           </label>
           <div className="relative">
              <select 
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-colors appearance-none"
              >
                {terms.map(t => <option key={t} value={t} className="bg-[#030712]">{t}</option>)}
              </select>
           </div>
        </div>
      </div>

      {/* Roster & Grade Input */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-xl font-bold flex items-center gap-2">Class Roster</h3>
           <div className="relative hidden md:block">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
             <input type="text" placeholder="Search students..." className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-teal-500/50 w-64" />
           </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
             <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
             No students enrolled in this school yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Student ID</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Score (out of 100)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded-full bg-white/5 text-xs font-bold text-gray-400">
                        {student.custom_id || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium">{student.full_name}</td>
                    <td className="py-4 px-4 text-right">
                      <input 
                        type="text" 
                        value={grades[student.id] || ''}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                        placeholder="--"
                        className="w-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-right font-bold text-teal-400 focus:outline-none focus:border-teal-500/50 transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
