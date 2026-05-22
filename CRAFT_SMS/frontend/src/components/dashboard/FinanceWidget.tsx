import React from 'react';
import { DollarSign, FileText, CheckCircle, Search, Download, TrendingUp } from 'lucide-react';

export function FinanceWidget() {
  return (
    <div className="space-y-6">
      {/* Quick Actions for Business Office */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all group">
          <DollarSign className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">New Receipt Entry</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all group">
          <CheckCircle className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Payment Approval</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group">
          <Search className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Student Lookup</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
          <Download className="w-6 h-6 text-gray-400 mb-2 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Financial Reports</span>
        </button>
      </div>

      <div className="premium-card bg-white/[0.01] border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
          <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            Live Sync
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { id: 'TRX-9982', student: 'John Smith', type: 'Tuition Fee', amount: '$500.00', status: 'VERIFIED' },
            { id: 'TRX-9983', student: 'Sarah Doe', type: 'Lab Fee', amount: '$50.00', status: 'PENDING' },
            { id: 'TRX-9984', student: 'Michael Brown', type: 'Tuition Fee', amount: '$250.00', status: 'VERIFIED' },
          ].map((trx, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  trx.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white">{trx.student}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{trx.id} • {trx.type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white">{trx.amount}</p>
                <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
                  trx.status === 'VERIFIED' ? 'text-emerald-500' : 'text-amber-500'
                }`}>{trx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
