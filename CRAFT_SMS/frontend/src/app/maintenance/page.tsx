"use client"

import React from 'react'
import { Settings, ShieldAlert, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full text-center"
      >
        <div className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-orange-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-rose-500/20 mb-8 relative">
          <Settings className="w-12 h-12 text-white animate-[spin_4s_linear_infinite]" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center">
             <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <h1 className="text-4xl font-black mb-4 tracking-tight">System <span className="text-rose-400">Maintenance</span></h1>
        
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl mb-8">
           <p className="text-[var(--edlink-blue-text)]/70 leading-relaxed mb-6">
             The CRAFT SMS platform is currently undergoing scheduled maintenance to upgrade our infrastructure and improve performance. Normal operations will resume shortly.
           </p>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl">
                 <p className="text-[10px] font-bold text-[var(--edlink-blue-text)]/70 uppercase tracking-widest mb-1">Status</p>
                 <p className="font-bold text-amber-400 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Upgrading
                 </p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl">
                 <p className="text-[10px] font-bold text-[var(--edlink-blue-text)]/70 uppercase tracking-widest mb-1">Est. Return</p>
                 <p className="font-bold text-white">In 2 Hours</p>
              </div>
           </div>
        </div>

        <button 
           onClick={() => window.location.reload()}
           className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10"
        >
           Check Status Again
        </button>

        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-[var(--edlink-blue-text)]/70">
           <Mail className="w-4 h-4" />
           Need emergency access? <a href="mailto:support@craftsms.com" className="text-rose-400 hover:underline">Contact Support</a>
        </div>
      </motion.div>
    </main>
  )
}
