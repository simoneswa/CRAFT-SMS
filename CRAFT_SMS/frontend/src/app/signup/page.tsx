"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, User, Building, ArrowRight, CheckCircle } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institutionName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!formData.fullName || !formData.email || !formData.institutionName) {
         throw new Error("Please fill out all required fields.")
      }

      // Real API call to request tenant creation
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/tenants/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.institutionName,
          subdomain: formData.institutionName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          contact_email: formData.email,
          contact_name: formData.fullName,
          notes: 'Signed up via landing page'
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to submit request.");
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding request.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="min-h-screen bg-[var(--brand-surface)] text-[var(--brand-heading)] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--brand-primary)]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--brand-primary)]/5 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[var(--brand-primary)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-[var(--brand-heading)]">CRAFT <span className="text-[var(--brand-primary)]">SMS</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--brand-heading)]">Onboard your Institution</h1>
          <p className="text-[var(--brand-body)] mt-3 text-lg">Join the unified educational ecosystem in Liberia.</p>
        </div>

        <div className="premium-card">
          {isSuccess ? (
             <div className="text-center py-10 space-y-4">
               <div className="w-16 h-16 bg-[var(--brand-primary)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <CheckCircle className="w-8 h-8 text-[var(--brand-primary)]" />
               </div>
               <h2 className="text-2xl font-bold text-[var(--brand-heading)]">Request Submitted!</h2>
               <p className="text-[var(--brand-body)]">
                 Thank you for your interest in CRAFT SMS. Our team will review your institution details for <strong className="text-[var(--brand-heading)]">{formData.institutionName}</strong> and contact you at <strong className="text-[var(--brand-heading)]">{formData.email}</strong> shortly with your onboarding packet.
               </p>
               <Link href="/login" className="inline-block mt-8 px-8 py-3 bg-[var(--brand-primary)] hover:bg-[#006b48] text-white rounded-3xl font-bold transition-all">
                 Return to Login
               </Link>
             </div>
          ) : step === 1 ? (
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'School Admin', desc: 'Manage your institution', icon: Building },
                    { title: 'Teacher/Staff', desc: 'Access your classroom', icon: User },
                  ].map((role, i) => (
                    <button 
                      key={i}
                      onClick={() => setStep(2)}
                      className="p-6 rounded-3xl bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-primary)]/10 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <role.icon className="w-6 h-6 text-[var(--brand-primary)]" />
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-[var(--brand-heading)]">{role.title}</h3>
                      <p className="text-[var(--brand-body)] text-sm">{role.desc}</p>
                    </button>
                  ))}
                </div>
                
                <div className="pt-6 border-t border-[var(--brand-border)] text-center">
                   <p className="text-sm text-[var(--brand-body)]">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[var(--brand-primary)] font-bold hover:underline">Sign In</Link>
                  </p>
                </div>
             </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
               {error && (
                 <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-3xl font-bold">
                   {error}
                 </div>
               )}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="section-label">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="John Doe" 
                      className="input-field" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="section-label">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="john@example.com" 
                      className="input-field" 
                      required
                    />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="section-label">Institution Name</label>
                  <input 
                    type="text" 
                    value={formData.institutionName}
                    onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                    placeholder="Monrovia Academy" 
                    className="input-field" 
                    required
                  />
               </div>

               <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-[var(--brand-primary)] hover:bg-[#006b48] text-white font-extrabold rounded-3xl transition-all shadow-xl shadow-[var(--brand-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Submitting Request...' : 'Request Onboarding'}
                  {!isLoading && <ArrowRight className="w-5 h-5" />}
                </button>

                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-[var(--brand-body)] text-sm font-medium hover:text-[var(--brand-primary)] transition-colors"
                >
                  Back to selection
                </button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  )
}


