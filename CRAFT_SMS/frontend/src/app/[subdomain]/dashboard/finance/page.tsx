"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Plus,
  Download,
  Upload,
  X,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../../../providers/AuthProvider'
import { useTenant } from '../../../../providers/TenantProvider'
import { supabase } from '../../../../lib/supabase'
import { storageProvider } from '../../../../lib/storage'
import { generatePDFFromElement } from '../../../../lib/pdfGenerator'
import { ReceiptTemplate } from '../../../../components/finance/ReceiptTemplate'

export default function FinancePage() {
  const { profile } = useAuth()
  const { school } = useTenant()
  const [slips, setSlips] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, PENDING, VERIFIED, REJECTED
  
  const [modalState, setModalState] = useState<'NONE' | 'IMAGE' | 'REJECT' | 'SUBMIT'>('NONE')
  const [selectedSlip, setSelectedSlip] = useState<any>(null)
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null) 
  const [receiptSlip, setReceiptSlip] = useState<any>(null) 
  
  const [newSlip, setNewSlip] = useState({ amount: '', slip_number: '', file: null as File | null })
  
  const isBusiness = profile?.role === 'BUSINESS' || profile?.role === 'SCHOOL_ADMIN'

  // Stabilise primitive deps to prevent identity-change re-render loops.
  const schoolId = school?.id
  const profileId = profile?.id
  const profileRole = profile?.role

  const fetchSlips = useCallback(async () => {
    if (!schoolId) return
    setIsLoading(true)
    try {
      let query = supabase
        .from('slips')
        .select('*, profiles!student_id(full_name, custom_id)')
        .eq('school_id', schoolId)
        .order('created_at', { ascending: false })

      if (filter !== 'ALL') {
        query = query.eq('status', filter)
      }

      if (profileRole === 'STUDENT' && profileId) {
        query = query.eq('student_id', profileId)
      }

      const { data, error } = await query
      if (error) throw error
      setSlips(data || [])
    } catch (err) {
      console.error('Error fetching slips:', err)
    } finally {
      // Always clear loading — even on network failure — to prevent endless spinner.
      setIsLoading(false)
    }
  }, [schoolId, profileId, profileRole, filter])

  useEffect(() => {
    if (schoolId && profileId) {
      fetchSlips()
    }
  }, [fetchSlips, schoolId, profileId])

  const handleVerify = async (slipId: string, status: 'VERIFIED' | 'REJECTED', notes?: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('slips')
        .update({ 
          status, 
          verified_by: profile?.id,
          verified_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', slipId)

      if (error) throw error
      setModalState('NONE')
      fetchSlips()
    } catch (err) {
      console.error('Error verifying slip:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitSlip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSlip.file || !newSlip.amount || !newSlip.slip_number) return
    setIsSubmitting(true)

    try {
      if (!school?.id || !profile?.id) {
        throw new Error('Missing school or profile context.')
      }
      // 1. Upload File via StorageProvider
      const { path } = await storageProvider.uploadFile(
        school.id,
        'payment-slips',
        profile.id,
        newSlip.file
      )
      
      // Notify backend to audit the upload
      const sessionData = await supabase.auth.getSession()
      const token = sessionData.data.session?.access_token
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/v1$/, '') || 'http://localhost:8000/api'}/v1/storage/audit-upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ path })
        }).catch(err => console.warn('Audit upload failed:', err))
      }

      // 2. Insert Record
      const { error: insertError } = await supabase.from('slips').insert({
        school_id: school?.id,
        student_id: profile?.id,
        amount: parseFloat(newSlip.amount),
        slip_number: newSlip.slip_number,
        image_url: path,
        status: 'PENDING'
      })

      if (insertError) throw insertError

      setModalState('NONE')
      setNewSlip({ amount: '', slip_number: '', file: null })
      fetchSlips()
    } catch (err) {
      console.error('Error submitting slip:', err)
      alert('Failed to submit slip. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Financial <span className="gradient-text">Management</span></h1>
          <p className="text-gray-400">
            {isBusiness ? 'Review and verify student financial slips.' : 'Track your payments and submit new slips.'}
          </p>
        </div>
        {!isBusiness && (
          <button 
            onClick={() => setModalState('SUBMIT')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold transition-all shadow-lg shadow-teal-500/20"
          >
            <Plus className="w-5 h-5" />
            Submit New Slip
          </button>
        )}
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Verification', value: slips.filter(s => s.status === 'PENDING').length, icon: Clock, color: 'amber' },
          { label: 'Total Verified', value: slips.filter(s => s.status === 'VERIFIED').length, icon: CheckCircle2, color: 'emerald' },
          { label: 'Total Rejected', value: slips.filter(s => s.status === 'REJECTED').length, icon: XCircle, color: 'rose' },
        ].map((stat, i) => (
          <div key={i} className="premium-card">
            <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/10 flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
            </div>
            <p className="section-label mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 p-2 bg-white/5 border border-white/10 rounded-2xl">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative hidden md:block">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
           <input type="text" placeholder="Search by slip ID..." className="bg-transparent border-none focus:outline-none pl-9 pr-4 py-2 text-sm w-64 text-white" />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalState !== 'NONE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalState('NONE')}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {modalState === 'SUBMIT' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="premium-card max-w-md w-full relative z-10"
              >
                 <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                 <h2 className="text-2xl font-bold mb-2 text-white">Submit Slip</h2>
                 <p className="text-sm text-gray-400 mb-6">Enter your payment details and upload a photo of your slip.</p>

                 <form onSubmit={handleSubmitSlip} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="section-label">Slip Number</label>
                          <input 
                            required 
                            value={newSlip.slip_number}
                            onChange={e => setNewSlip({...newSlip, slip_number: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 text-white" 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="section-label">Amount ($)</label>
                          <input 
                            required 
                            type="number"
                            value={newSlip.amount}
                            onChange={e => setNewSlip({...newSlip, amount: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500/50 text-white" 
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="section-label">Proof of Payment</label>
                       <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-teal-500/50 hover:bg-teal-500/5 transition-all">
                          {newSlip.file ? (
                             <span className="text-sm text-teal-400 font-bold">{newSlip.file.name}</span>
                          ) : (
                             <>
                               <Upload className="w-6 h-6 text-gray-500 mb-2" />
                               <span className="text-xs text-gray-500">Tap to upload photo</span>
                             </>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={e => setNewSlip({...newSlip, file: e.target.files?.[0] || null})} />
                       </label>
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-2xl transition-all disabled:opacity-50"
                    >
                       {isSubmitting ? 'Uploading...' : 'Submit for Verification'}
                    </button>
                 </form>
              </motion.div>
            )}

            {modalState === 'IMAGE' && selectedSlip && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="premium-card max-w-2xl w-full p-2 relative z-10 min-h-[300px] flex items-center justify-center"
              >
                 <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white z-20"><X className="w-6 h-6" /></button>
                 {!selectedSlipUrl ? (
                   <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
                     <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                     <p className="text-sm font-bold animate-pulse">Requesting secure access...</p>
                   </div>
                 ) : selectedSlipUrl === 'ERROR' ? (
                   <div className="flex flex-col items-center justify-center space-y-4 text-rose-500">
                     <AlertCircle className="w-12 h-12" />
                     <p className="text-sm font-bold">Access Denied or File Not Found</p>
                   </div>
                 ) : (
                   /* eslint-disable-next-line @next/next/no-img-element */
                   <img src={selectedSlipUrl} alt="Slip Proof" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
                 )}
              </motion.div>
            )}

            {modalState === 'REJECT' && selectedSlip && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="premium-card max-w-md w-full relative z-10"
              >
                 <h3 className="text-xl font-bold mb-2 text-white">Reject Slip</h3>
                 <p className="text-sm text-gray-400 mb-6">Reason for rejecting slip #{selectedSlip.slip_number}:</p>
                 <textarea 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-teal-500/50 text-white min-h-[100px] mb-6"
                 />
                 <div className="flex gap-3">
                    <button onClick={() => setModalState('NONE')} className="flex-1 py-3 bg-white/5 rounded-xl font-bold">Cancel</button>
                    <button onClick={() => handleVerify(selectedSlip.id, 'REJECTED', rejectReason)} className="flex-1 py-3 bg-rose-500 text-black rounded-xl font-bold">Reject Slip</button>
                 </div>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Slip List */}
      <div className="space-y-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
             <div key={i} className="premium-card animate-pulse h-24 bg-white/5" />
          ))
        ) : slips.length === 0 ? (
          <div className="text-center py-20 premium-card">
            <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">No slips found for this filter.</p>
          </div>
        ) : (
          slips.map((slip) => (
            <div key={slip.id} className="premium-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-sm ${
                  slip.status === 'VERIFIED' ? 'text-emerald-400' : 
                  slip.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {slip.profiles?.custom_id?.split('_').pop() || 'ID'}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-white">{slip.profiles?.full_name}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    Slip #{slip.slip_number} • {new Date(slip.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xl font-bold text-white">${slip.amount.toFixed(2)}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    slip.status === 'VERIFIED' ? 'text-emerald-400' : 
                    slip.status === 'REJECTED' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {slip.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-l border-white/10 pl-8">
                   <button 
                     onClick={async () => { 
                       setSelectedSlip(slip); 
                       setSelectedSlipUrl(null);
                       setModalState('IMAGE'); 
                       try {
                         const sessionData = await supabase.auth.getSession();
                         const token = sessionData.data.session?.access_token || '';
                         
                         // Determine path: backwards compatibility for old slips with HTTP URLs
                         const path = slip.image_url;
                         if (!path || typeof path !== 'string') {
                           throw new Error('Missing or invalid image path.');
                         }
                         
                         if (path.startsWith('http')) {
                           setSelectedSlipUrl(path); // Legacy URL
                         } else {
                           const signedUrl = await storageProvider.getSignedUrl(path, token);
                           setSelectedSlipUrl(signedUrl);
                         }
                       } catch (e) {
                         console.error(e);
                         setSelectedSlipUrl('ERROR');
                       }
                     }} 
                     className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-all"
                   >
                      <FileText className="w-5 h-5" />
                   </button>
                   {isBusiness && slip.status === 'PENDING' && (
                     <>
                        <button onClick={() => { setSelectedSlip(slip); setModalState('REJECT'); }} className="p-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all">
                           <XCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleVerify(slip.id, 'VERIFIED')} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                           <CheckCircle2 className="w-5 h-5" />
                        </button>
                     </>
                   )}
                   {slip.status === 'VERIFIED' && (
                     <button
                        onClick={async () => {
                          setReceiptSlip(slip)
                          setGeneratingPdf(slip.id)
                          await new Promise(r => setTimeout(r, 200))
                          try {
                            await generatePDFFromElement('receipt-template', `Receipt-${slip.slip_number}`)
                          } finally {
                            setGeneratingPdf(null)
                            setReceiptSlip(null)
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 text-black text-xs font-bold hover:bg-teal-400 transition-all"
                     >
                        <Download className="w-4 h-4" />
                        Receipt
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Hidden receipt template */}
      {receiptSlip && school && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <ReceiptTemplate slip={receiptSlip} school={school} />
        </div>
      )}
    </div>
  )
}
