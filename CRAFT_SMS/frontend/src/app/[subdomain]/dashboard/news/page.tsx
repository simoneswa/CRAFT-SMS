"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useState, useEffect } from 'react'
import { Bell, Clock, User, Megaphone } from 'lucide-react'
import { useTenant } from '@/providers/TenantProvider'
import { supabase } from '@/lib/supabase'

export default function NewsFeedPage() {
  const { school } = useTenant()
  const [news, setNews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (school?.id) {
      // Fetch school-specific news or global news
      supabase
        .from('news_feed')
        .select('*, profiles(full_name, role)')
        .or(`school_id.eq.${school.id},is_global.eq.true`)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setNews(data || [])
          setIsLoading(false)
        })
    }
  }, [school])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2 text-white">News <span className="gradient-text">Feed</span></h1>
          <p className="text-gray-400">Important announcements and updates from your school and the CRAFT network.</p>
        </header>

        <div className="max-w-3xl space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            </div>
          ) : news.length === 0 ? (
            <div className="premium-card text-center py-20 text-gray-500">
               <Bell className="w-12 h-12 mx-auto mb-4 opacity-40" />
               <p>No announcements yet. Check back later!</p>
            </div>
          ) : (
            news.map((item) => (
              <div key={item.id} className="premium-card relative overflow-hidden group">
                {item.is_global && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl border-l border-b border-white/10">
                    System Global
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-none mb-1">CRAFT Admin</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Official Broadcast</p>
                  </div>
                </div>

                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                  {item.content}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                   <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                   </div>
                   <button className="text-[10px] text-teal-400 font-bold uppercase tracking-widest hover:underline">
                     Mark as read
                   </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
