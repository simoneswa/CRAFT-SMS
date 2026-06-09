"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  MoreVertical,
  X,
  AlertCircle,
  Users
} from 'lucide-react'
import { DashboardLayout } from '../../../../components/dashboard/DashboardLayout'
import { fetchAPI } from '../../../../lib/api'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setIsLoading(true)
      const data = await fetchAPI('/admin/users?role=STUDENT')
      setStudents(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load students:', err)
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }

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
      await fetchAPI('/admin/invite', {
        method: 'POST',
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          role: 'STUDENT'
        })
      })
      setFormData({ full_name: '', email: '' })
      setIsModalOpen(false)
      loadStudents()
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
            <p className="mt-2 max-w-2xl text-sm text-[var(--edlink-blue-text)]/70">
              Manage student enrollment and directory.
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
                  className="absolute right-4 top-4 text-[var(--edlink-blue-text)]/70 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-2xl font-bold text-slate-950 mb-2">Enroll a new student</h2>
                <p className="text-sm text-[var(--edlink-blue-text)]/70 mb-6">Add a student to your institution roster.</p>

                {error && (
                  <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--edlink-blue-text)]/70">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Jane Doe"
                      className="input-field w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#007A53] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-[var(--edlink-blue-text)]/70">Student Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane.doe@school.edu"
                      className="input-field w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#007A53] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row mt-6">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-[var(--edlink-blue-text)] hover:bg-slate-100 transition"
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

        <div className="premium-card bg-[#FFFFFF]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#007A53] font-bold">Student roster</p>
              <h3 className="mt-3 text-2xl font-bold text-slate-950">Full list</h3>
            </div>
            <div className="relative">
               <input
                 type="text"
                 placeholder="Search students..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="rounded-xl border border-[#E7E2DA] bg-[#FAF8F5] px-4 py-2 text-sm focus:border-[#007A53] focus:outline-none"
               />
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[#E7E2DA] bg-[#FAF8F5]">
            <div className="grid grid-cols-4 gap-4 bg-[#007A53] px-4 py-3 text-xs uppercase tracking-[0.24em] text-white">
              <span>Name</span>
              <span>Status</span>
              <span>Email</span>
              <span>Actions</span>
            </div>
            {isLoading ? (
               <div className="p-12 flex justify-center items-center">
                  <div className="w-8 h-8 border-4 border-[#007A53]/20 border-t-[#007A53] rounded-full animate-spin" />
               </div>
            ) : filteredStudents.length === 0 ? (
               <div className="p-16 flex flex-col items-center justify-center text-[var(--edlink-blue-text)]/70">
                  <Users className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-center font-medium">No students available.</p>
               </div>
            ) : (
               <div className="divide-y divide-[#E7E2DA]">
                 {filteredStudents.map((student) => (
                   <div key={student.id} className="grid grid-cols-4 gap-4 px-4 py-4 text-sm text-[var(--edlink-blue-text)] items-center">
                     <div>
                       <p className="font-semibold text-slate-950">{student.full_name}</p>
                     </div>
                     <div className="flex items-center gap-2">
                       <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${student.status === 'active' ? 'bg-[var(--edlink-green-brand)]/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
                         {student.status || 'PENDING'}
                       </span>
                     </div>
                     <div className="truncate text-xs">{student.email}</div>
                     <div className="flex items-center gap-2">
                       <button className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-[#007A53] border border-[#007A53]/20 hover:bg-[#f0fff6] transition">View</button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
