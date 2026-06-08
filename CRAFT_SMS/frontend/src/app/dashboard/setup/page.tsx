"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Building2, 
  Palette, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Globe,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { fetchAPI } from '../../../lib/api'

const steps = [
  { id: 'INSTITUTION', title: 'Institutional Identity', icon: Building2 },
  { id: 'BRANDING', title: 'Visual Presence', icon: Palette },
  { id: 'ACADEMIC', title: 'Academic Foundation', icon: BookOpen },
  { id: 'REVIEW', title: 'Operational Review', icon: CheckCircle2 }
]

export default function OnboardingWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    primary_color: '#0D9488',
    secondary_color: '#111827',
    term_name: 'Term 1 2026',
    start_date: '2026-09-01',
    end_date: '2026-12-15'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // 1. Create School
      const school = await fetchAPI('/tenants/schools', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          subdomain: formData.subdomain,
          branding: {
            primary_color: formData.primary_color,
            secondary_color: formData.secondary_color
          }
        })
      })


      // 2. Create Initial Term
      await fetchAPI('/academic/terms', {
        method: 'POST',
        body: JSON.stringify({
          school_id: school.id,
          name: formData.term_name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_current: true
        })
      })

      router.push(`http://${formData.subdomain}.localhost:3000/dashboard`)
    } catch (err) {
      console.error('Onboarding failed:', err)
      alert('Onboarding failed. Check console for details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 py-20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--edlink-green-brand)]/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
           <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-teal-500/20 mx-auto mb-6">
              <Building2 className="text-white w-8 h-8" />
           </div>
           <h1 className="text-4xl font-black tracking-tight mb-3 uppercase">Initialize <span className="gradient-text">Institution</span></h1>
           <p className="text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest text-xs">CRAFT SMS Institutional Onboarding Engine</p>
        </div>

        {/* Step Progress */}
        <div className="flex justify-between items-center mb-16 relative">
           <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 -z-10" />
           {steps.map((step, i) => (
             <div key={step.id} className="flex flex-col items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  i <= currentStep ? 'bg-[var(--edlink-green-brand)] border-[var(--edlink-green-brand)] text-black shadow-lg shadow-teal-500/20' : 'bg-[#030712] border-white/10 text-[var(--edlink-blue-text)]/70'
                }`}>
                   <step.icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${i <= currentStep ? 'text-[var(--edlink-green-brand)]' : 'text-[var(--edlink-blue-text)]/70'}`}>
                   {step.title}
                </span>
             </div>
           ))}
        </div>

        {/* Wizard Content */}
        <div className="premium-card p-12 bg-white/[0.02] border-white/10 relative overflow-hidden">
           <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                 {currentStep === 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="section-label">Institutional Name</label>
                         <input 
                           type="text" 
                           placeholder="e.g. West Oak Academy"
                           value={formData.name}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                           className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--edlink-green-brand)] transition-all"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="section-label">Subdomain Access</label>
                         <div className="flex items-center gap-2">
                           <input 
                             type="text" 
                             placeholder="westoak"
                             value={formData.subdomain}
                             onChange={e => setFormData({...formData, subdomain: e.target.value})}
                             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--edlink-green-brand)] transition-all text-right"
                           />
                           <span className="text-[var(--edlink-blue-text)]/70 font-bold">.localhost:3000</span>
                         </div>
                      </div>
                   </div>
                 )}

                 {currentStep === 1 && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="section-label">Primary Brand Color</label>
                         <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={formData.primary_color}
                              onChange={e => setFormData({...formData, primary_color: e.target.value})}
                              className="w-16 h-16 rounded-xl bg-transparent border-none cursor-pointer"
                            />
                            <div className="flex-1">
                               <p className="text-sm font-bold text-white uppercase">{formData.primary_color}</p>
                               <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest mt-1">Institutional Accent Color</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="section-label">Logo Upload</label>
                         <div className="w-full h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 transition-all cursor-pointer group">
                            <Upload className="w-6 h-6 text-[var(--edlink-blue-text)]/70 group-hover:text-[var(--edlink-green-brand)] mb-2" />
                            <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest">Upload Official Shield</p>
                         </div>
                      </div>
                   </div>
                 )}

                 {currentStep === 2 && (
                   <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-4">
                            <label className="section-label">Active Academic Term</label>
                            <input 
                              type="text" 
                              value={formData.term_name}
                              onChange={e => setFormData({...formData, term_name: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--edlink-green-brand)] transition-all"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                               <label className="section-label">Start Date</label>
                               <input 
                                 type="date" 
                                 value={formData.start_date}
                                 onChange={e => setFormData({...formData, start_date: e.target.value})}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[var(--edlink-green-brand)] transition-all"
                               />
                            </div>
                            <div className="space-y-4">
                               <label className="section-label">End Date</label>
                               <input 
                                 type="date" 
                                 value={formData.end_date}
                                 onChange={e => setFormData({...formData, end_date: e.target.value})}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[var(--edlink-green-brand)] transition-all"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                 )}

                 {currentStep === 3 && (
                   <div className="text-center py-8">
                      <div className="w-20 h-20 bg-[var(--edlink-green-brand)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                         <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Ready for Initialization</h3>
                      <p className="text-[var(--edlink-blue-text)]/70 text-sm max-w-sm mx-auto leading-relaxed">
                         The system will now provision the <strong>{formData.name}</strong> tenant on <strong>{formData.subdomain}.localhost</strong> with the configured branding and academic foundations.
                      </p>
                   </div>
                 )}
              </motion.div>
           </AnimatePresence>

           {/* Footer Buttons */}
           <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
              <button 
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all ${currentStep === 0 ? 'text-gray-700 pointer-events-none' : 'text-[var(--edlink-blue-text)]/70 hover:text-white'}`}
              >
                 <ArrowLeft className="w-4 h-4" /> Previous Phase
              </button>
              
              {currentStep < steps.length - 1 ? (
                <button 
                  onClick={nextStep}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-all"
                >
                   Next Step <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="px-8 py-4 rounded-xl bg-[var(--edlink-green-brand)] text-black text-xs font-black uppercase tracking-[0.15em] flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-2xl shadow-teal-500/20"
                >
                   {isSubmitting ? 'Initializing...' : 'Finalize & Launch Institution'}
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  )
}
