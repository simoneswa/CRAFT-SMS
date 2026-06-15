import Image from 'next/image'
import React from 'react'

export interface LogoProps {
  variant?: 'icon' | 'full'
  width?: number
  height?: number
  className?: string
}

export const Logo = ({
  variant = 'icon',
  width,
  height,
  className = '',
}: LogoProps) => {
  const isFull = variant === 'full'

  // Default dimensions if not provided
  const defaultWidth = isFull ? 180 : 28
  const defaultHeight = isFull ? 45 : 28

  return (
    <div
      className={`relative flex items-center ${className}`}
      aria-label="CRAFT SMS"
    >
      <Image
        src={isFull ? '/assets/logo/craftsms-full.png' : '/assets/logo/craftsms-icon.png'}
        alt="CRAFT SMS"
        width={width ?? defaultWidth}
        height={height ?? defaultHeight}
        priority
        className="object-contain select-none"
      />

      {isFull && (
        <div className="sr-only">
          <h1>CRAFT SMS</h1>
          <p>Premium SaaS Management</p>
        </div>
      )}
    </div>
  )
}

