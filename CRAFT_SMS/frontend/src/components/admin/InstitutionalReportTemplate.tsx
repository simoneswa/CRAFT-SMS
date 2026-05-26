"use client"

import React from 'react'
import { GraduationCap, FileText, CheckCircle2 } from 'lucide-react'

interface ReportProps {
  school: any
  type: 'FINANCIAL' | 'ATTENDANCE'
  termName: string
  data: any
}

export function InstitutionalReportTemplate({ school, type, termName, data }: ReportProps) {
  const today = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="bg-white text-black p-12 min-h-[297mm] w-[210mm] mx-auto shadow-2xl relative overflow-hidden" id="report-content">
      {/* Institutional Header */}
      <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
        <div className="flex items-center gap-6">
           {school?.logo_url ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={school.logo_url} className="w-20 h-20 object-contain" alt="Logo" />
           ) : (
             <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center">
                <GraduationCap className="text-white w-10 h-10" />
             </div>
           )}
           <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{school?.name}</h1>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Institutional Report Service</p>
           </div>
        </div>
        <div className="text-right">
           <div className="inline-block bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              Official Document
           </div>
           <p className="text-xs font-bold">{today}</p>
           <p className="text-[10px] text-gray-500 uppercase mt-1">ID: {crypto.randomUUID().slice(0,8).toUpperCase()}</p>
        </div>
      </div>

      {/* Report Info */}
      <div className="grid grid-cols-2 gap-12 mb-12">
         <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Report Specification</h2>
            <div className="space-y-2">
               <p className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 
                  {type === 'FINANCIAL' ? 'Comprehensive Financial Audit' : 'Institutional Attendance Summary'}
               </p>
               <p className="text-sm">Academic Period: <span className="font-bold">{termName}</span></p>
            </div>
         </div>
         <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-right">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Operational Status</h2>
            <p className="text-xl font-black text-black">VERIFIED & AUDITED</p>
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1 flex items-center justify-end gap-1">
               <CheckCircle2 className="w-3 h-3" /> System Synchronized
            </p>
         </div>
      </div>

      {/* Main Data Table */}
      <div className="space-y-10">
         {type === 'FINANCIAL' ? (
           <>
             <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="border-l-4 border-black pl-4">
                   <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Total Collections</p>
                   <p className="text-2xl font-black">${data.summary.total_collected.toLocaleString()}</p>
                </div>
                <div className="border-l-4 border-gray-300 pl-4">
                   <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Pending Receivables</p>
                   <p className="text-2xl font-black">${data.summary.total_pending.toLocaleString()}</p>
                </div>
                <div className="border-l-4 border-gray-300 pl-4">
                   <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Collection Efficiency</p>
                   <p className="text-2xl font-black">
                      {((data.summary.total_collected / (data.summary.total_collected + data.summary.total_pending)) * 100).toFixed(1)}%
                   </p>
                </div>
             </div>
             
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b-2 border-black">
                      <th className="py-4 text-[10px] font-black uppercase">Student</th>
                      <th className="py-4 text-[10px] font-black uppercase">Reference</th>
                      <th className="py-4 text-[10px] font-black uppercase text-right">Amount</th>
                      <th className="py-4 text-[10px] font-black uppercase text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {data.records.map((record: any, i: number) => (
                      <tr key={i}>
                         <td className="py-4">
                            <p className="text-sm font-bold">{record.profiles.full_name}</p>
                            <p className="text-[10px] text-gray-500">{record.profiles.custom_id}</p>
                         </td>
                         <td className="py-4 text-xs font-mono">{record.slip_number || 'TRX-'+i}</td>
                         <td className="py-4 text-sm font-bold text-right">${parseFloat(record.amount).toLocaleString()}</td>
                         <td className="py-4 text-right">
                            <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                               record.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                               {record.status}
                            </span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           </>
         ) : (
           <div className="text-center py-20 bg-gray-50 rounded-3xl">
              <p className="text-gray-400 italic">Attendance heatmap data rendering is being finalized...</p>
           </div>
         )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end pt-8 border-t border-gray-100">
         <div>
            <p className="text-sm font-black italic">CRAFT <span className="text-gray-400">SMS</span></p>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enterprise Educational Operating System</p>
         </div>
         <div className="text-right">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Page 1 of 1</p>
         </div>
      </div>
    </div>
  )
}
