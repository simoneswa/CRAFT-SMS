"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Download, 
  Printer, 
  ChevronLeft,
  Trophy,
  BookOpen,
  Calendar
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useTenant } from '@/providers/TenantProvider'
import { useAuth } from '@/providers/AuthProvider'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { fetchAPI } from '@/lib/api'
import { generatePDFFromElement } from '@/lib/pdfGenerator'

export default function ReportCardPage() {
  const router = useRouter()
  const { subdomain } = useParams()
  const { school } = useTenant()
  const { profile } = useAuth()
  
  const [report, setReport] = useState<any>(null)
  const [terms, setTerms] = useState<any[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (school?.id) {
      loadTerms()
    }
  }, [school])

  const loadTerms = async () => {
    try {
      const data = await fetchAPI('/academic/terms')
      setTerms(data)
      const current = data.find((t: any) => t.is_current)
      if (current) setSelectedTerm(current.id)
    } catch (err) {
      console.error('Failed to load terms:', err)
    }
  }

  useEffect(() => {
    if (selectedTerm && profile) {
      loadReport()
    }
  }, [selectedTerm, profile])

  const loadReport = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAPI(`/academic/report-card/${profile?.id}?term_id=${selectedTerm}`)
      setReport(data)
    } catch (err) {
      console.error('Failed to load report card:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = async () => {
    setIsGenerating(true)
    try {
      await generatePDFFromElement('report-card-canvas', `ReportCard-${profile?.custom_id}-${selectedTerm}`)
    } catch (err) {
      console.error('Failed to generate PDF:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <ChevronLeft className="w-6 h-6 text-gray-500" />
             </button>
             <div>
                <h1 className="text-3xl font-bold mb-1 text-white">Academic <span className="gradient-text">Report Card</span></h1>
                <p className="text-gray-400">Official institutional record for the selected term.</p>
             </div>
          </div>
          <div className="flex gap-3">
             <select 
               value={selectedTerm}
               onChange={(e) => setSelectedTerm(e.target.value)}
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
             >
                {terms.map(t => <option key={t.id} value={t.id} className="bg-gray-900">{t.name}</option>)}
             </select>
             <button 
               onClick={handlePrint}
               disabled={isLoading || !report || isGenerating}
               className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-black font-extrabold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
             >
                {isGenerating ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
                Print Official Copy
             </button>
          </div>
        </header>

        {isLoading ? (
           <div className="flex justify-center py-32">
              <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
           </div>
        ) : !report || report.subjects.length === 0 ? (
           <div className="premium-card py-32 text-center text-gray-500">
              <BookOpen className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p className="text-xl font-medium mb-1">No grades published yet.</p>
              <p className="text-sm">Check back once your teachers have finalized and published all subject marks.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Summary Sidebar */}
              <div className="space-y-6">
                 <div className="premium-card bg-gradient-to-br from-teal-500/10 to-transparent">
                    <Trophy className="w-10 h-10 text-teal-400 mb-4" />
                    <p className="section-label mb-1">Cumulative Average</p>
                    <h3 className="text-4xl font-black text-white mb-2">{report.overall_average}%</h3>
                    <p className="text-xs text-teal-400 font-bold uppercase tracking-widest">
                       {report.overall_average >= 90 ? 'Excellent' : report.overall_average >= 80 ? 'Very Good' : 'Good Progress'}
                    </p>
                 </div>
                 
                 <div className="premium-card">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Student Information</h4>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[10px] text-gray-600 font-bold uppercase mb-0.5">Full Name</p>
                          <p className="text-sm font-bold text-white">{report.student.full_name}</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-gray-600 font-bold uppercase mb-0.5">Institutional ID</p>
                          <p className="text-sm font-bold text-white tracking-widest">{report.student.custom_id}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Grades Table */}
              <div className="lg:col-span-3">
                 <div id="report-card-canvas" className="premium-card bg-white p-8 md:p-12 text-black shadow-2xl border-none">
                    <div className="flex justify-between items-start mb-12 border-b-4 border-black pb-8">
                       <div>
                          <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{school?.name}</h2>
                          <p className="text-sm font-bold text-gray-600">OFFICIAL ACADEMIC TRANSCRIPT</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-bold">{terms.find(t => t.id === selectedTerm)?.name}</p>
                       </div>
                       <div className="text-right">
                          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-2">
                             C
                          </div>
                          <p className="text-[10px] font-black tracking-widest">VERIFIED SYSTEM</p>
                       </div>
                    </div>

                    <table className="w-full text-left mb-12">
                       <thead>
                          <tr className="border-b-2 border-black">
                             <th className="py-4 text-xs font-black uppercase tracking-widest">Subject Description</th>
                             <th className="py-4 text-center text-xs font-black uppercase tracking-widest">Weighted Score</th>
                             <th className="py-4 text-right text-xs font-black uppercase tracking-widest">Achievement</th>
                          </tr>
                       </thead>
                       <tbody>
                          {report.subjects.map((s: any, i: number) => (
                             <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-6 font-bold text-lg">{s.subject}</td>
                                <td className="py-6 text-center font-black text-xl">{s.score}%</td>
                                <td className="py-6 text-right">
                                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                      s.score >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                      s.score >= 80 ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                   }`}>
                                      {s.score >= 90 ? 'High Honor' : s.score >= 80 ? 'Honor' : 'Pass'}
                                   </span>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>

                    <div className="grid grid-cols-2 gap-12 mt-20 pt-12 border-t-2 border-black">
                       <div className="text-center">
                          <div className="h-0.5 bg-black w-full mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Registrar Signature</p>
                       </div>
                       <div className="text-center">
                          <div className="h-0.5 bg-black w-full mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Seal</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
      </div>
    </DashboardLayout>
  )
}
