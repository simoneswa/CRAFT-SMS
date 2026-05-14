"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GraduationCap, User, Building, Mail, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  
  return (
    <main className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-teal-500/10 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <GraduationCap className="text-white w-7 h-7" />
            </div>
            <span className="text-3xl font-bold tracking-tight">CRAFT <span className="text-teal-400">SMS</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Onboard your Institution</h1>
          <p className="text-gray-400 mt-3 text-lg">Join the unified educational ecosystem in Liberia.</p>
        </div>

        <div className="premium-card">
          {step === 1 ? (
             <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'School Admin', desc: 'Manage your institution', icon: Building, color: 'teal' },
                    { title: 'Teacher/Staff', desc: 'Access your classroom', icon: User, color: 'blue' },
                  ].map((role, i) => (
                    <button 
                      key={i}
                      onClick={() => setStep(2)}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/40 hover:bg-white/10 transition-all text-left group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-${role.color}-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <role.icon className={`w-6 h-6 text-${role.color}-400`} />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{role.title}</h3>
                      <p className="text-gray-500 text-sm">{role.desc}</p>
                    </button>
                  ))}
                </div>
                
                <div className="pt-6 border-t border-white/5 text-center">
                   <p className="text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link href="/login" className="text-teal-400 font-bold hover:underline">Sign In</Link>
                  </p>
                </div>
             </div>
          ) : (
            <form className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Full Name</label>
                    <input type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email</label>
                    <input type="email" placeholder="john@example.com" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Institution Name</label>
                  <input type="text" placeholder="Monrovia Academy" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all" />
               </div>

               <button 
                  type="button"
                  className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-2xl transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  Request Onboarding
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2 text-gray-500 text-sm font-medium hover:text-white transition-colors"
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
