import React from 'react'

export default function DownloadSection() {
  return (
    <section className="relative overflow-hidden py-16 bg-[var(--brand-surface)]">
      {/* Left image (hidden on mobile) */}
      <img
        src="/left-characters.png"
        alt=""
        className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none select-none"
      />

      {/* Right image (hidden on mobile) */}
      <img
        src="/right-characters.png"
        alt=""
        className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:block pointer-events-none select-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--color-text-dark)]">
            Download Craft SMS Now
          </h2>

          <p className="mt-5 mx-auto max-w-3xl text-base md:text-lg leading-relaxed text-[rgba(71,80,87,0.85)]">
            Complete all your messaging tasks and workflows from your tablet or smartphone with a beautiful,
            easy-to-use interface.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" aria-label="Download on the App Store">
              <img
                src="/app-store-badge.svg"
                alt="Download on the App Store"
                className="h-[52px] w-auto"
              />
            </a>
            <a href="#" aria-label="Get it on Google Play">
              <img
                src="/google-play-badge.svg"
                alt="Get it on Google Play"
                className="h-[52px] w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

