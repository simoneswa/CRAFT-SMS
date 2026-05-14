"use client"

import React from 'react'
import { BookOpen, Clock, CreditCard, ChevronRight } from 'lucide-react'

export function ParentDashboardWidget() {
  return (
    <div className="space-y-6">
      <div className="premium-card bg-teal-500/5 border-teal-500/10">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Children Overview</h3>
            <div className="flex gap-2">
               <button className="px-3 py-1.5 rounded-lg bg-teal-500 text-black text-[10px] font-black uppercase">Sarah</button>
               <button className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-500 text-[10px] font-black uppercase hover:bg-white/10 transition-all">Michael</button>
            </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Current Attendance</p>
               <p className="text-xl font-bold text-emerald-400">98.2%</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Recent Avg Grade</p>
               <p className="text-xl font-bold text-teal-400">92.4%</p>
            </div>
         </div>
      </div>

      <div className="premium-card">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <button className="text-teal-400 text-xs font-bold hover:text-teal-300 transition-all flex items-center gap-1">
               Detailed View <ChevronRight className="w-3 h-3" />
            </button>
         </div>
         <div className="space-y-4">
            {[
              { type: 'GRADE', msg: 'New grade published: Mathematics (94%)', time: '2h ago', icon: BookOpen, color: 'purple' },
              { type: 'ATTENDANCE', msg: 'Sarah was marked LATE for Chemistry', time: '1d ago', icon: Clock, color: 'amber' },
              { type: 'FINANCE', msg: 'Term 1 Fee slip verified successfully', time: '2d ago', icon: CreditCard, color: 'emerald' },
            ].map((activity, i) => (
               <div key={i} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className={`w-10 h-10 rounded-xl bg-${activity.color}-500/10 flex items-center justify-center shrink-0`}>
                     <activity.icon className={`w-5 h-5 text-${activity.color}-400`} />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-bold text-white mb-1">{activity.msg}</p>
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{activity.time}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  )
}
