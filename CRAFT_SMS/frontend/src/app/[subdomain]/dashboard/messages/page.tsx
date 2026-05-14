"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Search, 
  Megaphone, 
  User, 
  Clock, 
  MoreVertical,
  Paperclip,
  AlertTriangle,
  Users
} from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { useTenant } from '@/providers/TenantProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { fetchAPI } from '@/lib/api'
import { supabase } from '@/lib/supabase'

export default function CommunicationCenter() {
  const { profile } = useAuth()
  const { school } = useTenant()
  
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BROADCAST'>('CHAT')
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadInitialData()
    }
  }, [profile])

  const loadInitialData = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch relevant contacts (teachers if student/parent, all if admin)
      // For now, let's fetch profiles in the same school
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url, custom_id')
        .eq('school_id', school?.id)
        .neq('id', profile?.id)
        .limit(20)
      
      setContacts(profileData || [])
      
      // 2. Fetch Broadcasts
      const bcData = await fetchAPI('/messages/broadcasts')
      setBroadcasts(bcData)
    } catch (err) {
      console.error('Failed to load communication data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedContact) {
      loadMessages(selectedContact.id)
      
      // Subscribe to real-time messages
      const channel = supabase
        .channel(`chat:${selectedContact.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `sender_id=eq.${selectedContact.id},receiver_id=eq.${profile?.id}`
        }, (payload) => {
            setMessages(prev => [...prev, payload.new])
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
  }, [selectedContact])

  const loadMessages = async (contactId: string) => {
    try {
      const data = await fetchAPI(`/messages/direct/${contactId}`)
      setMessages(data)
    } catch (err) {
      console.error('Failed to load messages:', err)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedContact) return
    
    const tempMsg = {
        sender_id: profile?.id,
        receiver_id: selectedContact.id,
        content: newMessage,
        created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, tempMsg])
    const text = newMessage
    setNewMessage('')
    
    try {
      await fetchAPI('/messages/direct', {
        method: 'POST',
        body: JSON.stringify({
            receiver_id: selectedContact.id,
            content: text
        })
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-12rem)] flex flex-col gap-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-white">Communication <span className="gradient-text">Center</span></h1>
            <p className="text-gray-400">Institutional messaging and announcement broadcasts.</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start">
            <button 
              onClick={() => setActiveTab('CHAT')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'CHAT' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <User className="w-3.5 h-3.5" />
              Direct Messages
            </button>
            <button 
              onClick={() => setActiveTab('BROADCAST')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'BROADCAST' ? 'bg-teal-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              School Broadcasts
            </button>
          </div>
        </header>

        <div className="flex-1 flex gap-6 overflow-hidden">
           {/* Sidebar */}
           <div className="w-80 premium-card p-0 flex flex-col overflow-hidden shrink-0">
              <div className="p-4 border-b border-white/5">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search contacts..." 
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500/50 text-white"
                    />
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                 {activeTab === 'CHAT' ? (
                    contacts.map(contact => (
                       <button
                         key={contact.id}
                         onClick={() => setSelectedContact(contact)}
                         className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedContact?.id === contact.id ? 'bg-teal-500/10 border border-teal-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                       >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-800 to-gray-700 border border-white/10 flex items-center justify-center font-bold text-xs text-gray-400 shrink-0">
                             {contact.full_name?.charAt(0)}
                          </div>
                          <div className="text-left min-w-0">
                             <p className="font-bold text-sm text-white truncate">{contact.full_name}</p>
                             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{contact.role}</p>
                          </div>
                       </button>
                    ))
                 ) : (
                    broadcasts.map(bc => (
                       <button
                         key={bc.id}
                         onClick={() => setSelectedContact(bc)}
                         className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedContact?.id === bc.id ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                       >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bc.is_emergency ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                             <Megaphone className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0">
                             <p className="font-bold text-sm text-white truncate">{bc.title}</p>
                             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{new Date(bc.created_at).toLocaleDateString()}</p>
                          </div>
                       </button>
                    ))
                 )}
              </div>
           </div>

           {/* Main View */}
           <div className="flex-1 premium-card p-0 flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                 {selectedContact ? (
                    <motion.div 
                      key={selectedContact.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1 flex flex-col overflow-hidden"
                    >
                       {/* Chat Header */}
                       <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                {activeTab === 'CHAT' ? <User className="w-5 h-5 text-teal-400" /> : <Megaphone className="w-5 h-5 text-amber-400" />}
                             </div>
                             <div>
                                <h3 className="font-bold text-white">{activeTab === 'CHAT' ? selectedContact.full_name : selectedContact.title}</h3>
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                                   {activeTab === 'CHAT' ? selectedContact.role : `Broadcasted by ${selectedContact.profiles?.full_name || 'Admin'}`}
                                </p>
                             </div>
                          </div>
                          <button className="p-2 hover:bg-white/5 rounded-lg transition-all text-gray-500"><MoreVertical className="w-5 h-5" /></button>
                       </div>

                       {/* Content Area */}
                       <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                          {activeTab === 'CHAT' ? (
                             messages.map((m, i) => (
                                <div key={i} className={`flex ${m.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                                      m.sender_id === profile?.id ? 'bg-teal-500 text-black font-medium' : 'bg-white/5 border border-white/10 text-white'
                                   }`}>
                                      {m.content}
                                      <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest ${m.sender_id === profile?.id ? 'text-black/50' : 'text-gray-500'}`}>
                                         {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                   </div>
                                </div>
                             ))
                          ) : (
                             <div className="space-y-4">
                                {selectedContact.is_emergency && (
                                   <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400">
                                      <AlertTriangle className="w-5 h-5" />
                                      <span className="text-xs font-black uppercase tracking-widest">Emergency Notification</span>
                                   </div>
                                )}
                                <div className="text-white leading-relaxed whitespace-pre-wrap text-sm">
                                   {selectedContact.content}
                                </div>
                             </div>
                          )}
                       </div>

                       {/* Message Input (Chat only) */}
                       {activeTab === 'CHAT' && (
                          <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                             <form onSubmit={handleSendMessage} className="flex gap-3">
                                <button type="button" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-500"><Paperclip className="w-5 h-5" /></button>
                                <input 
                                  value={newMessage}
                                  onChange={e => setNewMessage(e.target.value)}
                                  placeholder="Type your message..." 
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 text-white"
                                />
                                <button type="submit" className="p-3 bg-teal-500 hover:bg-teal-400 rounded-xl transition-all text-black shadow-lg shadow-teal-500/20">
                                   <Send className="w-5 h-5" />
                                </button>
                             </form>
                          </div>
                       )}
                    </motion.div>
                 ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-12 text-center">
                       <Users className="w-16 h-16 mb-6 opacity-20" />
                       <h3 className="text-xl font-medium text-white mb-2">No Active Thread</h3>
                       <p className="max-w-xs text-sm">Select a contact to start messaging or view school broadcasts.</p>
                    </div>
                 )}
              </AnimatePresence>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
