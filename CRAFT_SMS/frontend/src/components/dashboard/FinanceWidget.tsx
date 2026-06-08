import React, { useState, useEffect } from 'react'
import { DollarSign, FileText, CheckCircle, Search, Download, TrendingUp, AlertTriangle } from 'lucide-react'
import { useTenant } from '../../providers/TenantProvider'
import { useAuth } from '../../providers/AuthProvider'
import { fetchAPI } from '../../lib/api'

// NO MOCK DATA — all transactions fetched from /api/finance/slips

export function FinanceWidget() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { school } = useTenant()
  const { profile } = useAuth()

  useEffect(() => {
    let isMounted = true
    const loadTransactions = async () => {
      if (!school?.id) return
      try {
        setIsLoading(true)
        setError(null)
        // Real API call — no mock fallback
        const data = await fetchAPI('/finance/slips?limit=5')
        if (isMounted) {
          setTransactions(Array.isArray(data) ? data : [])
        }
      } catch (err: any) {
        if (isMounted) {
          setError('Could not load transactions.')
          setTransactions([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    loadTransactions()
    return () => { isMounted = false }
  }, [school?.id])

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--edlink-green-brand)]/10 border border-[var(--edlink-green-brand)]/20 hover:bg-[var(--edlink-green-brand)]/20 transition-all group">
          <DollarSign className="w-6 h-6 text-[var(--edlink-green-brand)] mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-[var(--edlink-blue-text)] uppercase tracking-widest">New Receipt</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group">
          <CheckCircle className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-[var(--edlink-blue-text)] uppercase tracking-widest">Approval</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group">
          <Search className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-[var(--edlink-blue-text)] uppercase tracking-widest">Student Lookup</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-all group">
          <Download className="w-6 h-6 text-[var(--edlink-blue-text)]/70 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Reports</span>
        </button>
      </div>

      {/* Recent Transactions Card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-[var(--edlink-blue-text)]">Recent Transactions</h3>
          <div className="flex items-center gap-2 text-[10px] text-[var(--edlink-green-brand)] font-bold uppercase tracking-widest bg-[var(--edlink-green-brand)]/10 px-3 py-1.5 rounded-lg border border-[var(--edlink-divider-blue)]">
            <TrendingUp className="w-3 h-3" />
            Live Sync
          </div>
        </div>

        <div className="space-y-3 min-h-[100px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full py-8">
              <div className="w-6 h-6 border-2 border-[var(--edlink-green-brand)]/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertTriangle className="w-6 h-6 text-rose-500 mb-2" />
              <p className="text-sm text-[var(--edlink-blue-text)]/70">Transactions unavailable.</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-[var(--edlink-blue-text)]/70">No recent financial transactions found.</p>
            </div>
          ) : (
            transactions.map((trx, i) => (
              <div
                key={trx.id || i}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    trx.status === 'VERIFIED' ? 'bg-[var(--edlink-green-brand)]/10 text-[var(--edlink-green-brand)]' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--edlink-blue-text)]">{trx.profiles?.full_name ?? 'Unknown Student'}</p>
                    <p className="text-[10px] text-[var(--edlink-blue-text)]/70 uppercase tracking-widest mt-0.5">
                      Slip #{trx.slip_number} • Fee
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[var(--edlink-blue-text)]">${Number(trx.amount).toFixed(2)}</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                    trx.status === 'VERIFIED' ? 'text-[var(--edlink-green-brand)]' : 'text-amber-600'
                  }`}>
                    {trx.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
