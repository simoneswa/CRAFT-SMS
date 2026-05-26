"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  MapPin,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useTenant } from '@/providers/TenantProvider'
import { fetchAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function StudentsPage() {
  const { profile } = useAuth()
  const { school } = useTenant()
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ full_name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (school?.id) {
      fetchStudents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school])

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('school_id', school?.id)
        .eq('role', 'STUDENT')
        .order('full_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      await fetchAPI('/admin/invite', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          role: 'STUDENT',
          school_id: school?.id
        })
      })
      
      setIsModalOpen(false)
      setFormData({ full_name: '', email: '' })
      fetchStudents() // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to enroll student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.custom_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Student <span className="gradient-text">Directory</span></h1>
            <p className="text-gray-400">Manage enrollment and academic profiles for {school?.name || 'School'}.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            <UserPlus className="w-5 h-5" />
            Enroll New Student
          </button>
        </header>

        {/* Enrollment Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="premium-card w-full max-w-md relative z-10"
              >
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold mb-2">Enroll Student</h2>
                <p className="text-gray-400 text-sm mb-6">Send an invitation to a new student.</p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEnrollStudent} className="space-y-4">
                  <div>
                    <label className="section-label mb-2 block">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      placeholder="e.g., John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="section-label mb-2 block">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="john.doe@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Sending Invite...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="premium-card md:col-span-3 flex items-center gap-4">
             <Search className="text-gray-500 w-5 h-5" />
             <input 
               type="text" 
               placeholder="Search students by name or ID..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="flex-1 bg-transparent border-none focus:outline-none py-2 text-sm text-white" 
             />
          </div>
          <div className="premium-card flex flex-col justify-center items-center">
              <p className="section-label mb-1">Total Students</p>
              <h3 className="text-3xl font-bold text-teal-400">{students.length}</h3>
          </div>
        </div>

        {/* Student Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="premium-card animate-pulse h-48 bg-white/5" />
            ))
          ) : filteredStudents.length === 0 ? (
            <div className="col-span-full text-center py-20 premium-card">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No students found matching your search.</p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <motion.div 
                key={student.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card group hover:border-teal-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-xl font-bold text-teal-400 shadow-inner">
                    {student.full_name?.charAt(0)}
                  </div>
                  <div className="badge-verified">
                    {student.custom_id || 'PENDING'}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1 group-hover:text-teal-400 transition-colors">{student.full_name}</h3>
                <p className="text-xs text-gray-500 mb-6 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Active Student
                </p>

                <div className="space-y-3 pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate">{student.email || 'No email set'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Phone className="w-3.5 h-3.5" />
                    {student.phone_number || 'No phone set'}
                  </div>
                </div>

                <button className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-teal-500 hover:text-black transition-all font-bold text-xs flex items-center justify-center gap-2">
                  View Academic Profile
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

