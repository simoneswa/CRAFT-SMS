"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home, MessageSquare, Compass, Bell, ChevronDown,
  Search, Calendar, User, Clock, CheckSquare, BookOpen,
  FileText, Link as LinkIcon
} from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useTenant } from '../../providers/TenantProvider'
import { CraftLogo } from '../ui/CraftLogo'
import { fetchAPI } from '../../lib/api'

// NO HARDCODED ARRAYS — all data comes from fetchAPI

export default function StudentDashboard() {
  const params = useParams()
  const subdomain = params?.subdomain as string
  const { profile } = useAuth()
  const { school } = useTenant()

  const [activeTab, setActiveTab] = useState<'academic' | 'assignments'>('academic')
  const [searchQuery, setSearchQuery] = useState('')
  const [semester, setSemester] = useState('2025/2026 Even')

  // ── REAL STATE VARIABLES ──────────────────────────────────────────
  const [courses, setCourses] = useState<any[]>([])
  const [todoItems, setTodoItems] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Submission modal state
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const todayIndex = new Date().getDay()

  // ── REAL DATA FETCHING ────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    async function loadStudentData() {
      if (!profile?.id) {
        if (isMounted) setIsLoading(false)
        return
      }
      setIsLoading(true)

      try {
        // 1. Fetch grades → derive enrolled courses
        const gradesRes = await fetchAPI(`/academic/grades/student/${profile.id}`).catch(() => [])

        let uniqueClasses: any[] = []
        if (Array.isArray(gradesRes)) {
          const seen = new Map<string, any>()
          for (const grade of gradesRes) {
            const classId = grade.class_subject_id ?? 'unknown'
            const subjectName = grade.class_subjects?.subjects?.name ?? 'Unknown Subject'
            if (!seen.has(subjectName)) {
              seen.set(subjectName, {
                class_id: classId,
                name: subjectName,
                instructor: 'Assigned Instructor',
                department: 'General',
              })
            }
          }
          uniqueClasses = Array.from(seen.values())
          if (isMounted) setCourses(uniqueClasses)
        }

        // 2. Fetch assignments for every enrolled class
        let allAssignments: any[] = []
        for (const cls of uniqueClasses) {
          if (cls.class_id !== 'unknown') {
            const res = await fetchAPI(`/academic/classes/${cls.class_id}/assignments`).catch(() => [])
            if (Array.isArray(res)) {
              allAssignments = [...allAssignments, ...res.map((a: any) => ({ ...a, subject_name: cls.name }))]
            }
          }
        }
        if (isMounted) setAssignments(allAssignments)

        // 3. Fetch notifications → todo items
        const notifRes = await fetchAPI('/notifications').catch(() => [])
        if (Array.isArray(notifRes) && isMounted) {
          setTodoItems(notifRes.filter((n: any) => n.type === 'ACADEMIC'))
        }
      } catch (err) {
        console.error('[StudentDashboard] loadStudentData error:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadStudentData()
    return () => { isMounted = false }
  }, [profile?.id])

  // ── FILTERED COURSES ──────────────────────────────────────────────
  const filteredCourses = courses.filter(c =>
    c?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c?.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // ── WEEK DAY STRIP (computed, not hardcoded) ──────────────────────
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + idx)
    return {
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx],
      num: d.getDate().toString(),
    }
  })

  // ── SUBMISSION HANDLER ────────────────────────────────────────────
  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssignment) return
    setIsSubmitting(true)
    try {
      await fetchAPI(`/academic/assignments/${selectedAssignment.id}/submissions`, {
        method: 'POST',
        body: JSON.stringify({ submission_url: submissionUrl, submission_text: submissionText }),
      })
      alert('Assignment submitted successfully!')
      setSelectedAssignment(null)
      setSubmissionUrl('')
      setSubmissionText('')
    } catch (err) {
      console.error(err)
      alert('Failed to submit assignment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-[var(--edlink-blue-text)] font-sans">

      {/* NAV */}
      <nav className="bg-[var(--edlink-green-brand)] text-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CraftLogo className="h-8 w-auto invert" />
            <div className="border-l border-white/30 pl-2 text-xs text-emerald-100">
              <p className="font-bold">{school?.name ?? 'School'}</p>
              <p className="text-[10px] opacity-80">Student Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1 font-medium text-sm">
            <Link href={`/${subdomain}/dashboard`}>
              <button className="flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-md">
                <Home size={16} /> <span>Home</span>
              </button>
            </Link>
            <Link href={`/${subdomain}/dashboard/messages`}>
              <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
                <MessageSquare size={16} /> <span>Chat</span>
              </button>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer p-1.5 hover:bg-white/10 rounded-full">
            <Bell size={20} />
            {todoItems.length > 0 && (
              <span className="absolute top-1 right-1 bg-amber-500 text-[10px] font-bold px-1 rounded-full">
                {todoItems.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 border-l border-white/20 pl-4">
            <div className="w-8 h-8 rounded-full bg-emerald-700 border border-white flex items-center justify-center text-white font-bold text-xs">
              {(profile?.full_name ?? 'S')[0]}
            </div>
            <div className="hidden sm:block text-xs">
              <p className="font-bold leading-tight">{profile?.full_name ?? 'STUDENT'}</p>
              <p className="text-[10px] opacity-70">Student</p>
            </div>
            <ChevronDown size={14} className="opacity-80" />
          </div>
        </div>
      </nav>

      {/* LAYOUT */}
      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">

          {/* Week strip */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">This Week</h3>
              <span className="text-[11px] text-slate-400">Today</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-4 text-xs border-b border-slate-100 pb-3">
              {weekDays.map(({ day, num }, i) => (
                <div key={i} className={`p-1 ${i === todayIndex ? 'bg-[var(--edlink-green-brand)]/10 rounded-md border border-[var(--edlink-divider-blue)]' : ''}`}>
                  <p className={`text-[10px] ${i === todayIndex ? 'text-[var(--edlink-green-brand)] font-bold' : 'text-slate-400'}`}>{day}</p>
                  <p className={`mt-0.5 ${i === todayIndex ? 'font-black text-[var(--edlink-green-brand)]' : 'font-semibold text-[var(--edlink-blue-text)]'}`}>{num}</p>
                </div>
              ))}
            </div>
            <div className="py-6 flex flex-col items-center text-center">
              <Calendar size={24} className="text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">No classes scheduled today.</p>
            </div>
          </div>

          {/* Todo list */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm mb-4">To-Do</h3>
            {todoItems.length > 0 ? (
              <div className="space-y-3">
                {todoItems.map((item: any, i) => (
                  <div key={i} className="text-xs p-2 hover:bg-slate-50 rounded-lg">
                    <p className="font-bold text-[var(--edlink-blue-text)]">{item.title}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">{item.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckSquare size={24} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-xs text-slate-400">All caught up!</p>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN */}
        <main className="lg:col-span-9 space-y-6">

          {/* Tabs */}
          <div className="border-b border-slate-200 flex items-center justify-between">
            <div className="flex space-x-6 text-sm font-semibold">
              <button
                className={`pb-2 px-1 ${activeTab === 'academic' ? 'text-[var(--edlink-green-brand)] border-b-2 border-[var(--edlink-green-brand)]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('academic')}
              >
                Academic Classes
              </button>
              <button
                className={`pb-2 px-1 ${activeTab === 'assignments' ? 'text-[var(--edlink-green-brand)] border-b-2 border-[var(--edlink-green-brand)]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('assignments')}
              >
                Assignments
                {assignments.length > 0 && (
                  <span className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {assignments.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'academic' && (
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search courses..."
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[var(--edlink-green-brand)]"
                  />
                </div>
                <div className="relative">
                  <select
                    value={semester}
                    onChange={e => setSemester(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-xs focus:outline-none"
                  >
                    <option>2025/2026 Even</option>
                    <option>2025/2026 Odd</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={12} />
                </div>
              </div>
            )}
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-4 border-[var(--edlink-green-brand)]/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-slate-400">Loading your academic data...</p>
            </div>

          /* Academic tab */
          ) : activeTab === 'academic' ? (
            filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCourses.map((course: any, i: number) => (
                  <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-[var(--edlink-blue-text)] text-sm">{course.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">{course.department}</p>
                    <div className="flex items-center space-x-2 mt-4 text-xs text-[var(--edlink-blue-text)]/70">
                      <User size={13} className="text-slate-400" />
                      <span>{course.instructor}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
                <Search size={28} className="mx-auto mb-3 opacity-40" />
                <p>{searchQuery ? 'No courses match your search.' : 'No courses assigned yet.'}</p>
              </div>
            )

          /* Assignments tab */
          ) : (
            <div className="space-y-4">
              {assignments.length > 0 ? assignments.map((a: any, i: number) => (
                <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      <h3 className="font-bold text-[var(--edlink-blue-text)]">{a.title}</h3>
                      <p className="text-xs text-[var(--edlink-blue-text)]/70 mt-0.5">{a.subject_name}</p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{a.description}</p>
                      {a.attachment_url && (
                        <a
                          href={a.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-500 text-xs mt-2 hover:underline"
                        >
                          <FileText size={12} />
                          <span>View Attachment</span>
                        </a>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-rose-500 font-bold mb-3">
                        Due: {new Date(a.deadline).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => setSelectedAssignment(a)}
                        className="bg-[var(--edlink-green-brand)] hover:bg-[var(--edlink-green-hover)] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Submit Work
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
                  <FileText size={28} className="mx-auto mb-3 opacity-40" />
                  <p>No active assignments at the moment.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* SUBMISSION MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-1">Submit Assignment</h3>
            <p className="text-xs text-[var(--edlink-blue-text)]/70 mb-5">{selectedAssignment.title}</p>

            <form onSubmit={handleSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Submission URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={e => setSubmissionUrl(e.target.value)}
                    placeholder="https://docs.google.com/..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Or Text Answer</label>
                <textarea
                  value={submissionText}
                  onChange={e => setSubmissionText(e.target.value)}
                  rows={4}
                  placeholder="Type your answer here..."
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-white bg-[var(--edlink-green-brand)] hover:bg-[var(--edlink-green-hover)] rounded-lg font-bold disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting…' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
