"use client"

import React from 'react'

export function CraftLogo({ className = "h-10 w-auto object-contain" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/craft-logo.png" alt="CRAFT SMS Logo" className={className} />
}
