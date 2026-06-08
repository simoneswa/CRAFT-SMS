"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  Home, MessageSquare, Compass, Bell, ChevronDown, ChevronRight,
  Search, Calendar, Users, Clock, ClipboardCheck, BookOpen, Plus,
  GraduationCap, FileText, CheckCircle2, AlertCircle, Send,
  BarChart3, FolderOpen, PenLine, Eye, Layers
} from 'lucide-react'
import { useAuth } from '../../providers/AuthProvider'
import { useTenant } from '../../providers/TenantProvider'
import { CraftLogo } from '../ui/CraftLogo'

/**
 * TeacherDashboard — Instructor Portal
 * 
 * Instructor-specific features:
 * - Lesson Plans management (list, create, submit for review)
 * - Assigned Classes with student rosters
 * - Grading & action queue
 * - Teaching schedule overview
 * 
 * This dashboard is COMPLETELY SEPARATE from StudentDashboard.
 * No student-specific features (attendance tracking from student POV,
 * personal course enrollment, todo deadlines) appear here.
 */

// ─── Types for backend data (will be populated from API) ───────────────────

interface LessonPlan {
  id: string
  topic: string
  sub_topic: string
  subject_name: string
  class_name: string
  week_number: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'revision_requested'
  submitted_at: string | null
  approved_at: string | null
  created_at: string
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

interface GradingTask {
  id: string
  title: string
  class_name: string
  pending_count: number
  due_date: string
  type: 'quiz' | 'assignment' | 'exam' | 'project'
}

// ─── Status helpers ────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' }
    case 'submitted':
      return { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Submitted' }
    case 'approved':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Approved' }
    case 'rejected':
      return { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Rejected' }
    case 'revision_requested':
      return { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Revision Needed' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-500', label: status }
  }
}

function getTaskTypeIcon(type: string) {
  switch (type) {
    case 'quiz': return ClipboardCheck
    case 'assignment': return FileText
    case 'exam': return GraduationCap
    case 'project': return FolderOpen
    default: return BookOpen
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const params = useParams()
  const subdomain = params?.subdomain as string
  const { profile } = useAuth()
  const { school } = useTenant()
  const [activeTab, setActiveTab] = useState<'lesson-plans' | 'classes' | 'grading'>('lesson-plans')
  const [searchQuery, setSearchQuery] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')

  // These will be populated from the backend API when real data is available
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([])
  const [gradingTasks, setGradingTasks] = useState<GradingTask[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filtered data
  const filteredPlans = lessonPlans.filter(p => {
    const matchesSearch = p.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = planFilter === 'all' || p.status === planFilter
    return matchesSearch && matchesFilter
  })

  const filteredClasses = assignedClasses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pendingGradingCount = gradingTasks.reduce((sum, t) => sum + t.pending_count, 0)
  const draftPlansCount = lessonPlans.filter(p => p.status === 'draft').length
  const submittedPlansCount = lessonPlans.filter(p => p.status === 'submitted').length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans">
      {/* ─── INSTRUCTOR NAVIGATION BAR ──────────────────────────────────── */}
      <nav className="bg-[#10b981] text-white px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <CraftLogo className="h-8 w-auto invert" />
            <div className="border-l border-white/30 pl-2 text-xs text-emerald-100">
              <p className="font-bold">{school?.name || 'School'}</p>
              <p className="text-[10px] opacity-80">Instructor Portal</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-1 font-medium text-sm">
            <Link href={`/${subdomain}/dashboard`}>
              <button className="flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-md">
                <Home size={16} /> <span>Home page</span>
              </button>
            </Link>
            <Link href={`/${subdomain}/dashboard/news`}>
              <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
                <Calendar size={16} /> <span>Timeline &amp; News</span>
              </button>
            </Link>
            <Link href={`/${subdomain}/dashboard/messages`}>
              <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
                <MessageSquare size={16} /> <span>Chat</span>
              </button>
            </Link>
            <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-1.5 rounded-md opacity-90">
              <Compass size={16} /> <span>Explore</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative cursor-pointer p-1.5 hover:bg-white/10 rounded-full">
            <Bell size={20} />
            {pendingGradingCount > 0 && (
              <span className="absolute top-1 right-1 bg-amber-500 text-[10px] font-bold px-1 rounded-full text-white">
                {pendingGradingCount}
              </span>
            )}
          </div>
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

      {/* ─── MAIN INSTRUCTOR INTERFACE ──────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─── LEFT SIDEBAR: Quick Stats & Actions ────────────────────── */}
        <aside className="lg:col-span-3 space-y-6">

          {/* Instructor Quick Stats */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm mb-4">My Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-emerald-600">{assignedClasses.length}</p>
                <p className="text-[10px] text-emerald-700 font-medium uppercase">Classes</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{lessonPlans.length}</p>
                <p className="text-[10px] text-blue-700 font-medium uppercase">Lesson Plans</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-amber-600">{draftPlansCount}</p>
                <p className="text-[10px] text-amber-700 font-medium uppercase">Drafts</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-black text-purple-600">{pendingGradingCount}</p>
                <p className="text-[10px] text-purple-700 font-medium uppercase">To Grade</p>
              </div>
            </div>
          </div>

          {/* Grading Action Queue */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-bold text-sm">Grading Queue</h3>
              {gradingTasks.length > 0 && (
                <span className="bg-rose-100 text-rose-600 font-bold text-xs px-1.5 py-0.5 rounded-full">
                  {gradingTasks.length}
                </span>
              )}
            </div>

            {gradingTasks.length > 0 ? (
              <div className="space-y-3">
                {gradingTasks.map((task, i) => {
                  const TaskIcon = getTaskTypeIcon(task.type)
                  return (
                    <div key={i} className="flex items-start space-x-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg mt-0.5">
                        <TaskIcon size={16} />
                      </div>
                      <div className="text-xs flex-1">
                        <h4 className="font-bold text-slate-800">{task.title}</h4>
                        <p className="text-slate-400 text-[11px] font-medium">{task.class_name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-rose-500 font-bold text-[10px]">{task.pending_count} ungraded</span>
                          <span className="text-slate-400 text-[10px]">{task.due_date}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-400" />
                <p className="text-xs text-slate-400">No pending grading tasks</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('lesson-plans')}
                className="w-full flex items-center space-x-3 p-2.5 rounded-lg hover:bg-emerald-50 transition-colors text-xs font-medium text-slate-600 hover:text-emerald-700"
              >
                <PenLine size={14} className="text-emerald-500" />
                <span>Create Lesson Plan</span>
              </button>
              <Link href={`/${subdomain}/dashboard/attendance`} className="block">
                <button className="w-full flex items-center space-x-3 p-2.5 rounded-lg hover:bg-blue-50 transition-colors text-xs font-medium text-slate-600 hover:text-blue-700">
                  <ClipboardCheck size={14} className="text-blue-500" />
                  <span>Take Attendance</span>
                </button>
              </Link>
              <Link href={`/${subdomain}/dashboard/gradebook`} className="block">
                <button className="w-full flex items-center space-x-3 p-2.5 rounded-lg hover:bg-purple-50 transition-colors text-xs font-medium text-slate-600 hover:text-purple-700">
                  <BarChart3 size={14} className="text-purple-500" />
                  <span>Open Gradebook</span>
                </button>
              </Link>
              <Link href={`/${subdomain}/dashboard/students`} className="block">
                <button className="w-full flex items-center space-x-3 p-2.5 rounded-lg hover:bg-cyan-50 transition-colors text-xs font-medium text-slate-600 hover:text-cyan-700">
                  <Users size={14} className="text-cyan-500" />
                  <span>Student Directory</span>
                </button>
              </Link>
            </div>
          </div>
        </aside>

        {/* ─── MAIN WORKSPACE ─────────────────────────────────────────── */}
        <main className="lg:col-span-9 space-y-6">

          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-2 space-y-3 sm:space-y-0">
            <div className="flex space-x-6 text-sm font-semibold">
              <button
                className={`pb-2 px-1 flex items-center space-x-1.5 ${activeTab === 'lesson-plans' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('lesson-plans')}
              >
                <BookOpen size={15} />
                <span>Lesson Plans</span>
              </button>
              <button
                className={`pb-2 px-1 flex items-center space-x-1.5 ${activeTab === 'classes' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('classes')}
              >
                <Layers size={15} />
                <span>Assigned Classes</span>
              </button>
              <button
                className={`pb-2 px-1 flex items-center space-x-1.5 ${activeTab === 'grading' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                onClick={() => setActiveTab('grading')}
              >
                <BarChart3 size={15} />
                <span>Grading</span>
              </button>
            </div>

            {/* Create Button */}
            {activeTab === 'lesson-plans' && (
              <button className="bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors self-start sm:self-auto shadow-sm">
                <Plus size={14} />
                <span>New Lesson Plan</span>
              </button>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'lesson-plans'
                    ? 'Search lesson plans by topic or subject...'
                    : activeTab === 'classes'
                    ? 'Search your assigned classes...'
                    : 'Search grading tasks...'
                }
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            {activeTab === 'lesson-plans' && (
              <div className="relative">
                <select
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="revision_requested">Revision Needed</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={14} />
              </div>
            )}
          </div>

          {/* ─── TAB: LESSON PLANS ─────────────────────────────────────── */}
          {activeTab === 'lesson-plans' && (
            <>
              {filteredPlans.length > 0 ? (
                <div className="space-y-3">
                  {filteredPlans.map((plan, i) => {
                    const badge = getStatusBadge(plan.status)
                    return (
                      <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-bold text-slate-800 text-sm">{plan.topic}</h3>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                            </div>
                            {plan.sub_topic && (
                              <p className="text-[11px] text-slate-400 mb-2">{plan.sub_topic}</p>
                            )}
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                              <span className="flex items-center space-x-1">
                                <BookOpen size={12} className="text-slate-400" />
                                <span>{plan.subject_name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Users size={12} className="text-slate-400" />
                                <span>{plan.class_name}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar size={12} className="text-slate-400" />
                                <span>Week {plan.week_number}</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {plan.status === 'draft' && (
                              <button className="text-[10px] font-bold px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-1">
                                <Send size={10} />
                                <span>Submit</span>
                              </button>
                            )}
                            <button className="text-[10px] font-bold px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center space-x-1">
                              <Eye size={10} />
                              <span>View</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                  <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-600 mb-1">No Lesson Plans Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Create your first lesson plan to start organizing your curriculum. Plans can be submitted for administrative review and approval.
                  </p>
                  <button className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg inline-flex items-center space-x-1.5 transition-colors">
                    <Plus size={14} />
                    <span>Create First Lesson Plan</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── TAB: ASSIGNED CLASSES ─────────────────────────────────── */}
          {activeTab === 'classes' && (
            <>
              {filteredClasses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClasses.map((cls, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">{cls.name}</h3>
                          <p className="text-[11px] text-slate-400 font-medium">{cls.department}</p>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-1 rounded-lg">
                          {cls.enrolled_students} students
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-500 mb-4">
                        <div className="flex items-center space-x-2">
                          <BookOpen size={13} className="text-slate-400" />
                          <span>{cls.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={13} className="text-slate-400" />
                          <span>{cls.schedule}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Layers size={13} className="text-slate-400" />
                          <span>Room: {cls.room}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                        <Link href={`/${subdomain}/dashboard/attendance`} className="flex-1">
                          <button className="w-full text-[10px] font-bold py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                            Take Attendance
                          </button>
                        </Link>
                        <Link href={`/${subdomain}/dashboard/gradebook`} className="flex-1">
                          <button className="w-full text-[10px] font-bold py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                            Gradebook
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                  <Users size={36} className="mx-auto mb-3 text-slate-300" />
                  <h4 className="text-sm font-bold text-slate-600 mb-1">No Classes Assigned</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Your assigned classes will appear here once the school administrator assigns you to classes for the current term.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── TAB: GRADING ─────────────────────────────────────────── */}
          {activeTab === 'grading' && (
            <>
              {gradingTasks.length > 0 ? (
                <div className="space-y-3">
                  {gradingTasks.map((task, i) => {
                    const TaskIcon = getTaskTypeIcon(task.type)
                    return (
                      <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                              <TaskIcon size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm">{task.title}</h3>
                              <p className="text-[11px] text-slate-400 font-medium">{task.class_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-amber-600">{task.pending_count} pending</p>
                            <p className="text-[10px] text-slate-400">Due: {task.due_date}</p>
                          </div>
                          <Link href={`/${subdomain}/dashboard/gradebook`}>
                            <button className="ml-4 text-[10px] font-bold px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                              Start Grading
                            </button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
                  <h4 className="text-sm font-bold text-slate-600 mb-1">All Caught Up!</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No grading tasks pending. New submissions will appear here when students submit their work.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
