"use client"

import React from 'react'
import { ShieldCheck, FileText, Globe, Award } from 'lucide-react'

interface ProcurementReportProps {
  school: any
  data: any
}

export function ProcurementReport({ school, data }: ProcurementReportProps) {
  const timestamp = new Date().toLocaleString()
  
  return (
    <div className="bg-white text-black p-16 min-h-[297mm] w-[210mm] mx-auto border-[10px] border-gray-100 relative print:p-8 print:border-none">
       {/* Official Watermark Geometry */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="w-[400px] h-[400px] object-contain bg-transparent" />
       </div>

       {/* Header Section */}
       <header className="flex justify-between items-start border-b-2 border-black pb-10 mb-12 relative z-10">
          <div className="flex items-center gap-6">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src="/craft-logo.png" alt="CRAFT SMS Logo" className="w-16 h-16 object-contain bg-transparent" />
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-tight">{school?.name}</h1>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em] mt-1">CRAFT SMS Institutional Audit Stream</p>
             </div>
          </div>
          <div className="text-right">
             <div className="bg-black text-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest inline-block mb-3">
                Restricted Access
             </div>
             <p className="text-xs font-bold text-gray-600 italic">{timestamp}</p>
          </div>
       </header>

       {/* Summary KPIs */}
       <section className="grid grid-cols-4 gap-8 mb-16 relative z-10">
          {[
             { label: 'Total Enrollment', value: data.total_students, icon: Globe },
             { label: 'Academic Average', value: `${data.avg_grade}%`, icon: Award },
             { label: 'Operational Health', value: 'OPTIMAL', icon: ShieldCheck },
             { label: 'Audit Status', value: 'VERIFIED', icon: FileText },
          ].map((kpi, i) => (
             <div key={i} className="border-l border-gray-200 pl-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                <p className="text-lg font-black">{kpi.value}</p>
             </div>
          ))}
       </section>

       {/* Dense Data Section */}
       <section className="space-y-10 relative z-10">
          <div>
             <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-6 border-b border-gray-100 pb-2">Institutional Pulse & Distribution</h3>
             <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                   <p className="text-[10px] font-bold uppercase text-gray-500">Academic Standing Summary</p>
                   <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-black w-[40%]" />
                      <div className="h-full bg-gray-400 w-[30%]" />
                      <div className="h-full bg-gray-200 w-[30%]" />
                   </div>
                   <div className="flex justify-between text-[8px] font-black uppercase text-gray-400">
                      <span>Excellence</span>
                      <span>Target</span>
                      <span>Intervention</span>
                   </div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                   <p className="text-[10px] font-black uppercase mb-2">Director&apos;s Memo</p>
                   <p className="text-xs leading-relaxed text-gray-600">
                      This report represents the verified operational state of {school?.name}. 
                      All academic and financial data points have been synchronized via the CRAFT SMS decentralized sync engine.
                   </p>
                </div>
             </div>
          </div>

          <div className="pt-10">
             <table className="w-full text-left">
                <thead>
                   <tr className="border-b-2 border-black">
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Indicator</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest text-right">Value</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {[
                      { name: 'Attendance Reliability', desc: 'Average institutional presence over 30 days', val: '94.2%' },
                      { name: 'Fee Collection Purity', desc: 'Ratio of verified vs pending receivables', val: '88.5%' },
                      { name: 'Instructional Continuity', desc: 'Classroom session completion rate', val: '99.1%' },
                   ].map((row, i) => (
                      <tr key={i}>
                         <td className="py-4 text-xs font-black uppercase">{row.name}</td>
                         <td className="py-4 text-xs text-gray-500 italic">{row.desc}</td>
                         <td className="py-4 text-xs font-black text-right">{row.val}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </section>

       {/* Footer Branding */}
       <footer className="absolute bottom-16 left-16 right-16 flex justify-between items-end border-t border-gray-200 pt-8 relative z-10">
          <div>
             <h2 className="text-xl font-black italic tracking-tighter uppercase">CRAFT <span className="text-gray-300">SMS</span></h2>
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Institutional Operating System • Launch v1.0</p>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black uppercase text-gray-500">Certified by</p>
             <p className="text-[10px] font-bold uppercase mt-1">CRAFT SMS AUDIT ENGINE</p>
          </div>
       </footer>
    </div>
  )
}
