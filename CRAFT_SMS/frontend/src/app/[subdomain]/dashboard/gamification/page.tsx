"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Trophy, Medal, Star, Flame, Target } from 'lucide-react'

export default function LeaderboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 text-white">School <span className="gradient-text">Leaderboard</span></h1>
          <p className="text-gray-400">Celebrate top performers, high attendance streaks, and academic excellence.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: 'Academic Giant', student: 'Student A', icon: Trophy, color: 'text-amber-400' },
             { label: 'Attendance Hero', student: 'Student B', icon: Flame, color: 'text-rose-500' },
             { label: 'Community Star', student: 'Student C', icon: Star, color: 'text-teal-400' },
           ].map((podium, i) => (
             <div key={i} className="premium-card text-center group hover:border-white/20 transition-all">
                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform`}>
                   <podium.icon className={`w-8 h-8 ${podium.color}`} />
                </div>
                <h3 className="font-bold text-lg text-white">{podium.student}</h3>
                <p className="section-label mt-1">{podium.label}</p>
             </div>
           ))}
        </div>

        <div className="premium-card">
           <div className="flex items-center gap-3 mb-8">
              <Medal className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Full Rankings</h2>
           </div>

           <div className="space-y-4">
              {[
                { rank: 4, name: 'Swaray S.', score: 2450, badge: 'Scholar' },
                { rank: 5, name: 'Fatu K.', score: 2100, badge: 'Elite' },
                { rank: 6, name: 'Momoh J.', score: 1850, badge: 'Rising' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                   <div className="flex items-center gap-6">
                      <span className="text-gray-500 font-bold w-4">#{row.rank}</span>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                           {row.name.charAt(0)}
                         </div>
                         <div>
                            <p className="font-bold text-sm text-white">{row.name}</p>
                            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">{row.badge}</p>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-white">{row.score.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Points</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
