"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ChevronRight, X, Info } from 'lucide-react'

interface DemoStep {
  target: string
  title: string
  content: string
}

const DEMO_SCENARIOS: Record<string, DemoStep[]> = {
  'OVERVIEW': [
    { target: 'kpi-grid', title: 'Institutional Pulse', content: 'Real-time KPI monitoring across all academic and financial layers.' },
    { target: 'system-pulse', title: 'Operational Status', content: 'Live activity feed showing real institutional events as they happen.' }
  ],
  'FINANCE': [
    { target: 'slip-verification', title: 'Fraud-Proof Verification', content: 'Multi-stage manual slip verification flow with audit trail.' }
  ]
}

interface DemoContextType {
  isDemoActive: boolean
  startDemo: (scenario: string) => void
  stopDemo: () => void
}

const DemoContext = createContext<DemoContextType | undefined>(undefined)

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemoActive, setIsDemoActive] = useState(false)
  const [currentScenario, setCurrentScenario] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const startDemo = (scenario: string) => {
    setCurrentScenario(scenario)
    setCurrentStep(0)
    setIsDemoActive(true)
  }

  const stopDemo = () => {
    setIsDemoActive(false)
    setCurrentScenario(null)
  }

  return (
    <DemoContext.Provider value={{ isDemoActive, startDemo, stopDemo }}>
      {children}
      
      <AnimatePresence>
        {isDemoActive && currentScenario && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6"
          >
            <div className="bg-[#0F4C81] border border-white/20 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                     <Play className="w-3 h-3 fill-current" /> Demo Scenario: {currentScenario}
                  </div>
                  <button onClick={stopDemo} className="p-1 hover:bg-white/10 rounded-lg">
                     <X className="w-4 h-4 text-white/50" />
                  </button>
               </div>
               
               <div className="mb-6">
                  <h3 className="text-sm font-black text-white mb-2">{DEMO_SCENARIOS[currentScenario][currentStep].title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{DEMO_SCENARIOS[currentScenario][currentStep].content}</p>
               </div>

               <div className="flex justify-between items-center">
                  <div className="flex gap-1">
                     {DEMO_SCENARIOS[currentScenario].map((_, i) => (
                        <div key={i} className={`h-1 w-4 rounded-full ${i === currentStep ? 'bg-cyan-400' : 'bg-white/10'}`} />
                     ))}
                  </div>
                  <button 
                    onClick={() => {
                      if (currentStep < DEMO_SCENARIOS[currentScenario].length - 1) {
                        setCurrentStep(prev => prev + 1)
                      } else {
                        stopDemo()
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all"
                  >
                    {currentStep === DEMO_SCENARIOS[currentScenario].length - 1 ? 'Finish' : 'Next Step'} <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DemoContext.Provider>
  )
}

export const useDemo = () => {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemo must be used within DemoModeProvider')
  return context
}
