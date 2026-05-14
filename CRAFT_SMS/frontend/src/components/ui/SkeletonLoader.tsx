"use client"

import React from 'react'

export function SkeletonLoader({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/[0.03] rounded-lg ${className}`} />
  )
}

export function SkeletonCard() {
  return (
    <div className="premium-card space-y-6">
      <div className="flex justify-between items-center">
        <SkeletonLoader className="h-8 w-1/3" />
        <SkeletonLoader className="h-8 w-8 rounded-xl" />
      </div>
      <div className="space-y-3">
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-2/3" />
      </div>
      <div className="pt-4 flex gap-3">
        <SkeletonLoader className="h-10 flex-1" />
        <SkeletonLoader className="h-10 flex-1" />
      </div>
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-white/5 items-center">
          <SkeletonLoader className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-1/4" />
            <SkeletonLoader className="h-3 w-1/3 opacity-50" />
          </div>
          <SkeletonLoader className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}
