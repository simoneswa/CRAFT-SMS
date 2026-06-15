import './globals.css';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/logo/craftsms-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
