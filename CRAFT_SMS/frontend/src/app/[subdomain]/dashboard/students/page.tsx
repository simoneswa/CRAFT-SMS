"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  MoreVertical,
  X,
  AlertCircle,
  Clock,
  Code,
  Activity,
  Layers,
} from 'lucide-react'
import { DashboardLayout } from '../../../../components/dashboard/DashboardLayout'

const MOCK_STUDENTS = [
  {
    id: 'STD-001',
    full_name: 'Amina Yusuf',
    email: 'amina.yusuf@school.edu',
    phone_number: '+233 24 555 0101',
    status: 'active',
    year: 'Grade 10',
    segment: 'Stream B',
  },
  {
    id: 'STD-002',
    full_name: 'Kwame Mensah',
    email: 'kwame.mensah@school.edu',
    phone_number: '+233 24 555 0102',
    status: 'active',
    year: 'Grade 11',
    segment: 'Stream A',
  },
  {
    id: 'STD-003',
    full_name: 'Naomi Adjei',
    email: 'naomi.adjei@school.edu',
    phone_number: '+233 24 555 0103',
    status: 'pending',
    year: 'Grade 12',
    segment: 'Stream C',
  },
  {
    id: 'STD-004',
    full_name: 'Daniel Opoku',
    email: 'daniel.opoku@school.edu',
    phone_number: '+233 24 555 0104',
    status: 'active',
    year: 'Grade 10',
    segment: 'Stream A',
  },
]

const quickActions = [
  { label: 'Sync Attendance', icon: Activity, color: 'bg-[#007A53]/15 text-[#007A53]' },
  { label: 'Flag Missing Docs', icon: AlertCircle, color: 'bg-[#E7E2DA]/80 text-[#0A251C]' },
  { label: 'Import Roll', icon: Layers, color: 'bg-[#F0FFF6]/80 text-[#007A53]' },
  { label: 'Launch Report', icon: Code, color: 'bg-[#FEF6EF]/80 text-[#BB7A00]' },
]

