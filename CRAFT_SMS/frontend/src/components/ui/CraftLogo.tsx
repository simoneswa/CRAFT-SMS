"use client"

import React from 'react'

export function CraftLogo({ className = "h-10 w-auto object-contain" }: { className?: string }) {
  return <img src="/craft-logo.png" alt="CRAFT SMS logo" className={className} />
}
