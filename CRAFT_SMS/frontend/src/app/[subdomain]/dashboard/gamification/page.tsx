"use client"

import { DashboardLayout } from '../../../../components/dashboard/DashboardLayout'
import { Trophy, Medal, Star, Flame } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTenant } from '../../../../providers/TenantProvider'

export default function LeaderboardPage() {
  const { school } = useTenant()
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (school?.id) fetchLeaderboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      // Backend gamification endpoint pending. Setting to empty state.
      setEntries([])
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
      setEntries([])
    } finally {
      setIsLoading(false)
    }
  }

  const podiumIcons = [
    { label: 'Academic Champion', icon: Trophy, color: 'text-amber-400' },
    { label: 'Attendance Hero', icon: Flame, color: 'text-rose-500' },
    { label: 'Community Star', icon: Star, color: 'text-[var(--edlink-green-brand)]' },
  ]

  const top3 = entries.slice(0, 3)

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 text-white">School <span className="gradient-text">Leaderboard</span></h1>
          <p className="text-[var(--edlink-blue-text)]/70">Celebrate top performers, high attendance streaks, and academic excellence.</p>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--edlink-green-brand)]/20 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="premium-card text-center py-20">
            <Trophy className="w-12 h-12 text-[var(--edlink-blue-text)]/70 mx-auto mb-4" />
            <p className="text-[var(--edlink-blue-text)]/70">No leaderboard data yet. Start tracking student activity to populate rankings.</p>
          </div>
        ) : (
          <>
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {top3.map((entry, i) => {
                  const podium = podiumIcons[i]
                  const name = Array.isArray(entry.profiles) ? entry.profiles[0]?.full_name : entry.profiles?.full_name
                  return (
                    <div key={entry.id} className="premium-card text-center group hover:border-white/20 transition-all">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                        <podium.icon className={`w-8 h-8 ${podium.color}`} />
                      </div>
                      <h3 className="font-bold text-lg text-white">{name || 'Unknown'}</h3>
                      <p className="section-label mt-1">{podium.label}</p>
                      <p className="text-sm font-bold text-[var(--edlink-green-brand)] mt-2">{(entry.total_points || 0).toLocaleString()} pts</p>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="premium-card">
              <div className="flex items-center gap-3 mb-8">
                <Medal className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Full Rankings</h2>
              </div>
              <div className="space-y-4">
                {entries.map((entry, i) => {
                  const name = Array.isArray(entry.profiles) ? entry.profiles[0]?.full_name : entry.profiles?.full_name
                  const customId = Array.isArray(entry.profiles) ? entry.profiles[0]?.custom_id : entry.profiles?.custom_id
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <div className="flex items-center gap-6">
                        <span className="text-[var(--edlink-blue-text)]/70 font-bold w-4">#{i + 1}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-[var(--edlink-blue-text)]/70">
                            {name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-white">{name || 'Unknown Student'}</p>
                            <p className="text-[10px] text-[var(--edlink-green-brand)] font-bold uppercase tracking-widest">{entry.badge || customId || 'Member'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{(entry.total_points || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-[var(--edlink-blue-text)]/70 font-bold uppercase tracking-widest">Points</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