export default function StudentsPage() {
  const [students, setStudents] = useState(MOCK_STUDENTS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const newStudent = {
        id: `STD-${Math.floor(100 + Math.random() * 900)}`,
        full_name: formData.full_name,
        email: formData.email,
        phone_number: '+233 24 555 01' + Math.floor(10 + Math.random() * 89),
        status: 'pending',
        year: 'Grade 10',
        segment: 'Stream D',
      }
      setStudents((prev) => [newStudent, ...prev])
      setFormData({ full_name: '', email: '' })
      setIsModalOpen(false)
    } catch (err: any) {
      setError(err?.message || 'Failed to enroll student')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Student Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              A messy, real-world student dashboard for admin teams that ship features late and fix things in production.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-3xl bg-[#007A53] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007A53]/20 transition hover:bg-[#006342]"
            >
              <UserPlus className="h-5 w-5" />
              Add Student
            </button>
            <button className="inline-flex items-center gap-2 rounded-3xl border border-[#007A53] bg-white px-5 py-3 text-sm font-semibold text-[#007A53] hover:bg-[#f0fff6] transition">
              <MoreVertical className="h-5 w-5" />
              Quick Actions
            </button>
          </div>
        </header>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                className="relative z-10 w-full max-w-lg rounded-[32px] border border-[var(--brand-border)] bg-white p-8 shadow-2xl"
              >
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute right-4 top-4 text-slate-500 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-950 mb-2">Enroll a new student</h2>
                <p className="text-sm text-slate-500 mb-6">This is the messy invite flow everyone talks about at stand-up.</p>

                {error && (
                  <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Jane Doe"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Student Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane.doe@school.edu"
                      className="input-field"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-3xl bg-[#007A53] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007A53]/20 hover:bg-[#006342] transition disabled:opacity-60"
                    >
                      {isSubmitting ? 'Enrolling...' : 'Enroll student'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
          <div className="space-y-6">
            <div className="premium-card border-[#E7E2DA]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Student Inbox</p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-950">Classroom snapshot</h2>
                  <p className="mt-2 text-sm text-slate-500">Everything looks a bit raw, but it works. This is the dev-friendly dashboard with quick filters and a messy list.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.label}
                        className={`inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition ${action.color}`}
                      >
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="premium-card bg-[#FAF8F5]">
                <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">System notes</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">Dev log — today</h3>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="rounded-3xl border border-[#E7E2DA] bg-white p-4">Fix the student upload flow when IDs are missing and keep the modal open on error.</li>
                  <li className="rounded-3xl border border-[#E7E2DA] bg-white p-4">Clean up the attendance import pipe and add a retry button.</li>
                  <li className="rounded-3xl border border-[#E7E2DA] bg-white p-4">Add a school year filter for student groups before QA tomorrow.</li>
                </ul>
              </div>
              <div className="premium-card bg-[#F4F7F5]">
                <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Production KPI</p>
                <div className="mt-4 grid gap-4">
                  <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E7E2DA]">
                    <p className="text-sm text-slate-500">Pending student approvals</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">7</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E7E2DA]">
                    <p className="text-sm text-slate-500">Open support tickets</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">12</p>
                  </div>
                  <div className="rounded-3xl bg-white p-4 shadow-sm border border-[#E7E2DA]">
                    <p className="text-sm text-slate-500">Latest deploy</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">2m ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="premium-card bg-[#FFFFFF]">
              <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Build board</p>
              <div className="mt-5 grid gap-4">
                <div className="flex items-center justify-between rounded-3xl bg-[#F0FFF6] p-4 border border-[#DAF5E2]">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Student sync queue</p>
                    <p className="text-sm text-slate-500">2 jobs waiting. Retry available.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#007A53]/10 px-3 py-1 text-xs font-semibold text-[#007A53]">
                    <Clock className="h-4 w-4" /> Live
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#FFF4E5] p-4 border border-[#F5E0C2]">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Missing docs</p>
                    <p className="text-sm text-slate-500">4 students without ID card.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#BB7A00]/10 px-3 py-1 text-xs font-semibold text-[#BB7A00]">
                    <AlertCircle className="h-4 w-4" /> Warn
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#F7F7FF] p-4 border border-[#DAD9F0]">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Grade upload</p>
                    <p className="text-sm text-slate-500">2 classes pending review.</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#5C61F6]/10 px-3 py-1 text-xs font-semibold text-[#5C61F6]">
                    <Code className="h-4 w-4" /> Dev
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="premium-card bg-[#FFFFFF]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Enrollment</p>
                    <h3 className="mt-3 text-2xl font-bold text-slate-950">Roster overview</h3>
                  </div>
                  <div className="rounded-full bg-[#E5F8EF] px-3 py-1 text-xs font-semibold text-[#007A53]">+4 new</div>
                </div>
                <div className="mt-6 space-y-4">
                  {filteredStudents.slice(0, 3).map((student) => (
                    <div key={student.id} className="rounded-3xl border border-[#E7E2DA] bg-[#FAF8F5] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{student.full_name}</p>
                          <p className="text-xs text-slate-500">{student.year} • {student.segment}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {student.status}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-3">
                        <span>{student.email}</span>
                        <span>{student.phone_number}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card bg-[#FFFFFF]">
                <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">System</p>
                <h3 className="mt-3 text-2xl font-bold text-slate-950">Dev backlog</h3>
                <div className="mt-6 space-y-3 text-sm text-slate-600">
                  <div className="rounded-3xl border border-[#E7E2DA] bg-[#FAF8F5] p-4">Add quick notes to student cards and show missing attendance rows.</div>
                  <div className="rounded-3xl border border-[#E7E2DA] bg-[#FAF8F5] p-4">Expose school term and exam groups in the student table.</div>
                  <div className="rounded-3xl border border-[#E7E2DA] bg-[#FAF8F5] p-4">Render raw SQL logs when a student save fails — messy but useful.</div>
                </div>
              </div>
            </div>

            <div className="premium-card bg-[#FFFFFF]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Student roster</p>
                  <h3 className="mt-3 text-2xl font-bold text-slate-950">Full list</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#F4F7F5] px-3 py-2">Live</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E7F8EF] px-3 py-2">Sync</span>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[28px] border border-[#E7E2DA] bg-[#FAF8F5]">
                <div className="grid grid-cols-4 gap-4 bg-[#007A53] px-4 py-3 text-xs uppercase tracking-[0.24em] text-white">
                  <span>Name</span>
                  <span>Status</span>
                  <span>Year</span>
                  <span>Actions</span>
                </div>
                <div className="divide-y divide-[#E7E2DA]">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm text-slate-700">
                      <div>
                        <p className="font-semibold text-slate-950">{student.full_name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                          {student.status}
                        </span>
                      </div>
                      <div>{student.year}</div>
                      <div className="flex items-center gap-2">
                        <button className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-[#007A53] border border-[#007A53]/20 hover:bg-[#f0fff6] transition">View</button>
                        <button className="rounded-2xl bg-[#007A53] px-3 py-2 text-xs font-semibold text-white hover:bg-[#005d40] transition">Note</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="premium-card bg-[#F4F7F5]">
              <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Inbox</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">Messages queue</h3>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                <div className="rounded-3xl border border-[#E7E2DA] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Attendance alert</p>
                      <p className="text-xs text-slate-500">Sent to 14 parents at 8:42 AM.</p>
                    </div>
                    <span className="text-xs text-slate-500">Queued</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-[#E7E2DA] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Fee reminder</p>
                      <p className="text-xs text-slate-500">Drafted, waiting on final approval.</p>
                    </div>
                    <span className="text-xs text-amber-600">Draft</span>
                  </div>
                </div>
                <div className="rounded-3xl border border-[#E7E2DA] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">Academic performance alert</p>
                      <p className="text-xs text-slate-500">Ready to send after QA.</p>
                    </div>
                    <span className="text-xs text-emerald-600">Ready</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card bg-[#FFFFFF]">
              <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Sprint board</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">Engineering mode</h3>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-3xl bg-[#F0FFF6] p-4 border border-[#DAF5E2]">
                  <div>
                    <p className="font-semibold text-slate-950">Refactor student filters</p>
                    <p className="text-xs text-slate-500">Make search a little less painful.</p>
                  </div>
                  <span className="rounded-full bg-[#007A53]/10 px-3 py-1 text-xs font-semibold text-[#007A53]">In progress</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#FFF4E5] p-4 border border-[#F5E0C2]">
                  <div>
                    <p className="font-semibold text-slate-950">Add gradebook quick links</p>
                    <p className="text-xs text-slate-500">Jump directly to subject data.</p>
                  </div>
                  <span className="rounded-full bg-[#BB7A00]/10 px-3 py-1 text-xs font-semibold text-[#BB7A00]">Planned</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-[#F7F7FF] p-4 border border-[#DAD9F0]">
                  <div>
                    <p className="font-semibold text-slate-950">Hotfix: broken invite email</p>
                    <p className="text-xs text-slate-500">Deployed and monitoring.</p>
                  </div>
                  <span className="rounded-full bg-[#5C61F6]/10 px-3 py-1 text-xs font-semibold text-[#5C61F6]">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
