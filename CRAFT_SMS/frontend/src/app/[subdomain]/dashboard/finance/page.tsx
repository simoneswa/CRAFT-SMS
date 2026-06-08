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
import { storageProvider } from '../../../../lib/storage'
import { generatePDFFromElement } from '../../../../lib/pdfGenerator'
import { ReceiptTemplate } from '../../../../components/finance/ReceiptTemplate'
import { fetchAPI } from '../../../../lib/api'

// ALL DATA SOURCED FROM /api/finance/slips — NO SUPABASE DIRECT CALLS

export default function FinancePage() {
  const { profile } = useAuth()
  const { school } = useTenant()
  const [slips, setSlips] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  const [modalState, setModalState] = useState<'NONE' | 'IMAGE' | 'REJECT' | 'SUBMIT'>('NONE')
  const [selectedSlip, setSelectedSlip] = useState<any>(null)
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null)
  const [receiptSlip, setReceiptSlip] = useState<any>(null)

  const [newSlip, setNewSlip] = useState({ amount: '', slip_number: '', file: null as File | null })

  const isBusiness = profile?.role === 'BUSINESS' || profile?.role === 'SCHOOL_ADMIN'
  const schoolId = school?.id
  const profileId = profile?.id
  const profileRole = profile?.role

  const fetchSlips = useCallback(async () => {
    if (!schoolId) return
    setIsLoading(true)
    try {
      // Build query params
      const params = new URLSearchParams()
      if (filter !== 'ALL') params.set('status', filter)
      if (profileRole === 'STUDENT' && profileId) params.set('student_id', profileId)

      const data = await fetchAPI(`/finance/slips?${params.toString()}`)
      setSlips(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('[FinancePage] fetchSlips error:', err)
      setSlips([])
    } finally {
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
      await fetchAPI(`/finance/slips/${slipId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          notes: notes ?? null,
          verified_by: profile?.id,
          verified_at: new Date().toISOString(),
        })
      })
      setModalState('NONE')
      fetchSlips()
    } catch (err) {
      console.error('[FinancePage] handleVerify error:', err)
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

      // 1. Upload proof of payment via StorageProvider
      const { path } = await storageProvider.uploadFile(
        school.id,
        'payment-slips',
        profile.id,
        newSlip.file
      )

      // 2. POST new slip record via real API — no mock fallback
      await fetchAPI('/finance/slips', {
        method: 'POST',
        body: JSON.stringify({
          school_id: school.id,
          student_id: profile.id,
          amount: parseFloat(newSlip.amount),
          slip_number: newSlip.slip_number,
          image_url: path,
          status: 'PENDING'
        })
      })

      setModalState('NONE')
      setNewSlip({ amount: '', slip_number: '', file: null })
      fetchSlips()
    } catch (err) {
      console.error('[FinancePage] handleSubmitSlip error:', err)
      alert('Failed to submit slip. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewImage = async (slip: any) => {
    setSelectedSlip(slip)
    setSelectedSlipUrl(null)
    setModalState('IMAGE')
    try {
      const path = slip.image_url
      if (!path || typeof path !== 'string') throw new Error('Missing or invalid image path.')

      if (path.startsWith('http')) {
        setSelectedSlipUrl(path) // legacy direct URL
      } else {
        // Fetch signed URL from our backend storage endpoint
        const res = await fetchAPI(`/storage/signed-url?path=${encodeURIComponent(path)}`)
        setSelectedSlipUrl(res?.url ?? 'ERROR')
      }
    } catch (e) {
      console.error(e)
      setSelectedSlipUrl('ERROR')
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Financial <span className="text-emerald-600">Management</span>
          </h1>
          <p className="text-slate-500">
            {isBusiness ? 'Review and verify student financial slips.' : 'Track your payments and submit new slips.'}
          </p>
        </div>
        {!isBusiness && (
          <button
            onClick={() => setModalState('SUBMIT')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#10b981] hover:bg-emerald-600 text-white font-bold transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Submit New Slip
          </button>
        )}
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending Verification', value: slips.filter(s => s.status === 'PENDING').length, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-600', border: 'border-amber-100' },
          { label: 'Total Verified', value: slips.filter(s => s.status === 'VERIFIED').length, icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', border: 'border-emerald-100' },
          { label: 'Total Rejected', value: slips.filter(s => s.status === 'REJECTED').length, icon: XCircle, bg: 'bg-rose-50', iconColor: 'text-rose-600', border: 'border-rose-100' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} border ${stat.border} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? '—' : stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 p-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by slip ID..."
            className="bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 pl-9 pr-4 py-2 text-sm w-64 text-slate-800"
          />
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {modalState === 'SUBMIT' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl max-w-md w-full relative z-10 p-6"
              >
                <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Submit Slip</h2>
                <p className="text-sm text-slate-500 mb-6">Enter your payment details and upload a photo of your slip.</p>

                <form onSubmit={handleSubmitSlip} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Slip Number</label>
                      <input
                        required
                        value={newSlip.slip_number}
                        onChange={e => setNewSlip({ ...newSlip, slip_number: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Amount ($)</label>
                      <input
                        required
                        type="number"
                        value={newSlip.amount}
                        onChange={e => setNewSlip({ ...newSlip, amount: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Proof of Payment</label>
                    <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all">
                      {newSlip.file ? (
                        <span className="text-sm text-emerald-600 font-bold">{newSlip.file.name}</span>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-xs text-slate-400">Tap to upload photo</span>
                        </>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={e => setNewSlip({ ...newSlip, file: e.target.files?.[0] ?? null })} />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#10b981] hover:bg-emerald-600 text-white font-extrabold rounded-2xl transition-all disabled:opacity-50"
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
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-2 relative z-10 min-h-[300px] flex items-center justify-center"
              >
                <button onClick={() => setModalState('NONE')} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 z-20"><X className="w-6 h-6" /></button>
                {!selectedSlipUrl ? (
                  <div className="flex flex-col items-center justify-center space-y-4 text-slate-400">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold animate-pulse">Requesting secure access...</p>
                  </div>
                ) : selectedSlipUrl === 'ERROR' ? (
                  <div className="flex flex-col items-center justify-center space-y-4 text-rose-500">
                    <AlertCircle className="w-12 h-12" />
                    <p className="text-sm font-bold text-slate-700">Access Denied or File Not Found</p>
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
                className="bg-white rounded-2xl shadow-xl max-w-md w-full relative z-10 p-6"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-2">Reject Slip</h3>
                <p className="text-sm text-slate-500 mb-6">Reason for rejecting slip #{selectedSlip.slip_number}:</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 text-slate-800 min-h-[100px] mb-6"
                />
                <div className="flex gap-3">
                  <button onClick={() => setModalState('NONE')} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
                  <button onClick={() => handleVerify(selectedSlip.id, 'REJECTED', rejectReason)} className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors">Reject Slip</button>
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
            <div key={i} className="bg-white rounded-xl border border-slate-100 animate-pulse h-24" />
          ))
        ) : slips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-100">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No slips found for this filter.</p>
          </div>
        ) : (
          slips.map((slip) => (
            <div key={slip.id} className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 hover:border-slate-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-bold text-sm ${
                  slip.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                  slip.status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                  'bg-amber-50 border-amber-100 text-amber-600'
                }`}>
                  {slip.profiles?.custom_id?.split('_').pop() ?? 'ID'}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800">{slip.profiles?.full_name ?? 'Unknown'}</h4>
                  <p className="text-xs text-slate-500">
                    Slip #{slip.slip_number} • {new Date(slip.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-xl font-bold text-slate-800">${slip.amount?.toFixed(2)}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    slip.status === 'VERIFIED' ? 'text-emerald-600' :
                    slip.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {slip.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-l border-slate-100 pl-8">
                  <button
                    onClick={() => handleViewImage(slip)}
                    className="p-3 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  {isBusiness && slip.status === 'PENDING' && (
                    <>
                      <button onClick={() => { setSelectedSlip(slip); setModalState('REJECT') }} className="p-3 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all">
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleVerify(slip.id, 'VERIFIED')} className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
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
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b981] hover:bg-emerald-600 text-white text-xs font-bold transition-all"
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

      {/* Hidden receipt template for PDF generation */}
      {receiptSlip && school && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <ReceiptTemplate slip={receiptSlip} school={school} />
        </div>
      )}
    </div>
  )
}
