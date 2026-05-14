"use client"

import React from 'react'

export function CraftLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F4C81" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      
      {/* Hexagonal Geometry Motifs */}
      <path 
        d="M20 30 L35 21 L50 30 L50 48 L35 57 L20 48 Z" 
        fill="url(#logoGradient)" 
        fillOpacity="0.8"
      />
      <path 
        d="M50 48 L65 39 L80 48 L80 66 L65 75 L50 66 Z" 
        fill="url(#logoGradient)" 
        fillOpacity="0.6"
      />
      
      {/* Growth Arrow Motif */}
      <path 
        d="M25 65 Q40 45 60 40 L55 30 L85 45 L65 70 L60 60 Q40 65 35 85" 
        stroke="url(#logoGradient)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}
