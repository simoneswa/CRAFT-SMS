"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home, MessageSquare, Compass, Bell, ChevronDown,
  Search, Calendar, User, Clock, CheckSquare, BookOpen,
  Eye, GraduationCap, FileText, Upload, Link as LinkIcon
} from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useTenant } from '../../providers/TenantProvider'
import { CraftLogo } from '../ui/CraftLogo'
import { fetchAPI } from '../../lib/api'

export default function StudentDashboard() {
  const params = useParams()
  const subdomain = params?.subdomain as string
  const { profile } = useAuth()
  const { school } = useTenant()
  const [activeTab, setActiveTab] = useState<'academic' | 'assignments'>('academic')
  const [searchQuery, setSearchQuery] = useState('')

  // Real data state
  const [courses, setCourses] = useState<any[]>([])
  const [todoItems, setTodoItems] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Submission State
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [submissionText, setSubmissionText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const todayIndex = new Date().getDay()

  useEffect(() => {
    let isMounted = true

    async function loadStudentData() {
      if (!profile?.id) return
      setIsLoading(true)
      try {
        // Fetch grades to extract enrolled courses
        const gradesRes = await fetchAPI(`/academic/grades/student/${profile.id}`).catch(() => [])
        
        let uniqueClasses: any[] = []
        if (gradesRes && Array.isArray(gradesRes)) {
          const uniqueSubjects = new Map()
          gradesRes.forEach((grade: any) => {
            const classId = grade.class_subject_id || 'unknown'
            const subjectName = grade.class_subjects?.subjects?.name || 'Unknown Subject'
            if (!uniqueSubjects.has(subjectName)) {
              uniqueSubjects.set(subjectName, {
                class_id: classId,
                name: subjectName,
                department: 'General',
                instructor: 'Assigned Instructor',
                time: 'TBA',
                attendance: 0,
                totalSessions: 0,
                tags: []
              })
            }
          })
          uniqueClasses = Array.from(uniqueSubjects.values())
          setCourses(uniqueClasses)
        }

        // Fetch assignments for all classes
        let allAssignments: any[] = []
        for (const cls of uniqueClasses) {
            if (cls.class_id !== 'unknown') {
                const classAssignments = await fetchAPI(`/academic/classes/${cls.class_id}/assignments`).catch(() => [])
                if (Array.isArray(classAssignments)) {
                    allAssignments = [...allAssignments, ...classAssignments.map(a => ({ ...a, subject_name: cls.name }))]
                }
            }
        }
        setAssignments(allAssignments)

        const notificationsRes = await fetchAPI(`/notifications`).catch(() => [])
        if (notificationsRes && Array.isArray(notificationsRes)) {
          const mappedTodos = notificationsRes
            .filter((n: any) => n.type === 'ACADEMIC')
            .map((n: any) => ({
              icon: BookOpen,
              iconBg: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
              title: n.title,
              course: n.message,
              deadline: n.created_at
            }))
          setTodoItems(mappedTodos)
        }

      } catch (error) {
        console.error("Failed to load student data", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadStudentData()

    return () => {
      isMounted = false
    }
  }, [profile?.id])

  const handleSubmission = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!selectedAssignment) return
      setIsSubmitting(true)
      try {
          await fetchAPI(`/academic/assignments/${selectedAssignment.id}/submissions`, {
              method: 'POST',
              body: JSON.stringify({
                  submission_url: submissionUrl,
                  submission_text: submissionText
              })
          })
          alert("Assignment submitted successfully!")
          setSelectedAssignment(null)
          setSubmissionUrl('')
          setSubmissionText('')
      } catch (error) {
          console.error(error)
          alert("Failed to submit assignment.")
      } finally {
          setIsSubmitting(false)
      }
  }

  const weekDays = [
    { day: 'Sun', num: '0' },
    { day: 'Mon', num: '0' },
    { day: 'Tue', num: '0' },
    { day: 'Wed', num: '0' },
    { day: 'Thu', num: '0' },
    { day: 'Fri', num: '0' },
    { day: 'Sat', num: '0' },
  ].map((d, idx) => {
    const date = new Date()
    date.setDate(date.getDate() - date.getDay() + idx)
    return { day: d.day, num: date.getDate().toString() }
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans">
      <nav className="bg-[#10b981] text-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CraftLogo className="h-8 w-auto invert" />
            <div className="border-l border-white/30 pl-2 text-xs text-emerald-100">
              <p className="font-bold">{school?.name || 'School'}</p>
              <p className="text-[10px] opacity-80">Student Portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer p-1.5 hover:bg-white/10 rounded-full">
            <Bell size={20} />
            {todoItems.length > 0 && (
               <span className="absolute top-1 right-1 bg-amber-500 text-[10px] font-bold px-1 rounded-full text-white">{todoItems.length}</span>
            )}
          </div>
          <div className="flex items-center space-x-2 border-l border-white/20 pl-4 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-700 overflow-hidden border border-white flex items-center justify-center text-white font-bold text-xs">
              {(profile?.full_name || 'S')[0]}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold leading-tight">{profile?.full_name || 'STUDENT'}</p>
              <p className="text-[10px] opacity-70">Student</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">This Week&apos;s Schedule</h3>
              <span className="text-[11px] text-slate-400 font-medium">Today</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-6 text-xs border-b border-slate-100 pb-3">
              {weekDays.map(({ day, num }, i) => (
                <div key={i} className={`p-1 ${i === todayIndex ? 'bg-emerald-50 rounded-md border border-emerald-200' : ''}`}>
                  <p className={`text-[10px] ${i === todayIndex ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>{day}</p>
                  <p className={`mt-0.5 ${i === todayIndex ? 'font-black text-emerald-600' : 'font-semibold text-slate-700'}`}>{num}</p>
                </div>
              ))}
            </div>

            {schedule.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                    <Calendar size={28} className="text-slate-300 mb-2" />
                    <p className="text-xs text-slate-400 max-w-[180px]">No classes scheduled for today.</p>
                </div>
            ) : null}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm mb-4">Todo List</h3>
            {todoItems.length > 0 ? (
                <div className="space-y-4">
                {todoItems.map((item, i) => (
                    <div key={i} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer text-xs">
                        <div>
                            <h4 className="font-bold text-slate-800">{item.title}</h4>
                            <p className="text-slate-400 text-[11px] font-medium">{item.course}</p>
                        </div>
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

        <main className="lg:col-span-9 space-y-6">
          <div className="border-b border-slate-200 flex space-x-6 text-sm font-semibold">
            <button
              className={`pb-2 px-1 ${activeTab === 'academic' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('academic')}
            >
              Academic Classes
            </button>
            <button
              className={`pb-2 px-1 ${activeTab === 'assignments' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('assignments')}
            >
              Assignments
            </button>
          </div>

          {isLoading ? (
             <div className="py-20 text-center">
                 <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-sm text-slate-400">Loading your data...</p>
             </div>
          ) : activeTab === 'academic' ? (
             courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-slate-800 text-sm">{course.name}</h3>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-6 mt-4">
                          <div className="flex items-center space-x-2">
                            <User size={13} className="text-slate-400" />
                            <span>{course.instructor}</span>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
             ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 text-sm">
                  <Search size={28} className="mx-auto mb-3 opacity-40" />
                  <p>No courses assigned for you yet.</p>
                </div>
             )
          ) : (
             <div className="space-y-4">
                {assignments.length > 0 ? assignments.map((a, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800">{a.title}</h3>
                                <p className="text-xs text-slate-500">{a.subject_name}</p>
                                <p className="text-xs text-slate-600 mt-2">{a.description}</p>
                                {a.attachment_url && (
                                    <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center mt-2 hover:underline">
                                        <FileText size={12} className="mr-1" /> View Attachment
                                    </a>
                                )}
                            </div>
                            <div className="text-right text-xs">
                                <p className="text-rose-500 font-bold mb-2">Due: {new Date(a.deadline).toLocaleDateString()}</p>
                                <button onClick={() => setSelectedAssignment(a)} className="bg-emerald-500 text-white px-4 py-2 rounded font-bold hover:bg-emerald-600">
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

          {/* Submission Modal */}
          {selectedAssignment && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                      <h3 className="font-bold text-lg mb-1">Submit Assignment</h3>
                      <p className="text-xs text-slate-500 mb-4">{selectedAssignment.title}</p>
                      
                      <form onSubmit={handleSubmission} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Submission URL</label>
                              <div className="relative">
                                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                  <input 
                                      type="url" 
                                      value={submissionUrl}
                                      onChange={e => setSubmissionUrl(e.target.value)}
                                      placeholder="https://docs.google.com/..."
                                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500" 
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Or Text Answer</label>
                              <textarea 
                                  value={submissionText}
                                  onChange={e => setSubmissionText(e.target.value)}
                                  rows={4}
                                  placeholder="Type your answer here..."
                                  className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:border-emerald-500"
                              />
                          </div>
                          <div className="flex justify-end space-x-3 mt-6">
                              <button type="button" onClick={() => setSelectedAssignment(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">
                                  Cancel
                              </button>
                              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded font-bold">
                                  {isSubmitting ? 'Submitting...' : 'Confirm Submission'}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}
        </main>
      </div>
    </div>
  )
}
