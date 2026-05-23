"use client"

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'
import { useState } from 'react'
import { Megaphone, Send } from 'lucide-react'

export default function AnnouncementsPage() {
  const { profile } = useAuth()
  const [content, setContent] = useState('')
  const [isGlobal, setIsGlobal] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePost = async () => {
    if (!content.trim()) return
    setIsPosting(true)
    await supabase.from('news_feed').insert({
      author_id: profile?.id,
      content,
      is_global: isGlobal,
    })
    setContent('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    setIsPosting(false)
  }

  return (
    <>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">System <span className="gradient-text">Announcements</span></h1>
          <p className="text-gray-400">Broadcast messages to all schools or specific tenants.</p>
        </header>

        <div className="premium-card space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-teal-400" />
            Compose Announcement
          </h3>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Type your platform-wide message here..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-teal-500/50 transition-colors min-h-[120px]"
          />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={e => setIsGlobal(e.target.checked)}
                className="w-4 h-4 accent-teal-500"
              />
              <span className="text-sm font-bold">Global (visible to all schools)</span>
            </label>
          </div>

          {success && (
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-bold">
              ✓ Announcement posted successfully.
            </div>
          )}

          <button
            onClick={handlePost}
            disabled={!content.trim() || isPosting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {isPosting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </>
  )
}
