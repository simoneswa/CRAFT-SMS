"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useState, useEffect } from 'react'
import { 
  Settings, 
  BookOpen, 
  Calendar, 
  Layers, 
  Plus, 
  Edit2, 
  Trash2,
  CheckCircle2,
  Lock,
  Clock,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { supabase } from '@/lib/supabase'
import { fetchAPI } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'

export default function AcademicControlCenter() {
  const { school } = useTenant()
  const [activeTab, setActiveTab] = useState<'TERMS' | 'SUBJECTS' | 'CLASSES' | 'CATEGORIES'>('TERMS')
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form States
  const [formData, setFormData] = useState<any>({})

  useEffect(() => {
    if (school?.id) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school, activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      let endpoint = ''
      switch(activeTab) {
        case 'TERMS': endpoint = '/academic/terms'; break
        case 'SUBJECTS': endpoint = '/academic/subjects'; break
        case 'CLASSES': endpoint = '/academic/classes'; break
        case 'CATEGORIES': endpoint = '/academic/grade-categories'; break
      }
      const resp = await fetchAPI(endpoint)
      setData(resp)
    } catch (err) {
      console.error('Failed to load academic data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      let endpoint = ''
      switch(activeTab) {
        case 'TERMS': endpoint = '/academic/terms'; break
        case 'SUBJECTS': endpoint = '/academic/subjects'; break
        case 'CLASSES': endpoint = '/academic/classes'; break
        case 'CATEGORIES': endpoint = '/academic/grade-categories'; break
      }
      
      const { data: resp, error: apiError } = await supabase
        .from(
          activeTab === 'TERMS' ? 'academic_terms' :
          activeTab === 'SUBJECTS' ? 'subjects' :
          activeTab === 'CLASSES' ? 'classes' : 'grade_categories'
        )
        .insert({ ...formData, school_id: school?.id })
        .select()
        .single()

      if (apiError) throw apiError

      setShowModal(false)
      setFormData({})
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to save record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { id: 'TERMS', label: 'Academic Terms', icon: Calendar },
    { id: 'SUBJECTS', label: 'Subjects', icon: BookOpen },
    { id: 'CLASSES', label: 'Classes', icon: Layers },
    { id: 'CATEGORIES', label: 'Grading Weights', icon: Settings },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Academic <span className="gradient-text">Control Center</span></h1>
            <p className="text-gray-400">Configure your institution&apos;s structural foundation and grading rules.</p>
          </div>
          <button 
            onClick={() => { setShowModal(true); setFormData({}); setError(null); }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-black font-extrabold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-5 h-5" />
            Add {activeTab.slice(0, -1)}
          </button>
        </header>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-teal-400' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="premium-card min-h-[400px]">
           {isLoading ? (
             <div className="flex justify-center py-32">
               <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
             </div>
           ) : data.length === 0 ? (
             <div className="text-center py-32 text-gray-500">
               <Layers className="w-16 h-16 mx-auto mb-6 opacity-20" />
               <p className="text-xl font-medium mb-1">No {activeTab.toLowerCase()} found.</p>
               <p className="text-sm">Start by adding your first record to build the academic structure.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={item.id} 
                    className="p-6 bg-white/5 border border-white/5 rounded-2xl hover:border-white/20 transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div className="p-3 rounded-xl bg-white/5 group-hover:bg-teal-500/10 transition-colors">
                          {activeTab === 'TERMS' && <Calendar className="w-5 h-5 text-teal-400" />}
                          {activeTab === 'SUBJECTS' && <BookOpen className="w-5 h-5 text-blue-400" />}
                          {activeTab === 'CLASSES' && <Layers className="w-5 h-5 text-amber-400" />}
                          {activeTab === 'CATEGORIES' && <Settings className="w-5 h-5 text-emerald-400" />}
                       </div>
                       <div className="flex gap-2">
                          <button className="p-2 text-gray-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button className="p-2 text-gray-500 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-white mb-1">{item.name}</h3>
                    {activeTab === 'TERMS' && (
                       <p className="text-xs text-gray-500 flex items-center gap-2">
                         <Clock className="w-3 h-3" />
                         {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                       </p>
                    )}
                    {activeTab === 'SUBJECTS' && <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">{item.code || 'NO CODE'}</p>}
                    {activeTab === 'CLASSES' && <p className="text-xs text-gray-500">{item.grade_level} • {item.room_number || 'No Room'}</p>}
                    {activeTab === 'CATEGORIES' && (
                       <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${item.weight}%` }} />
                          </div>
                          <span className="text-sm font-bold text-emerald-400">{item.weight}%</span>
                       </div>
                    )}

                    {item.is_current && (
                       <div className="absolute top-0 right-0 p-2">
                          <div className="bg-teal-500/20 text-teal-400 text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-bl-lg rounded-tr-lg border-l border-b border-teal-500/20">
                             Active
                          </div>
                       </div>
                    )}
                  </motion.div>
                ))}
             </div>
           )}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} 
               />
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                 className="relative w-full max-w-lg bg-[#0a0f18] border border-white/10 rounded-3xl p-8 shadow-2xl"
               >
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-xl font-bold text-white">Add New {activeTab.slice(0, -1)}</h2>
                     <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-bold mb-6">
                       <AlertCircle className="w-4 h-4" />
                       {error}
                    </div>
                  )}

                  <form onSubmit={handleAdd} className="space-y-4">
                     {activeTab === 'TERMS' && (
                       <>
                         <div className="space-y-2">
                            <label className="section-label">Term Name</label>
                            <input type="text" required placeholder="e.g. First Term 2026" className="premium-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="section-label">Start Date</label>
                               <input type="date" required className="premium-input" value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                               <label className="section-label">End Date</label>
                               <input type="date" required className="premium-input" value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                            </div>
                         </div>
                         <label className="flex items-center gap-3 cursor-pointer group p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                            <input type="checkbox" className="w-4 h-4 accent-teal-500" checked={formData.is_current || false} onChange={e => setFormData({...formData, is_current: e.target.checked})} />
                            <span className="text-sm font-bold text-gray-400 group-hover:text-white">Set as Current Active Term</span>
                         </label>
                       </>
                     )}

                     {activeTab === 'SUBJECTS' && (
                        <>
                          <div className="space-y-2">
                             <label className="section-label">Subject Name</label>
                             <input type="text" required placeholder="e.g. Mathematics" className="premium-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="section-label">Subject Code</label>
                             <input type="text" placeholder="e.g. MATH101" className="premium-input uppercase" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="section-label">Department</label>
                             <select className="premium-input appearance-none" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                                <option value="">Select Department</option>
                                <option value="SCIENCES">Sciences</option>
                                <option value="ARTS">Arts</option>
                                <option value="COMMERCE">Commerce</option>
                             </select>
                          </div>
                        </>
                     )}

                     {activeTab === 'CLASSES' && (
                        <>
                          <div className="space-y-2">
                             <label className="section-label">Class Name</label>
                             <input type="text" required placeholder="e.g. Grade 10A" className="premium-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="section-label">Grade Level</label>
                                <input type="text" placeholder="e.g. 10" className="premium-input" value={formData.grade_level || ''} onChange={e => setFormData({...formData, grade_level: e.target.value})} />
                             </div>
                             <div className="space-y-2">
                                <label className="section-label">Room Number</label>
                                <input type="text" placeholder="e.g. R-204" className="premium-input" value={formData.room_number || ''} onChange={e => setFormData({...formData, room_number: e.target.value})} />
                             </div>
                          </div>
                        </>
                     )}

                     {activeTab === 'CATEGORIES' && (
                        <>
                          <div className="space-y-2">
                             <label className="section-label">Category Name</label>
                             <input type="text" required placeholder="e.g. Final Exam" className="premium-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="section-label">Weight Percentage (%)</label>
                             <input type="number" required max="100" min="1" placeholder="e.g. 60" className="premium-input" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})} />
                          </div>
                        </>
                     )}

                     <button 
                       type="submit" 
                       disabled={isSubmitting}
                       className="w-full py-4 bg-teal-500 text-black font-extrabold rounded-2xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 mt-4"
                     >
                        {isSubmitting ? 'Saving...' : `Create ${activeTab.slice(0, -1)}`}
                     </button>
                  </form>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Quick Help Card */}
        <div className="p-6 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-white/5 rounded-3xl relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-2xl">
                 <h4 className="text-lg font-bold text-white mb-2">Operational Integrity Tip</h4>
                 <p className="text-sm text-gray-400 leading-relaxed">
                   Changes to Academic Terms or Grading Weights can significantly impact historical reports. 
                   Ensure all grades are finalized and the term is **locked** before creating a new academic period.
                 </p>
              </div>
              <button className="flex items-center gap-2 text-sm font-bold text-teal-400 hover:text-teal-300 transition-all">
                 Read Documentation
                 <ChevronRight className="w-4 h-4" />
              </button>
           </div>
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
        </div>
      </div>
    </DashboardLayout>
  )
}

