"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useState, useEffect, useCallback } from 'react'
import { 
  BookOpen, 
  Search, 
  Filter, 
  Save, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Lock,
  Unlock
} from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'
import { fetchAPI } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'

export default function GradebookPage() {
  const { school } = useTenant()
  const { profile } = useAuth()
  
  // Selection State
  const [terms, setTerms] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  
  // Data State
  const [students, setStudents] = useState<any[]>([])
  const [grades, setGrades] = useState<Record<string, any>>({}) // studentId_categoryId -> grade
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (school?.id) {
      loadInitialData()
    }
  }, [school])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      const [termsData, subjectsData, classesData, categoriesData] = await Promise.all([
        fetchAPI('/academic/terms'),
        fetchAPI('/academic/subjects'),
        fetchAPI('/academic/classes'),
        fetchAPI('/academic/grade-categories')
      ])
      
      setTerms(termsData)
      setSubjects(subjectsData)
      setClasses(classesData)
      setCategories(categoriesData)
      
      // Auto-select current term
      const current = termsData.find((t: any) => t.is_current)
      if (current) setSelectedTerm(current.id)
      
    } catch (err) {
      console.error('Failed to load gradebook metadata:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadGrades = useCallback(async () => {
    if (!selectedTerm || !selectedClass || !selectedSubject) return
    setIsLoading(true)
    try {
      // 1. Get enrolled students
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('student_id, profiles!student_id(id, full_name, custom_id)')
        .eq('class_id', selectedClass)
        .eq('academic_term_id', selectedTerm)
        .eq('school_id', school?.id)

      const studentList = enrollmentData?.map(e => e.profiles) || []
      setStudents(studentList)

      // 2. Get existing grades for these students in this subject
      // First, get the class_subject_id
      const { data: csData } = await supabase
        .from('class_subjects')
        .select('id')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .single()

      if (csData) {
        const { data: gradeData } = await supabase
          .from('grades')
          .select('*')
          .eq('class_subject_id', csData.id)
          .eq('academic_term_id', selectedTerm)

        const gradeMap: Record<string, any> = {}
        gradeData?.forEach(g => {
          gradeMap[`${g.student_id}_${g.category_id}`] = g
        })
        setGrades(gradeMap)
      } else {
        setGrades({})
      }
    } catch (err) {
      console.error('Failed to load grades:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedTerm, selectedClass, selectedSubject, school])

  useEffect(() => {
    loadGrades()
  }, [loadGrades])

  const handleGradeChange = (studentId: string, categoryId: string, value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) && value !== '') return
    
    setGrades(prev => ({
      ...prev,
      [`${studentId}_${categoryId}`]: {
        ...(prev[`${studentId}_${categoryId}`] || {}),
        score: value === '' ? null : numValue,
        student_id: studentId,
        category_id: categoryId
      }
    }))
  }

  const saveGrades = async (status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') => {
    setIsSaving(true)
    setMessage(null)
    try {
      const csResp = await supabase
        .from('class_subjects')
        .select('id')
        .eq('class_id', selectedClass)
        .eq('subject_id', selectedSubject)
        .single()
        
      if (!csResp.data) throw new Error("Class-Subject assignment not found.")
      
      const entries = Object.entries(grades).map(([key, g]) => ({
        student_id: g.student_id,
        category_id: g.category_id,
        class_subject_id: csResp.data.id,
        academic_term_id: selectedTerm,
        school_id: school?.id,
        score: g.score,
        status: status,
        graded_by: profile?.id
      })).filter(e => e.score !== null)

      // Using upsert for simple reconciliation
      const { error } = await supabase
        .from('grades')
        .upsert(entries, { onConflict: 'student_id,class_subject_id,category_id,academic_term_id' })

      if (error) throw error
      
      setMessage({ type: 'success', text: `Grades ${status === 'PUBLISHED' ? 'published' : 'saved as draft'} successfully.` })
      loadGrades()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save grades.' })
    } finally {
      setIsSaving(false)
    }
  }

  const calculateStudentAvg = (studentId: string) => {
    let totalWeightedScore = 0
    let totalWeight = 0
    
    categories.forEach(cat => {
      const grade = grades[`${studentId}_${cat.id}`]
      if (grade && grade.score !== null) {
        totalWeightedScore += (grade.score / 100) * cat.weight
        totalWeight += cat.weight
      }
    })
    
    if (totalWeight === 0) return 0
    return (totalWeightedScore / totalWeight) * 100
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Academic <span className="gradient-text">Gradebook</span></h1>
            <p className="text-gray-400">Institutional grade management and performance tracking.</p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={() => saveGrades('DRAFT')}
               disabled={isSaving || students.length === 0}
               className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-50"
             >
                <Save className="w-4 h-4" />
                Save Draft
             </button>
             <button 
               onClick={() => saveGrades('PUBLISHED')}
               disabled={isSaving || students.length === 0}
               className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 text-black font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
             >
                <CheckCircle2 className="w-4 h-4" />
                Publish Grades
             </button>
          </div>
        </header>

        {/* Status Message */}
        <AnimatePresence>
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-2xl flex items-center gap-3 border ${
                message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-bold text-sm">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Bar */}
        <div className="premium-card grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          <div className="space-y-2">
            <label className="section-label flex items-center gap-2">
              <Lock className="w-3 h-3" />
              Academic Term
            </label>
            <select 
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select Term</option>
              {terms.map(t => <option key={t.id} value={t.id} className="bg-gray-900">{t.name} {t.is_current ? '(Current)' : ''}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="section-label flex items-center gap-2">
              <BookOpen className="w-3 h-3" />
              Class / Grade
            </label>
            <select 
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select Class</option>
              {classes.map(c => <option key={c.id} value={c.id} className="bg-gray-900">{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="section-label flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Subject
            </label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 text-white appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Gradebook Spreadsheet */}
        <div className="premium-card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-32">
              <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-32 text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p className="text-xl font-medium mb-2">Ready to grade?</p>
              <p className="text-sm">Select a term, class, and subject to begin entry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 section-label sticky left-0 bg-[#0a0f18] z-10 min-w-[250px]">Student Details</th>
                    {categories.map(cat => (
                      <th key={cat.id} className="p-4 section-label text-center min-w-[120px]">
                        <div className="flex flex-col items-center">
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-teal-400">{cat.weight}% Weight</span>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 section-label text-right min-w-[120px]">Overall Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 sticky left-0 bg-[#0a0f18] group-hover:bg-[#111827] z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-400">
                            {student.full_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{student.full_name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{student.custom_id}</p>
                          </div>
                        </div>
                      </td>
                      {categories.map(cat => (
                        <td key={cat.id} className="p-4">
                          <div className="relative">
                            <input 
                              type="number" 
                              max="100"
                              min="0"
                              value={grades[`${student.id}_${cat.id}`]?.score ?? ''}
                              onChange={(e) => handleGradeChange(student.id, cat.id, e.target.value)}
                              placeholder="—"
                              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 text-center text-sm font-bold focus:outline-none focus:border-teal-500/50 hover:bg-white/10 transition-all text-white"
                            />
                            {grades[`${student.id}_${cat.id}`]?.status === 'PUBLISHED' && (
                               <div className="absolute top-1 right-1">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                               </div>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                           <span className={`text-lg font-bold ${calculateStudentAvg(student.id) >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                             {calculateStudentAvg(student.id).toFixed(1)}%
                           </span>
                           <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Cumulative</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-gray-500 p-4">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 Published
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-gray-600" />
                 Draft
              </div>
           </div>
           <p>Last auto-saved: Just now</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

