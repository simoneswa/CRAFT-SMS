"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Search, 
  Plus, 
  Globe, 
  Settings, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  X
} from 'lucide-react'
import { fetchAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'

export default function TenantsPage() {
  const [schools, setSchools] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', subdomain: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchSchools = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchools(data || [])
    } catch (err) {
      console.error('Error fetching schools:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Use backend API for creation to ensure audit logs are generated
      await fetchAPI('/tenants/schools', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      
      setIsModalOpen(false)
      setFormData({ name: '', subdomain: '' })
      fetchSchools() // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to create school')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Tenant <span className="gradient-text">Management</span></h1>
            <p className="text-gray-400">Onboard and oversee all institutions on the platform.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-5 h-5" />
            Add New School
          </button>
        </header>

        {/* Create School Modal */}
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
                
                <h2 className="text-2xl font-bold mb-2">Add New School</h2>
                <p className="text-gray-400 text-sm mb-6">Create a new isolated tenant environment.</p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCreateSchool} className="space-y-4">
                  <div>
                    <label className="section-label mb-2 block">School Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., St. Patrick High"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="section-label mb-2 block">Subdomain Prefix</label>
                    <div className="flex items-center">
                      <input 
                        type="text" 
                        required
                        value={formData.subdomain}
                        onChange={e => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                        placeholder="e.g., stpatrick"
                        className="flex-1 bg-white/5 border border-white/10 rounded-l-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 transition-colors"
                      />
                      <span className="px-4 py-3 bg-white/10 border-y border-r border-white/10 rounded-r-xl text-gray-400 text-sm font-medium">
                        .craftsms.app
                      </span>
                    </div>
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
                      {isSubmitting ? 'Creating...' : 'Create School'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="premium-card flex items-center gap-4">
           <Search className="text-gray-500 w-5 h-5" />
           <input 
             type="text" 
             placeholder="Search by school name or subdomain..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="flex-1 bg-transparent border-none focus:outline-none py-2 text-sm text-white" 
           />
        </div>

        <div className="space-y-4">
          {isLoading ? (
             Array(4).fill(0).map((_, i) => (
                <div key={i} className="premium-card animate-pulse h-24 bg-white/5" />
             ))
          ) : filteredSchools.length === 0 ? (
            <div className="text-center py-20 premium-card">
              <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No schools found.</p>
            </div>
          ) : (
            filteredSchools.map((school) => (
              <div key={school.id} className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-teal-500/30 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {school.logo_url ? (
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={school.logo_url} alt={school.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <Building2 className="text-gray-400 w-7 h-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg group-hover:text-teal-400 transition-colors">{school.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        {school.subdomain}.craftsms.app
                      </p>
                      <span className={school.is_active ? 'badge-verified' : 'badge-rejected'}>
                        {school.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                   <div className="text-right hidden sm:block">
                      <p className="section-label mb-1">Onboarded</p>
                      <p className="text-sm font-medium">{new Date(school.created_at).toLocaleDateString()}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <Settings className="w-5 h-5" />
                      </button>
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

