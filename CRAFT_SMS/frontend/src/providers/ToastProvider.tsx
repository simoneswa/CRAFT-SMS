"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'SUCCESS') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl min-w-[300px] ${
                toast.type === 'SUCCESS' ? 'bg-[var(--edlink-green-brand)]/10 border-[var(--edlink-green-brand)]/20 text-emerald-400' :
                toast.type === 'ERROR' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {toast.type === 'SUCCESS' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'ERROR' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'INFO' && <Info className="w-5 h-5" />}
              
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest mb-0.5">{toast.type}</p>
                <p className="text-sm font-medium text-white/90">{toast.message}</p>
              </div>

              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
