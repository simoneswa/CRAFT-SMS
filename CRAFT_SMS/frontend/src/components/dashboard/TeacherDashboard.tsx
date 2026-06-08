"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home, MessageSquare, Compass, Bell, ChevronDown,
  Search, Calendar, Users, Clock, ClipboardCheck, BookOpen, Plus,
  FileText, CheckCircle2, Eye, Layers, Upload, Download
} from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useTenant } from '../../providers/TenantProvider'
import { CraftLogo } from '../ui/CraftLogo'
import { fetchAPI } from '../../lib/api'

// ─── Types ─────────────────────────────────────────────────────────────

interface LessonPlan {
  id: string
  topic: string
  sub_topic: string
  subject_name: string
  class_name: string
  week_number: number
  status: string
}

interface AssignedClass {
  id: string
  name: string
  department: string
  subject: string
  enrolled_students: number
  schedule: string
  room: string
}

interface Assignment {
  id: string
  title: string
  class_id: string
  description: string
  deadline: string
  attachment_url?: string
}

interface Submission {
  id: string
  student_id: string
  student_name: string
  submission_url: string
  submission_text: string
  status: string
  submitted_at: string
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const params = useParams()
  const subdomain = params?.subdomain as string
  const { profile } = useAuth()
  const { school } = useTenant()
  const [activeTab, setActiveTab] = useState<'lesson-plans' | 'classes' | 'assignments'>('lesson-plans')
  const [searchQuery, setSearchQuery] = useState('')

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Assignment Creation State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ class_id: '', title: '', description: '', deadline: '', attachment_url: '' })
  const [isCreating, setIsCreating] = useState(false)

  // Submissions Review State
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadInstructorData() {
      if (!profile?.id) return
      setIsLoading(true)
      try {
        const [plansRes, classesRes] = await Promise.all([
          fetchAPI('/lesson-plans/').catch(() => []),
          fetchAPI('/academic/classes/').catch(() => [])
        ])

        if (!isMounted) return

        if (Array.isArray(plansRes)) {
            setLessonPlans(plansRes.map((p: any) => ({
                id: p.id, topic: p.topic || 'Untitled Plan', sub_topic: p.sub_topic || '',
                subject_name: p.subject_name || 'Subject Pending', class_name: p.class_name || 'Class Pending',
                week_number: p.week_number || 1, status: p.status || 'draft'
            })))
        }

        let mappedClasses: any[] = []
        if (Array.isArray(classesRes)) {
            mappedClasses = classesRes.map((c: any) => ({
                id: c.id, name: c.name || 'Unnamed Class', department: c.grade_level || 'General',
                subject: 'Assigned Subject', enrolled_students: c.enrolled_count || 0,
                schedule: c.room_number ? `Room ${c.room_number}` : 'TBA', room: c.room_number || 'TBA'
            }))
            setAssignedClasses(mappedClasses)
        }

        let allAssignments: any[] = []
        for (const cls of mappedClasses) {
            const classAssignments = await fetchAPI(`/academic/classes/${cls.id}/assignments`).catch(() => [])
            if (Array.isArray(classAssignments)) {
                allAssignments = [...allAssignments, ...classAssignments]
            }
        }
        setAssignments(allAssignments)

      } catch (error) {
        console.error("Failed to load instructor data", error)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadInstructorData()
    return () => { isMounted = false }
  }, [profile?.id])

  const handleCreateAssignment = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsCreating(true)
      try {
          // Send request to Cloud Run backend
          const res = await fetchAPI(`/academic/classes/${newAssignment.class_id}/assignments`, {
              method: 'POST',
              body: JSON.stringify({
                  title: newAssignment.title,
                  description: newAssignment.description,
                  deadline: new Date(newAssignment.deadline).toISOString(),
                  attachment_url: newAssignment.attachment_url,
                  class_id: newAssignment.class_id
              })
          })
          setAssignments([res, ...assignments])
          setShowCreateModal(false)
          setNewAssignment({ class_id: '', title: '', description: '', deadline: '', attachment_url: '' })
          alert("Assignment created successfully!")
      } catch (error) {
          console.error(error)
          alert("Failed to create assignment.")
      } finally {
          setIsCreating(false)
      }
  }

  const loadSubmissions = async (assignment: Assignment) => {
      setViewingAssignment(assignment)
      setIsLoadingSubmissions(true)
      try {
          const res = await fetchAPI(`/academic/assignments/${assignment.id}/submissions`)
          if (Array.isArray(res)) {
              setSubmissions(res.map((s: any) => ({
                  id: s.id,
                  student_id: s.student_id,
                  student_name: s.student?.full_name || 'Unknown Student',
                  submission_url: s.submission_url,
                  submission_text: s.submission_text,
                  status: s.status,
                  submitted_at: s.submitted_at
              })))
          }
      } catch (e) {
          console.error(e)
      } finally {
          setIsLoadingSubmissions(false)
      }
  }

  const pendingGradingCount = assignments.length // Just a placeholder stat

  return (
    <div className="min-h-screen bg-slate-50 text-[var(--edlink-blue-text)] font-sans">
      <nav className="bg-[var(--edlink-green-brand)] text-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CraftLogo className="h-8 w-auto invert" />
            <div className="border-l border-white/30 pl-2 text-xs text-emerald-100">
              <p className="font-bold">{school?.name || 'School'}</p>
              <p className="text-[10px] opacity-80">Instructor Portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border-l border-white/20 pl-4 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-emerald-700 overflow-hidden border border-white flex items-center justify-center text-white font-bold text-xs">
              {(profile?.full_name || 'T')[0]}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-bold leading-tight">{profile?.full_name || 'INSTRUCTOR'}</p>
              <p className="text-[10px] opacity-70">Lecturer / Instructor</p>
            </div>
            <ChevronDown size={14} className="opacity-80" />
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm mb-4">My Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--edlink-green-brand)]/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-[var(--edlink-green-brand)]">{isLoading ? '-' : assignedClasses.length}</p>
                <p className="text-[10px] text-emerald-700 font-medium uppercase">Classes</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{isLoading ? '-' : assignments.length}</p>
                <p className="text-[10px] text-blue-700 font-medium uppercase">Assignments</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2 space-y-3 sm:space-y-0">
            <div className="flex space-x-6 text-sm font-semibold">
              <button
                className={`pb-2 px-1 flex items-center space-x-1.5 ${activeTab === 'lesson-plans' ? 'text-[var(--edlink-green-brand)] border-b-2 border-[var(--edlink-green-brand)]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('lesson-plans')}
              >
                <BookOpen size={15} /> <span>Lesson Plans</span>
              </button>
              <button
                className={`pb-2 px-1 flex items-center space-x-1.5 ${activeTab === 'classes' ? 'text-[var(--edlink-green-brand)] border-b-2 border-[var(--edlink-green-brand)]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('classes')}
              >
                <Layers size={15} /> <span>Assigned Classes</span>
              </button>
              <button
                className={`pb-2 px-1 flex items-center space-x-1.5 ${activeTab === 'assignments' ? 'text-[var(--edlink-green-brand)] border-b-2 border-[var(--edlink-green-brand)]' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('assignments')}
              >
                <FileText size={15} /> <span>Assignments</span>
              </button>
            </div>

            {activeTab === 'assignments' && (
              <button onClick={() => setShowCreateModal(true)} className="bg-[var(--edlink-green-brand)] hover:bg-[var(--edlink-green-hover)] text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors self-start sm:self-auto shadow-sm">
                <Plus size={14} /> <span>New Assignment</span>
              </button>
            )}
          </div>

          {isLoading ? (
             <div className="py-20 text-center">
                 <div className="w-8 h-8 border-4 border-[var(--edlink-green-brand)]/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                 <p className="text-sm text-slate-400">Loading your instructor dashboard...</p>
             </div>
          ) : (
            <>
              {activeTab === 'lesson-plans' && (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                    <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
                    <h4 className="text-sm font-bold text-slate-600 mb-1">Lesson Plans Active</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">Plans are dynamically loaded from your profile.</p>
                </div>
              )}

              {activeTab === 'classes' && (
                  assignedClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignedClasses.map((cls, i) => (
                        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                          <h3 className="font-bold text-[var(--edlink-blue-text)] text-sm">{cls.name}</h3>
                          <div className="bg-[var(--edlink-green-brand)]/10 text-emerald-700 font-bold text-xs px-2 py-1 rounded-lg inline-block mt-2">
                            {cls.enrolled_students} students
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                      <Users size={36} className="mx-auto mb-3 text-slate-300" />
                      <h4 className="text-sm font-bold text-slate-600 mb-1">No Classes Assigned</h4>
                    </div>
                  )
              )}

              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  {assignments.length > 0 ? assignments.map((a, i) => (
                      <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-[var(--edlink-blue-text)] text-sm">{a.title}</h3>
                              <p className="text-xs text-[var(--edlink-blue-text)]/70 mt-1 max-w-lg">{a.description}</p>
                              {a.attachment_url && (
                                  <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center mt-2 hover:underline">
                                      <Download size={12} className="mr-1" /> View Attachment
                                  </a>
                              )}
                          </div>
                          <div className="text-right">
                              <p className="text-xs text-rose-500 font-bold mb-3">Due: {new Date(a.deadline).toLocaleDateString()}</p>
                              <button onClick={() => loadSubmissions(a)} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded font-bold transition-colors">
                                  Review Submissions
                              </button>
                          </div>
                      </div>
                  )) : (
                      <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400">
                          <FileText size={36} className="mx-auto mb-3 opacity-40" />
                          <p className="text-sm">No assignments created yet.</p>
                      </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Create Assignment Modal */}
          {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                      <h3 className="font-bold text-lg mb-4">Create Assignment</h3>
                      <form onSubmit={handleCreateAssignment} className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Target Class</label>
                              <select required value={newAssignment.class_id} onChange={e => setNewAssignment({...newAssignment, class_id: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]">
                                  <option value="">Select a class...</option>
                                  {assignedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Title</label>
                              <input required type="text" value={newAssignment.title} onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Instructions / Description</label>
                              <textarea required rows={3} value={newAssignment.description} onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Deadline</label>
                                  <input required type="datetime-local" value={newAssignment.deadline} onChange={e => setNewAssignment({...newAssignment, deadline: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-[var(--edlink-blue-text)] mb-1">Attachment URL (Cloud Storage)</label>
                                  <input type="url" placeholder="https://..." value={newAssignment.attachment_url} onChange={e => setNewAssignment({...newAssignment, attachment_url: e.target.value})} className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-[var(--edlink-green-brand)]" />
                              </div>
                          </div>
                          <div className="flex justify-end space-x-3 mt-6">
                              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                              <button type="submit" disabled={isCreating} className="px-4 py-2 text-sm text-white bg-[var(--edlink-green-brand)] hover:bg-[var(--edlink-green-hover)] rounded font-bold">
                                  {isCreating ? 'Creating...' : 'Publish Assignment'}
                              </button>
                          </div>
                      </form>
                  </div>
              </div>
          )}

          {/* Submissions Review Modal */}
          {viewingAssignment && (
              <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="font-bold text-lg">{viewingAssignment.title}</h3>
                              <p className="text-xs text-[var(--edlink-blue-text)]/70">Submissions Review</p>
                          </div>
                          <button onClick={() => setViewingAssignment(null)} className="text-slate-400 hover:text-slate-600">×</button>
                      </div>

                      {isLoadingSubmissions ? (
                          <div className="py-10 text-center"><div className="w-6 h-6 border-2 border-[var(--edlink-green-brand)]/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" /></div>
                      ) : submissions.length > 0 ? (
                          <div className="space-y-3">
                              {submissions.map((sub, i) => (
                                  <div key={i} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                                      <div className="flex justify-between items-center mb-2">
                                          <h4 className="font-bold text-sm text-[var(--edlink-blue-text)]">{sub.student_name}</h4>
                                          <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded uppercase">{sub.status}</span>
                                      </div>
                                      <p className="text-xs text-[var(--edlink-blue-text)]/70 mb-2">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                                      {sub.submission_url && (
                                          <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center hover:underline mb-1">
                                              <Download size={12} className="mr-1" /> Attached Link/File
                                          </a>
                                      )}
                                      {sub.submission_text && (
                                          <div className="mt-2 p-3 bg-white border border-slate-200 rounded text-xs text-slate-600 whitespace-pre-wrap">
                                              {sub.submission_text}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="py-10 text-center text-slate-400">
                              <CheckCircle2 size={32} className="mx-auto mb-2 opacity-40" />
                              <p className="text-sm">No submissions received yet.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
        </main>
      </div>
    </div>
  )
}
